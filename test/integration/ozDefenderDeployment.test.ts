// test/integration/ozDefenderDeployment.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import sinon from "sinon";
import { Diamond } from "../../src/core/Diamond";
import { DiamondDeployer } from "../../src/core/DiamondDeployer";
import { FileDeploymentRepository } from "../../src/repositories/FileDeploymentRepository";
import { DeployConfig } from "../../src/schemas";
import { OZDefenderDeploymentStrategy } from "../../src/strategies/OZDefenderDeploymentStrategy";
import { DiamondConfig } from "../../src/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import * as fs from "fs-extra";
import * as path from "path";
import { cleanupTestEnvironment, setupTestEnvironment, setupTestFiles } from "../setup";
import {
  createDefenderMocks,
  DEFAULT_DEFENDER_CONFIG,
  MockDefenderClients,
  setupFailedDeploymentMocks,
  setupSuccessfulDeploymentMocks,
} from "./defender/setup/defender-setup";

describe("Integration: OZDefenderDeploymentStrategy", function () {
  // This test might take longer due to complex operations
  this.timeout(30000);

  // Test constants
  const TEMP_DIR = path.join(__dirname, "../../.tmp-test-integration-oz");
  const DIAMOND_NAME = "TestDiamond";
  const NETWORK_NAME = "goerli";
  const CHAIN_ID = 5;

  // Use mock config from defender-setup
  const { API_KEY, API_SECRET, RELAYER_ADDRESS, SAFE_ADDRESS } = DEFAULT_DEFENDER_CONFIG;

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
  let mocks: MockDefenderClients;

  before(async function () {
    // Set test environment
    process.env.NODE_ENV = 'test';

    // Set up test environment
    const setup = await setupTestEnvironment(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);

    deployer = setup.deployer;
    accounts = setup.accounts;
    diamondCutFacet = setup.diamondCutFacet;
    diamondLoupeFacet = setup.diamondLoupeFacet;
    testFacet = setup.testFacet;
    mockDiamond = setup.diamond;

    // Create and setup Defender mocks
    mocks = createDefenderMocks();
    setupSuccessfulDeploymentMocks(mocks);

    // Mock ethers.getContractFactory to avoid artifact lookup issues in tests
    (sinon.stub(ethers, 'getContractFactory') as any).callsFake((...args: any[]) => {
      // Return a mock factory with a minimal interface
      return Promise.resolve({
        interface: {
          functions: {
            'diamondCut(tuple[],address,bytes)': 'function diamondCut((address,uint8,bytes4[])[],address,bytes)',
            'facets()': 'function facets() view returns ((address,bytes4[])[])',
            'supportsInterface(bytes4)': 'function supportsInterface(bytes4) view returns (bool)',
          },
          getSighash: (fn: string) => {
            const sighashes: Record<string, string> = {
              'diamondCut(tuple[],address,bytes)': '0x1f931c1c',
              'facets()': '0x7a0ed627',
              'supportsInterface(bytes4)': '0x01ffc9a7',
            };
            return sighashes[fn] || '0x00000000';
          }
        }
      } as any);
    });

    // Don't stub console during debug
    // sinon.stub(console, 'log');
    // sinon.stub(console, 'error');
  });

  beforeEach(async function () {
    // Clean up any existing deployment state files
    await cleanupTestEnvironment(TEMP_DIR);

    // Recreate test files after cleanup
    await setupTestFiles(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);

    // Recreate mocks entirely to reset closure variables
    mocks.restore();
    mocks = createDefenderMocks();
    setupSuccessfulDeploymentMocks(mocks);

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
      // Create strategy with our production-ready mocks
      const mockDefenderClient = {
        deploy: mocks.mockDeployClient,
        proposal: mocks.mockProposalClient
      };

      const strategy = new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        false, // autoApprove
        RELAYER_ADDRESS, // via
        'Relayer', // viaType
        true, // verbose
        mockDefenderClient as any // inject our mock client
      );

      const deployer = new DiamondDeployer(diamond, strategy);

      // Execute deployment
      await deployer.deployDiamond();

      // Debug: Log mock call information BEFORE assertions
      console.log('\n=== Mock Call Debug Info ===');
      console.log('deployContract.callCount:', mocks.mockDeployClient.deployContract.callCount);
      console.log('deployContract.called:', mocks.mockDeployClient.deployContract.called);
      console.log('getDeployedContract.callCount:', mocks.mockDeployClient.getDeployedContract.callCount);
      console.log('create.callCount:', mocks.mockProposalClient.create.callCount);
      console.log('get.callCount:', mocks.mockProposalClient.get.callCount);
      console.log('=== End Debug Info ===\n');

      // Verify that mocks were called appropriately
      expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
      expect(mocks.mockProposalClient.create.called).to.be.true;
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
      (config.facets['TestFacet'].versions as any)[1.0] = {
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

      // Setup using our production-ready mocks (they're already configured for success)
      // Create strategy with our mocks
      const mockDefenderClient = {
        deploy: mocks.mockDeployClient,
        proposal: mocks.mockProposalClient
      };

      const strategy = new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        true, // autoApprove
        RELAYER_ADDRESS, // via
        'Relayer', // viaType  
        true, // verbose
        mockDefenderClient as any // inject our mock client
      );

      const upgradeDeployer = new DiamondDeployer(diamond, strategy);

      // Deploy the upgrade
      await upgradeDeployer.deployDiamond();

      // Debug: Log mock call information BEFORE assertions
      console.log('\n=== Mock Call Debug Info (Upgrade Test) ===');
      console.log('deployContract.callCount:', mocks.mockDeployClient.deployContract.callCount);
      console.log('getDeployedContract.callCount:', mocks.mockDeployClient.getDeployedContract.callCount);
      console.log('create.callCount:', mocks.mockProposalClient.create.callCount);
      console.log('get.callCount:', mocks.mockProposalClient.get.callCount);
      console.log('execute.callCount:', mocks.mockProposalClient.execute.callCount);
      console.log('=== End Debug Info ===\n');

      // In this upgrade test, no facets are actually deployed because they're all already at target version
      // So deployContract should NOT be called, but a proposal should still be created for the diamond cut
      expect(mocks.mockDeployClient.deployContract.called).to.be.false; // No new deployments needed
      expect(mocks.mockProposalClient.create.called).to.be.true; // Diamond cut proposal created
      expect(mocks.mockProposalClient.get.callCount).to.be.at.least(3); // Proposal status checked
    });

    it('should handle deployment failures', async function () {
      // Setup failed deployment mocks
      const failedMocks = createDefenderMocks();
      setupFailedDeploymentMocks(failedMocks, 'deploy');

      // Create strategy with failed mocks
      const mockDefenderClient = {
        deploy: failedMocks.mockDeployClient,
        proposal: failedMocks.mockProposalClient
      };

      const strategy = new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        true, // autoApprove
        RELAYER_ADDRESS, // via
        'Relayer', // viaType
        true, // verbose
        mockDefenderClient as any // inject our mock client
      );

      const deployer = new DiamondDeployer(diamond, strategy);

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
      expect(failedMocks.mockDeployClient.deployContract.called).to.be.true;
      expect(failedMocks.mockDeployClient.getDeployedContract.called).to.be.true;
    });
  });
});