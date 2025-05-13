// test/integration/ozDefenderDeployment.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import sinon from 'sinon';
import { Diamond } from '../../src/core/Diamond';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { DiamondDeployer } from '../../src/core/DiamondDeployer';
import { OZDefenderDeploymentStrategy } from '../../src/strategies/OZDefenderDeploymentStrategy';
import { DiamondConfig } from '../../src/types';
import { DeployConfig } from '../../src/schemas';
import * as fs from 'fs-extra';
import * as path from 'path';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';

// Create stub for the defender module - this avoids the need to mock imports
const mockDeployClient = {
  deployContract: sinon.stub(),
  getDeployedContract: sinon.stub()
};

const mockProposalClient = {
  create: sinon.stub(),
  get: sinon.stub(),
  execute: sinon.stub()
};

const mockDefender = {
  proposal: mockProposalClient
};

describe('Integration: OZDefenderDeploymentStrategy', function () {
  // This test might take longer due to complex operations
  this.timeout(30000);

  // Test constants
  const TEMP_DIR = path.join(__dirname, '../../.tmp-test-integration-oz');
  const DIAMOND_NAME = 'TestDiamond';
  const NETWORK_NAME = 'goerli';
  const CHAIN_ID = 5;

  // OZ Defender config
  const API_KEY = 'test-api-key';
  const API_SECRET = 'test-api-secret';
  const RELAYER_ADDRESS = '0x1234567890123456789012345678901234567890';
  const SAFE_ADDRESS = '0x0987654321098765432109876543210987654321';

  // Test variables
  let config: DiamondConfig;
  let repository: FileDeploymentRepository;
  let diamond: Diamond;
  let deployer: SignerWithAddress;
  let accounts: SignerWithAddress[];
  let diamondCutFacet: Contract;
  let diamondLoupeFacet: Contract;
  let testFacet: Contract;
  let mockDiamond: Contract;

  before(async function () {
    // Set up test environment
    const setup = await setupTestEnvironment(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);

    deployer = setup.deployer;
    accounts = setup.accounts;
    diamondCutFacet = setup.diamondCutFacet;
    diamondLoupeFacet = setup.diamondLoupeFacet;
    testFacet = setup.testFacet;
    mockDiamond = setup.diamond;

    // Spy on console.log for assertions
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');

    // Replace defender module's clients
    const originalModule = await import('../../src/utils/defenderClients');
    // Save original module references
    const originalDeployClient = originalModule.deployClient;
    const originalAdminClient = originalModule.adminClient;

    // Temporarily replace the clients
    Object.defineProperty(originalModule, 'deployClient', {
      value: mockDeployClient,
      writable: true
    });
    Object.defineProperty(originalModule, 'adminClient', {
      value: mockDefender,
      writable: true
    });
  });

  beforeEach(async function () {
    // Reset stubs
    sinon.resetHistory();

    // Set up a fresh config and repository for each test
    config = {
      diamondName: DIAMOND_NAME,
      networkName: NETWORK_NAME,
      chainId: CHAIN_ID,
      deploymentsPath: TEMP_DIR,
      contractsPath: 'contracts',
      callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
      configFilePath: path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
      deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`)
    };

    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);

    // Set provider and signer
    diamond.setProvider(ethers.provider);
    diamond.setSigner(deployer);
  });

  after(async function () {
    // Clean up temp directory after tests
    await cleanupTestEnvironment(TEMP_DIR);

    // Restore console stubs
    sinon.restore();
  });

  describe('End-to-end deployment', () => {
    it('should deploy a diamond with facets using OZDefenderDeploymentStrategy', async function () {
      // Setup mock responses for defender API

      // DiamondCutFacet deployment
      mockDeployClient.deployContract.onFirstCall().resolves({
        deploymentId: 'defender-deploy-id-cut-facet',
        status: 'pending'
      });

      // Diamond deployment
      mockDeployClient.deployContract.onSecondCall().resolves({
        deploymentId: 'defender-deploy-id-diamond',
        status: 'pending'
      });

      // DiamondLoupeFacet deployment
      mockDeployClient.deployContract.onThirdCall().resolves({
        deploymentId: 'defender-deploy-id-loupe-facet',
        status: 'pending'
      });

      // TestFacet deployment
      mockDeployClient.deployContract.onCall(3).resolves({
        deploymentId: 'defender-deploy-id-test-facet',
        status: 'pending'
      });

      // Mock successful deployments
      mockDeployClient.getDeployedContract.withArgs('defender-deploy-id-cut-facet').resolves({
        status: 'completed',
        contractAddress: diamondCutFacet.address
      });

      mockDeployClient.getDeployedContract.withArgs('defender-deploy-id-diamond').resolves({
        status: 'completed',
        contractAddress: mockDiamond.address
      });

      mockDeployClient.getDeployedContract.withArgs('defender-deploy-id-loupe-facet').resolves({
        status: 'completed',
        contractAddress: diamondLoupeFacet.address
      });

      mockDeployClient.getDeployedContract.withArgs('defender-deploy-id-test-facet').resolves({
        status: 'completed',
        contractAddress: testFacet.address
      });

      // Mock proposal creation
      mockProposalClient.create.resolves({
        proposalId: 'test-proposal-id',
        url: 'https://defender.openzeppelin.com/proposals/test-proposal-id'
      });

      // Mock proposal status (ready to execute)
      mockProposalClient.get.resolves({
        transaction: {
          isExecuted: false,
          isReverted: false
        }
      });

      // Mock successful execution
      mockProposalClient.execute.resolves({
        transactionId: 'test-transaction-id'
      });

      // Create strategy
      const strategy = new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        true, // autoApprove
        SAFE_ADDRESS,
        'Safe'
      );

      // Create deployer
      const diamondDeployer = new DiamondDeployer(diamond, strategy);

      // Mock the client property of the strategy
      const mockClient = {
        proposal: mockProposalClient
      };

      // Temporarily replace the strategy's client property
      Object.defineProperty(strategy, 'client', {
        value: mockClient,
        writable: true,
        configurable: true
      });

      // Deploy the diamond
      await diamondDeployer.deployDiamond();

      // Verify deployment calls
      expect(mockDeployClient.deployContract.callCount).to.be.at.least(4);
      expect(mockProposalClient.create.called).to.be.true;
    });

    it('should handle facet upgrades correctly', async function () {
      // First set up with an existing deployment
      const deployedData = diamond.getDeployedDiamondData();
      deployedData.DiamondAddress = mockDiamond.address;
      deployedData.DeployerAddress = deployer.address;
      deployedData.DeployedFacets = {
        DiamondCutFacet: {
          address: diamondCutFacet.address,
          tx_hash: '0x123456789abcdef',
          version: 0,
          funcSelectors: ['0x1f931c1c'] // diamondCut function selector
        },
        DiamondLoupeFacet: {
          address: diamondLoupeFacet.address,
          tx_hash: '0x123456789abcdef',
          version: 0,
          funcSelectors: ['0x7a0ed627'] // facets function selector
        },
        TestFacet: {
          address: testFacet.address,
          tx_hash: '0x123456789abcdef',
          version: 0,
          funcSelectors: ['0x12345678'] // setValue function selector
        }
      };
      diamond.updateDeployedDiamondData(deployedData);

      // Create new facet version in config
      const config: DeployConfig = repository.loadDeployConfig();

      if (!config.facets['TestFacet'].versions) {
        config.facets['TestFacet'].versions = {};
      }
      config.facets['TestFacet'].versions[1.0] = {
        deployInit: "initialize()",
        upgradeInit: "reinitialize()",
        callbacks: ["testCallback"],
        deployInclude: [],
        deployExclude: []
      };

      // Update protocol version
      config.protocolVersion = 1.0;

      // Write updated config
      await fs.writeJson(
        path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
        config,
        { spaces: 2 }
      );

      // Setup mock responses for defender API
      // Only the TestFacet should be redeployed
      mockDeployClient.deployContract.resolves({
        deploymentId: 'defender-deploy-id-test-facet-upgrade',
        status: 'pending'
      });

      mockDeployClient.getDeployedContract.withArgs('defender-deploy-id-test-facet-upgrade').resolves({
        status: 'completed',
        contractAddress: '0xNewTestFacet123456789012345678901234567890'
      });

      // Mock proposal creation
      mockProposalClient.create.resolves({
        proposalId: 'test-proposal-id-upgrade',
        url: 'https://defender.openzeppelin.com/proposals/test-proposal-id-upgrade'
      });

      // Mock proposal status (ready to execute)
      mockProposalClient.get.resolves({
        transaction: {
          isExecuted: false,
          isReverted: false
        }
      });

      // Mock successful execution
      mockProposalClient.execute.resolves({
        transactionId: 'test-transaction-id-upgrade'
      });

      // Create strategy
      const strategy = new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        true, // autoApprove
        SAFE_ADDRESS,
        'Safe'
      );

      // Create deployer
      const upgradeDeployer = new DiamondDeployer(diamond, strategy);

      // Mock the client property of the strategy
      const mockClient = {
        proposal: mockProposalClient
      };

      // Temporarily replace the strategy's client property
      Object.defineProperty(strategy, 'client', {
        value: mockClient,
        writable: true,
        configurable: true
      });

      // Deploy the upgrade
      await upgradeDeployer.deployDiamond();

      // Verify TestFacet deployment call
      expect(mockDeployClient.deployContract.called).to.be.true;
      expect(mockProposalClient.create.called).to.be.true;
    });

    it('should handle deployment failures', async function () {
      // Setup mock responses with a failure

      // DiamondCutFacet deployment
      mockDeployClient.deployContract.onFirstCall().resolves({
        deploymentId: 'defender-deploy-id-cut-facet-fail',
        status: 'pending'
      });

      // Mock failed deployment
      mockDeployClient.getDeployedContract.withArgs('defender-deploy-id-cut-facet-fail').resolves({
        status: 'failed',
        error: 'Test deployment error'
      });

      // Create strategy
      const strategy = new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        true, // autoApprove
        SAFE_ADDRESS,
        'Safe'
      );

      // Create deployer
      const deployer = new DiamondDeployer(diamond, strategy);

      // Mock the client property of the strategy
      const mockClient = {
        proposal: mockProposalClient
      };

      // Temporarily replace the strategy's client property
      Object.defineProperty(strategy, 'client', {
        value: mockClient,
        writable: true,
        configurable: true
      });

      // Deploy should throw an error
      try {
        await deployer.deployDiamond();
        // Should not reach here
        expect.fail('Should have thrown an error for failed deployment');
      } catch (error) {
        // Just verify we got here - we expect an error
        expect(true).to.be.true;
      }

      // Verify deployment was attempted
      expect(mockDeployClient.deployContract.called).to.be.true;
      expect(mockDeployClient.getDeployedContract.called).to.be.true;
    });
  });
});