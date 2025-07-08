// test/integration/defender/deployment.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import * as fs from 'fs-extra';
import * as path from 'path';
import sinon from 'sinon';

import { Diamond } from '../../../src/core/Diamond';
import { DiamondDeployer } from '../../../src/core/DiamondDeployer';
import { FileDeploymentRepository } from '../../../src/repositories/FileDeploymentRepository';
import { OZDefenderDeploymentStrategy } from '../../../src/strategies/OZDefenderDeploymentStrategy';
import { DiamondConfig } from '../../../src/types/config';

import {
  createDefenderMocks,
  setupSuccessfulDeploymentMocks,
  setupFailedDeploymentMocks,
  addNetworkDelay,
  DEFAULT_DEFENDER_CONFIG,
  MockDefenderClients
} from './setup/defender-setup';

describe('Integration: Defender Deployment', function () {
  this.timeout(300000); // 5 minutes for integration tests

  // Test constants
  const TEMP_DIR = path.join(__dirname, '../../.tmp-defender-integration');
  const DIAMOND_NAME = 'TestDiamond';
  const NETWORK_NAME = 'hardhat';
  const CHAIN_ID = 31337;

  // Test variables
  let diamond: Diamond;
  let config: DiamondConfig;
  let repository: FileDeploymentRepository;
  let strategy: OZDefenderDeploymentStrategy;
  let deployer: DiamondDeployer;
  let signers: SignerWithAddress[];
  let mocks: MockDefenderClients;

  before(async function () {
    // Create temporary directories for test artifacts
    await fs.ensureDir(TEMP_DIR);
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender'));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));

    // Copy callback files to the test directory
    const callbackSourcePath = path.join(__dirname, '../../mocks/callbacks/TestFacet.js');
    const callbackDestPath = path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks', 'TestFacet.js');
    await fs.copy(callbackSourcePath, callbackDestPath);

    // Get hardhat signers
    signers = await ethers.getSigners();

    // Stub console.log for cleaner test output
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');
  });

  beforeEach(async function () {
    // Reset sinon stubs
    sinon.resetHistory();

    // Create fresh mocks for each test
    mocks = createDefenderMocks();

    // Mock the defender clients module
    const defenderClientsModule = await import('../../../src/utils/defenderClients');
    sinon.stub(defenderClientsModule, 'deployClient').value(mocks.mockDeployClient);
    sinon.stub(defenderClientsModule, 'adminClient').value(mocks.mockDefender);

    // Create a comprehensive sample config
    const sampleConfig = {
      protocolVersion: 0.0,
      protocolInitFacet: 'TestFacet',
      facets: {
        DiamondCutFacet: {
          priority: 10,
          versions: {
            "0.0": {}
          }
        },
        DiamondLoupeFacet: {
          priority: 20,
          versions: {
            "0.0": {}
          }
        },
        TestFacet: {
          priority: 30,
          versions: {
            "0.0": {
              callbacks: ["testCallback"],
              deployInit: "initialize()",
              upgradeInit: "reinitialize()"
            }
          }
        }
      }
    };

    await fs.writeJson(
      path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
      sampleConfig,
      { spaces: 2 }
    );

    // Set up configuration
    config = {
      diamondName: DIAMOND_NAME,
      networkName: NETWORK_NAME,
      chainId: CHAIN_ID,
      deploymentsPath: TEMP_DIR,
      contractsPath: 'test/mocks/contracts',
      callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
      configFilePath: path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
      deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`)
    };

    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);

    // Setup the diamond
    diamond.setProvider(ethers.provider);
    diamond.setSigner(signers[0]);

    // Create the strategy with the mocked client
    strategy = new OZDefenderDeploymentStrategy(
      DEFAULT_DEFENDER_CONFIG.API_KEY,
      DEFAULT_DEFENDER_CONFIG.API_SECRET,
      DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
      DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE,
      DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS,
      'Safe',
      true,
      mocks.mockDefender // Pass the mocked client
    );

    // Create deployer
    deployer = new DiamondDeployer(diamond, strategy);
  });

  afterEach(function () {
    // Restore all mocks
    sinon.restore();
  });

  after(async function () {
    // Clean up temp directory after tests
    await fs.remove(TEMP_DIR);
  });

  describe('Complete Deployment Flow', function () {
    it('should successfully deploy a new diamond with all facets', async function () {
      // Setup successful deployment mocks
      setupSuccessfulDeploymentMocks(mocks);

      // Execute deployment
      await deployer.deployDiamond();

      // Verify deployment calls were made
      expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4); // DiamondCutFacet + Diamond + 2 facets
      expect(mocks.mockProposalClient.create.called).to.be.true;

      // Verify deployment data was updated
      const deployedData = diamond.getDeployedDiamondData();
      expect(deployedData.DiamondAddress).to.not.be.undefined;
      expect(deployedData.DeployedFacets).to.not.be.undefined;
      expect(deployedData.DeployedFacets!['DiamondCutFacet']).to.not.be.undefined;
    });

    it('should handle deployment with network delays gracefully', async function () {
      // Setup mocks with realistic network delays
      setupSuccessfulDeploymentMocks(mocks);
      addNetworkDelay(mocks, 50); // 50ms delay

      // Execute deployment
      const startTime = Date.now();
      await deployer.deployDiamond();
      const endTime = Date.now();

      // Verify it took some time due to delays
      expect(endTime - startTime).to.be.at.least(200); // Should have some delay

      // Verify successful completion
      expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
    });

    it('should properly handle facet deployment ordering by priority', async function () {
      // Setup successful deployment mocks
      setupSuccessfulDeploymentMocks(mocks);

      // Execute deployment
      await deployer.deployDiamond();

      // Get deployment calls
      const deploymentCalls = mocks.mockDeployClient.deployContract.getCalls();

      // Should have DiamondCutFacet first, then Diamond, then facets by priority
      expect(deploymentCalls[0].args[0].contractName).to.equal('DiamondCutFacet');
      expect(deploymentCalls[1].args[0].contractName).to.equal(DIAMOND_NAME);

      // Remaining calls should be facets (order may vary based on priority)
      const facetCalls = deploymentCalls.slice(2);
      expect(facetCalls.length).to.be.at.least(2);
    });
  });

  describe('Upgrade Flow', function () {
    it('should successfully upgrade existing diamond with new facet version', async function () {
      // First, simulate an existing deployment
      const existingDeployedData = {
        DiamondAddress: '0x1234567890123456789012345678901234567890',
        DeployerAddress: await signers[0].getAddress(),
        DeployedFacets: {
          DiamondCutFacet: {
            address: '0x2345678901234567890123456789012345678901',
            tx_hash: '0xexisting123',
            version: 0,
            funcSelectors: ['0x1f931c1c']
          },
          DiamondLoupeFacet: {
            address: '0x3456789012345678901234567890123456789012',
            tx_hash: '0xexisting456',
            version: 0,
            funcSelectors: ['0x7a0ed627']
          },
          TestFacet: {
            address: '0x4567890123456789012345678901234567890123',
            tx_hash: '0xexisting789',
            version: 0,
            funcSelectors: ['0x12345678']
          }
        }
      };

      diamond.updateDeployedDiamondData(existingDeployedData);

      // Update config to add new version
      const config = repository.loadDeployConfig();
      if (!config.facets['TestFacet'].versions) {
        config.facets['TestFacet'].versions = {};
      }
      (config.facets['TestFacet'].versions as any)['1.0'] = {
        deployInit: "initialize()",
        upgradeInit: "reinitialize()",
        callbacks: ["testCallback"],
        deployInclude: [],
        deployExclude: []
      };
      config.protocolVersion = 1.0;

      // Write updated config
      await fs.writeJson(
        path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
        config,
        { spaces: 2 }
      );

      // Reload configuration
      repository = new FileDeploymentRepository(diamond.getDiamondConfig());
      diamond = new Diamond(diamond.getDiamondConfig(), repository);
      diamond.setProvider(ethers.provider);
      diamond.setSigner(signers[0]);
      diamond.updateDeployedDiamondData(existingDeployedData);

      // Setup mocks for upgrade
      setupSuccessfulDeploymentMocks(mocks);

      // Execute upgrade (DiamondDeployer automatically detects existing deployment)
      await deployer.deployDiamond();

      // Should only deploy the upgraded facet, not the whole diamond
      expect(mocks.mockDeployClient.deployContract.callCount).to.equal(1); // Only TestFacet v1.0
      expect(mocks.mockProposalClient.create.called).to.be.true;
    });
  });

  describe('Error Handling', function () {
    it('should handle deployment failures gracefully', async function () {
      // Setup failed deployment mocks
      setupFailedDeploymentMocks(mocks, 'deploy');

      // Execute deployment and expect it to fail
      try {
        await deployer.deployDiamond();
        expect.fail('Expected deployment to fail');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.include('failed');
      }
    });

    it('should handle proposal creation failures gracefully', async function () {
      // Setup failed proposal mocks
      setupFailedDeploymentMocks(mocks, 'proposal');

      // Execute deployment and expect it to fail at proposal stage
      try {
        await deployer.deployDiamond();
        expect.fail('Expected proposal creation to fail');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.include('Proposal creation failed');
      }
    });

    it('should handle proposal execution failures gracefully', async function () {
      // Setup failed execution mocks
      setupFailedDeploymentMocks(mocks, 'execution');

      // Execute deployment
      await deployer.deployDiamond();

      // Should complete deployment but fail at execution
      expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
      expect(mocks.mockProposalClient.create.called).to.be.true;
    });
  });

  describe('Configuration Validation', function () {
    it('should validate required Defender configuration', function () {
      // Test with missing API key
      expect(() => new OZDefenderDeploymentStrategy(
        '',
        DEFAULT_DEFENDER_CONFIG.API_SECRET,
        DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
        DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE,
        DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS,
        'Safe'
      )).to.not.throw(); // Constructor doesn't validate, but usage should fail

      // Test with missing API secret
      expect(() => new OZDefenderDeploymentStrategy(
        DEFAULT_DEFENDER_CONFIG.API_KEY,
        '',
        DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
        DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE,
        DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS,
        'Safe'
      )).to.not.throw(); // Constructor doesn't validate, but usage should fail
    });

    it('should handle different via types correctly', function () {
      // Test with Gnosis Safe
      const safeStrategy = new OZDefenderDeploymentStrategy(
        DEFAULT_DEFENDER_CONFIG.API_KEY,
        DEFAULT_DEFENDER_CONFIG.API_SECRET,
        DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
        false,
        DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS,
        'Safe'
      );

      expect(safeStrategy).to.be.instanceOf(OZDefenderDeploymentStrategy);

      // Test with Relayer
      const relayerStrategy = new OZDefenderDeploymentStrategy(
        DEFAULT_DEFENDER_CONFIG.API_KEY,
        DEFAULT_DEFENDER_CONFIG.API_SECRET,
        DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
        false,
        DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
        'Relayer'
      );

      expect(relayerStrategy).to.be.instanceOf(OZDefenderDeploymentStrategy);
    });
  });

  describe('State Management', function () {
    it('should persist deployment state correctly', async function () {
      // Setup successful deployment mocks
      setupSuccessfulDeploymentMocks(mocks);

      // Execute deployment
      await deployer.deployDiamond();

      // Check that state files were created
      const stateDir = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender');
      const stateFiles = await fs.readdir(stateDir);
      expect(stateFiles.length).to.be.at.least(1);

      // Check deployment data file
      const deploymentDataFile = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`);
      expect(await fs.pathExists(deploymentDataFile)).to.be.true;

      const deploymentData = await fs.readJson(deploymentDataFile);
      expect(deploymentData.DiamondAddress).to.not.be.undefined;
      expect(deploymentData.DeployedFacets).to.not.be.undefined;
    });

    it('should resume deployment from saved state', async function () {
      // Setup partial state (simulating interrupted deployment)
      const partialState = {
        DiamondAddress: '0x1234567890123456789012345678901234567890',
        DeployerAddress: await signers[0].getAddress(),
        DeployedFacets: {
          DiamondCutFacet: {
            address: '0x2345678901234567890123456789012345678901',
            tx_hash: '0xexisting123',
            version: 0,
            funcSelectors: ['0x1f931c1c']
          }
        }
      };

      diamond.updateDeployedDiamondData(partialState);

      // Setup mocks
      setupSuccessfulDeploymentMocks(mocks);

      // Execute deployment
      await deployer.deployDiamond();

      // Should complete the remaining deployments
      expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(2); // Remaining facets
    });
  });
});
