// test/unit/strategies/OZDefenderDeploymentStrategy.test.ts
import { expect } from 'chai';
import hre from "hardhat";;
import sinon from 'sinon';
import { Diamond } from '../../../src/core/Diamond';
import { OZDefenderDeploymentStrategy } from '../../../src/strategies/OZDefenderDeploymentStrategy';
import { FileDeploymentRepository } from '../../../src/repositories/FileDeploymentRepository';
import { DiamondConfig, RegistryFacetCutAction, FacetCutAction } from '../../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { JsonRpcProvider } from '@ethersproject/providers';

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

// Create a stub for defenderClients module
const defenderClientsStub = {
  deployClient: mockDeployClient,
  adminClient: mockDefender
};

describe('OZDefenderDeploymentStrategy', () => {
  // Test constants
  const TEMP_DIR = path.join(__dirname, '../../../.tmp-test');
  const DIAMOND_NAME = 'TestDiamond';
  const NETWORK_NAME = 'hardhat';
  const CHAIN_ID = 31337;

  // Test variables
  let diamond: Diamond;
  let config: DiamondConfig;
  let repository: FileDeploymentRepository;
  let strategy: OZDefenderDeploymentStrategy;
  let signers: HardhatEthersSigner[];
  let provider: JsonRpcProvider;

  // OZ Defender config
  const API_KEY = 'test-api-key';
  const API_SECRET = 'test-api-secret';
  const RELAYER_ADDRESS = '0x1234567890123456789012345678901234567890';
  const SAFE_ADDRESS = '0x0987654321098765432109876543210987654321';

  before(async () => {
    // Create temporary directories for test artifacts
    await fs.ensureDir(TEMP_DIR);
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender'));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));

    // Create a sample config
    const sampleConfig = {
      protocolVersion: 0.0,
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

    // Get hardhat signers and provider
    signers = await hre.ethers.getSigners();
    provider = hre.ethers.provider;

    // Stub console.log for testing
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');
  });

  beforeEach(async () => {
    // Reset sinon stubs
    sinon.resetHistory();

    // Reset mock stubs completely
    mockDeployClient.deployContract.resetHistory();
    mockDeployClient.getDeployedContract.resetHistory();
    mockProposalClient.create.resetHistory();
    mockProposalClient.get.resetHistory();
    mockProposalClient.execute.resetHistory();

    // Set up default mock responses
    mockDeployClient.deployContract.resolves({
      deploymentId: 'defender-deploy-id-default',
      status: 'pending'
    });

    mockDeployClient.getDeployedContract.resolves({
      status: 'completed',
      address: '0x1234567890123456789012345678901234567890',
      contractAddress: '0x1234567890123456789012345678901234567890'
    });

    mockProposalClient.create.resolves({
      proposalId: 'test-proposal-id',
      url: 'https://defender.openzeppelin.com/proposal/test-proposal-id'
    });

    mockProposalClient.get.resolves({
      proposalId: 'test-proposal-id',
      status: 'approved'
    });

    mockProposalClient.execute.resolves({
      proposalId: 'test-proposal-id',
      status: 'executed'
    });

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

    // Clean up any existing deployment files to ensure clean state
    const deploymentFile = config.deployedDiamondDataFilePath;
    if (deploymentFile && await fs.pathExists(deploymentFile)) {
      await fs.remove(deploymentFile);
    }

    // Clean up any existing defender store files 
    const defenderStoreDir = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender');
    if (await fs.pathExists(defenderStoreDir)) {
      await fs.remove(defenderStoreDir);
    }

    // Create the config file for the diamond
    const configFile = config.configFilePath;
    if (configFile) {
      await fs.ensureFile(configFile);
      const testConfig = {
        "protocolVersion": 0.0,
        "facets": {
          "MockDiamondCutFacet": {
            "priority": 10,
            "versions": {
              "0.0": {}
            }
          },
          "MockDiamondLoupeFacet": {
            "priority": 20,
            "versions": {
              "0.0": {}
            }
          },
          "MockTestFacet": {
            "priority": 40,
            "versions": {
              "0.0": {
                "callbacks": [
                  "createXMPLToken"
                ]
              }
            }
          }
        }
      };
      await fs.writeJson(configFile, testConfig, { spaces: 2 });
    }

    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);

    // Setup the diamond
    diamond.setProvider(provider);
    diamond.setSigner(signers[0]);

    // Ensure diamond has clean state
    diamond.updateDeployedDiamondData({
      DiamondAddress: "",
      DeployerAddress: "",
      DeployedFacets: {},
      ExternalLibraries: {},
      protocolVersion: 0,
    });

    // Create the strategy with a mock Defender client
    const mockDefenderClient = {
      deploy: mockDeployClient,
      proposal: mockProposalClient
    };

    strategy = new OZDefenderDeploymentStrategy(
      API_KEY,
      API_SECRET,
      RELAYER_ADDRESS,
      false, // autoApprove - disabled for unit tests to avoid polling loops
      SAFE_ADDRESS,
      'Safe',
      true, // verbose
      mockDefenderClient as any // customClient
    );
  });

  after(async () => {
    // Clean up temp directory after tests
    await fs.remove(TEMP_DIR);

    // Restore sinon stubs
    sinon.restore();
  });

  describe('initialization', () => {
    it('should initialize with the correct configuration', () => {
      // Since most properties are private, we mainly test that it doesn't throw
      expect(() => new OZDefenderDeploymentStrategy(
        API_KEY,
        API_SECRET,
        RELAYER_ADDRESS,
        true,
        SAFE_ADDRESS,
        'Safe'
      )).to.not.throw();
    });
  });

  describe('deployDiamondTasks', () => {
    it('should submit DiamondCutFacet and Diamond deployment to Defender', async () => {
      // Setup mock responses
      mockDeployClient.deployContract.onFirstCall().resolves({
        deploymentId: 'defender-deploy-id-cut-facet',
        status: 'pending'
      });

      mockDeployClient.deployContract.onSecondCall().resolves({
        deploymentId: 'defender-deploy-id-diamond',
        status: 'pending'
      });

      mockDeployClient.getDeployedContract.resolves({
        status: 'completed',
        address: '0x1234567890123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890'
      });

      // Execute the protected method via reflection
      const deployDiamondTasks = Object.getPrototypeOf(strategy).constructor.prototype.deployDiamondTasks;
      await deployDiamondTasks.call(strategy, diamond);

      // Verify the deployContract was called twice with correct args
      expect(mockDeployClient.deployContract.calledTwice).to.be.true;

      const firstCallArgs = mockDeployClient.deployContract.firstCall.args[0];
      expect(firstCallArgs.contractName).to.equal('MockDiamondCutFacet');
      expect(firstCallArgs.network).to.equal(NETWORK_NAME);

      const secondCallArgs = mockDeployClient.deployContract.secondCall.args[0];
      expect(secondCallArgs.contractName).to.equal('MockDiamond'); // Mapped from TestDiamond
      expect(secondCallArgs.network).to.equal(NETWORK_NAME);
    });
  });

  describe('deployFacetsTasks', () => {
    it('should submit facet deployments to Defender', async () => {
      // Setup mock responses for facet deployments
      mockDeployClient.deployContract.resolves({
        deploymentId: 'defender-deploy-id-facet',
        status: 'pending'
      });

      mockDeployClient.getDeployedContract.resolves({
        status: 'completed',
        address: '0x1234567890123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890'
      });

      // Execute the protected method via reflection
      const deployFacetsTasks = Object.getPrototypeOf(strategy).constructor.prototype.deployFacetsTasks;
      await deployFacetsTasks.call(strategy, diamond);

      // Should be called 3 times for our 3 facets
      expect(mockDeployClient.deployContract.callCount).to.equal(3);

      // Check each call is for a different facet
      const facets = ['MockDiamondCutFacet', 'MockDiamondLoupeFacet', 'MockTestFacet'];
      for (let i = 0; i < mockDeployClient.deployContract.callCount; i++) {
        const args = mockDeployClient.deployContract.getCall(i).args[0];
        expect(facets).to.include(args.contractName);
      }
    });

    it('should skip already deployed facets', async () => {
      // Set an existing deployment for one facet
      const deployedData = diamond.getDeployedDiamondData();
      deployedData.DeployedFacets = {
        MockDiamondCutFacet: {
          address: '0x1234567890123456789012345678901234567890',
          tx_hash: '0x123456789abcdef',
          version: 0,
          funcSelectors: ['0x12345678']
        }
      };
      diamond.updateDeployedDiamondData(deployedData);

      // Setup mock responses for facet deployments
      mockDeployClient.deployContract.resolves({
        deploymentId: 'defender-deploy-id-facet',
        status: 'pending'
      });

      mockDeployClient.getDeployedContract.resolves({
        status: 'completed',
        address: '0x1234567890123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890'
      });

      // Execute the protected method via reflection
      const deployFacetsTasks = Object.getPrototypeOf(strategy).constructor.prototype.deployFacetsTasks;
      await deployFacetsTasks.call(strategy, diamond);

      // Since MockDiamondCutFacet is deployed at version 0, and MockDiamondLoupeFacet and MockTestFacet
      // are not deployed (version -1), only 2 facets should be deployed
      expect(mockDeployClient.deployContract.callCount).to.equal(2);
    });
  });

  describe('performDiamondCutTasks', () => {
    it('should create a proposal for the diamond cut', async function() {
      this.timeout(15000); // Increase timeout to 15 seconds for this test
      
      // Setup diamond with mock deployed addresses
      const deployedData = diamond.getDeployedDiamondData();
      deployedData.DiamondAddress = '0xDiamond123456789012345678901234567890';
      deployedData.DeployedFacets = {
        DiamondCutFacet: {
          address: '0xCutFacet123456789012345678901234567890',
          tx_hash: '0x123456789abcdef',
          version: 0,
          funcSelectors: ['0x1f931c1c'] // diamondCut function selector
        },
        DiamondLoupeFacet: {
          address: '0xLoupeFacet23456789012345678901234567890',
          tx_hash: '0x123456789abcdef',
          version: 0,
          funcSelectors: ['0x7a0ed627'] // facets function selector
        }
      };
      diamond.updateDeployedDiamondData(deployedData);

      // Add a new facet to the registry
      const testFacetAddress = '0xTestFacet123456789012345678901234567890';
      const testFacetSelector = '0xtest1234';
      diamond.updateNewDeployedFacets('TestFacet', {
        priority: 30,
        address: testFacetAddress,
        tx_hash: '0x123456789abcdef',
        version: 0,
        initFunction: 'initialize()',
        funcSelectors: [testFacetSelector],
        deployInclude: [],
        deployExclude: [],
        verified: false
      });

      // Register selector in the function registry
      diamond.registerFunctionSelectors({
        [testFacetSelector]: {
          facetName: 'TestFacet',
          priority: 30,
          address: testFacetAddress,
          action: RegistryFacetCutAction.Add
        }
      });

      // Mock proposal client responses
      mockProposalClient.create.resolves({
        proposalId: 'test-proposal-id',
        url: 'https://defender.openzeppelin.com/proposal/test-proposal-id'
      });

      mockProposalClient.get.resolves({
        proposalId: 'test-proposal-id',
        transaction: {
          isExecuted: true,
          isSuccessful: true,
          isReverted: false
        },
        status: 'executed'
      });

      mockProposalClient.execute.resolves({
        proposalId: 'test-proposal-id',
        transactionId: 'test-transaction-id',
        status: 'executed'
      });

      // Use sinon to mock the client methods 
      const mockClient = {
        proposal: mockProposalClient
      };

      // Temporarily replace the strategy's client property
      Object.defineProperty(strategy, 'client', {
        value: mockClient,
        writable: true,
        configurable: true
      });

      // Execute the protected method via reflection
      const performDiamondCutTasks = Object.getPrototypeOf(strategy).constructor.prototype.performDiamondCutTasks;
      await performDiamondCutTasks.call(strategy, diamond);

      // Verify proposal was created
      expect(mockProposalClient.create.called).to.be.true;

      // Check the arguments to create
      const createArg = mockProposalClient.create.firstCall.args[0].proposal;
      expect(createArg.contract.address).to.equal(deployedData.DiamondAddress);
      expect(createArg.contract.network).to.equal(NETWORK_NAME);
      expect(createArg.functionInterface.name).to.equal('diamondCut');
    });
  });

  describe('pollUntilComplete', () => {
    it('should poll until deployment is complete', async () => {
      // Create a defender store step
      const deploymentId = `${DIAMOND_NAME}-${NETWORK_NAME}-${CHAIN_ID}`;
      const stepName = 'test-step';
      const proposalId = 'test-proposal-id';

      // Create the directory for defender store
      const defenderStoreDir = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender');
      await fs.ensureDir(defenderStoreDir);

      // Create an initial defender store file
      await fs.writeJson(path.join(defenderStoreDir, `${deploymentId}.json`), {
        diamondName: DIAMOND_NAME,
        deploymentId: deploymentId,
        network: NETWORK_NAME,
        steps: [
          {
            stepName: stepName,
            proposalId: proposalId,
            status: 'pending',
            description: 'Test step',
            timestamp: Date.now()
          }
        ]
      });

      // Mock getDeployedContract to transition from pending to completed
      mockDeployClient.getDeployedContract.onFirstCall().resolves({
        status: 'pending',
        deploymentId: proposalId
      });

      mockDeployClient.getDeployedContract.onSecondCall().resolves({
        status: 'pending',
        deploymentId: proposalId
      });

      mockDeployClient.getDeployedContract.onThirdCall().resolves({
        status: 'completed',
        deploymentId: proposalId,
        address: '0x1234567890123456789012345678901234567890',
        contractAddress: '0x1234567890123456789012345678901234567890'
      });

      // Execute the protected method via reflection
      const pollUntilComplete = Object.getPrototypeOf(strategy).constructor.prototype.pollUntilComplete;
      const result = await pollUntilComplete.call(strategy, stepName, diamond, {
        maxAttempts: 5,
        initialDelayMs: 10, // Short delay for tests
        maxDelayMs: 50,
        jitter: false
      });

      // Verify getDeployedContract was called until complete
      expect(mockDeployClient.getDeployedContract.callCount).to.equal(3);

      // Verify result contains completed deployment
      expect(result).to.not.be.null;
      expect(result.status).to.equal('completed');
    });

    it('should handle failed deployments', async () => {
      // Create a defender store step
      const deploymentId = `${DIAMOND_NAME}-${NETWORK_NAME}-${CHAIN_ID}`;
      const stepName = 'test-step-fail';
      const proposalId = 'test-proposal-id-fail';

      // Create the directory for defender store
      const defenderStoreDir = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender');
      await fs.ensureDir(defenderStoreDir);

      // Create an initial defender store file
      await fs.writeJson(path.join(defenderStoreDir, `${deploymentId}.json`), {
        diamondName: DIAMOND_NAME,
        deploymentId: deploymentId,
        network: NETWORK_NAME,
        steps: [
          {
            stepName: stepName,
            proposalId: proposalId,
            status: 'pending',
            description: 'Test step that will fail',
            timestamp: Date.now()
          }
        ]
      });

      // Reset the mock and set up specific call responses
      mockDeployClient.getDeployedContract.resetHistory();
      mockDeployClient.getDeployedContract.onCall(0).resolves({
        status: 'pending',
        deploymentId: proposalId
      });

      mockDeployClient.getDeployedContract.onCall(1).resolves({
        status: 'failed',
        deploymentId: proposalId,
        error: 'Test error'
      });

      // Execute the protected method via reflection
      const pollUntilComplete = Object.getPrototypeOf(strategy).constructor.prototype.pollUntilComplete;

      try {
        const result = await pollUntilComplete.call(strategy, stepName, diamond, {
          maxAttempts: 5,
          initialDelayMs: 10, // Short delay for tests
          maxDelayMs: 50,
          jitter: false
        });

        // The method should throw an error when deployment fails
        expect.fail('Expected method to throw an error on failed deployment');
      } catch (error: any) {
        // This is expected - the method should throw when deployment fails
        expect(error).to.be.an('error');
        expect(error.message).to.include('Deployment failed');
      }

      // Verify getDeployedContract was called until failed
      expect(mockDeployClient.getDeployedContract.callCount).to.equal(2);
    });
  });
});