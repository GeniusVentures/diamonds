"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// test/unit/strategies/OZDefenderDeploymentStrategy.test.ts
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const sinon_1 = __importDefault(require("sinon"));
const Diamond_1 = require("../../../src/core/Diamond");
const OZDefenderDeploymentStrategy_1 = require("../../../src/strategies/OZDefenderDeploymentStrategy");
const FileDeploymentRepository_1 = require("../../../src/repositories/FileDeploymentRepository");
const types_1 = require("../../../src/types");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
// Create stub for the defender module - this avoids the need to mock imports
const mockDeployClient = {
    deployContract: sinon_1.default.stub(),
    getDeployedContract: sinon_1.default.stub()
};
const mockProposalClient = {
    create: sinon_1.default.stub(),
    get: sinon_1.default.stub(),
    execute: sinon_1.default.stub()
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
    let diamond;
    let config;
    let repository;
    let strategy;
    let signers;
    let provider;
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
        await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), sampleConfig, { spaces: 2 });
        // Get hardhat signers and provider
        signers = await hardhat_1.ethers.getSigners();
        provider = hardhat_1.ethers.provider;
        // Stub console.log for testing
        sinon_1.default.stub(console, 'log');
        sinon_1.default.stub(console, 'error');
    });
    beforeEach(async () => {
        // Reset sinon stubs
        sinon_1.default.resetHistory();
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
        repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        diamond = new Diamond_1.Diamond(config, repository);
        // Setup the diamond
        diamond.setProvider(provider);
        diamond.setSigner(signers[0]);
        // Create the strategy with constructor that accepts everything we'll use
        strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, // autoApprove
        SAFE_ADDRESS, 'Safe');
        // Replace the deployClient in the strategy
        const originalModule = await Promise.resolve().then(() => __importStar(require('../../../src/utils/defenderClients')));
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
    after(async () => {
        // Clean up temp directory after tests
        await fs.remove(TEMP_DIR);
        // Restore sinon stubs
        sinon_1.default.restore();
    });
    describe('initialization', () => {
        it('should initialize with the correct configuration', () => {
            // Since most properties are private, we mainly test that it doesn't throw
            (0, chai_1.expect)(() => new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, SAFE_ADDRESS, 'Safe')).to.not.throw();
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
                contractAddress: '0x1234567890123456789012345678901234567890'
            });
            // Execute the protected method via reflection
            const deployDiamondTasks = Object.getPrototypeOf(strategy).constructor.prototype.deployDiamondTasks;
            await deployDiamondTasks.call(strategy, diamond);
            // Verify the deployContract was called twice with correct args
            (0, chai_1.expect)(mockDeployClient.deployContract.calledTwice).to.be.true;
            const firstCallArgs = mockDeployClient.deployContract.firstCall.args[0];
            (0, chai_1.expect)(firstCallArgs.contractName).to.equal('DiamondCutFacet');
            (0, chai_1.expect)(firstCallArgs.network).to.equal(NETWORK_NAME);
            const secondCallArgs = mockDeployClient.deployContract.secondCall.args[0];
            (0, chai_1.expect)(secondCallArgs.contractName).to.equal(DIAMOND_NAME);
            (0, chai_1.expect)(secondCallArgs.network).to.equal(NETWORK_NAME);
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
                contractAddress: '0x1234567890123456789012345678901234567890'
            });
            // Execute the protected method via reflection
            const deployFacetsTasks = Object.getPrototypeOf(strategy).constructor.prototype.deployFacetsTasks;
            await deployFacetsTasks.call(strategy, diamond);
            // Should be called 3 times for our 3 facets
            (0, chai_1.expect)(mockDeployClient.deployContract.callCount).to.equal(3);
            // Check each call is for a different facet
            const facets = ['DiamondCutFacet', 'DiamondLoupeFacet', 'TestFacet'];
            for (let i = 0; i < mockDeployClient.deployContract.callCount; i++) {
                const args = mockDeployClient.deployContract.getCall(i).args[0];
                (0, chai_1.expect)(facets).to.include(args.contractName);
            }
        });
        it('should skip already deployed facets', async () => {
            // Set an existing deployment for one facet
            const deployedData = diamond.getDeployedDiamondData();
            deployedData.DeployedFacets = {
                DiamondCutFacet: {
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
                contractAddress: '0x1234567890123456789012345678901234567890'
            });
            // Execute the protected method via reflection
            const deployFacetsTasks = Object.getPrototypeOf(strategy).constructor.prototype.deployFacetsTasks;
            await deployFacetsTasks.call(strategy, diamond);
            // Should be called 2 times for the 2 facets not already deployed
            (0, chai_1.expect)(mockDeployClient.deployContract.callCount).to.equal(2);
        });
    });
    describe('performDiamondCutTasks', () => {
        it('should create a proposal for the diamond cut', async () => {
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
                    action: types_1.RegistryFacetCutAction.Add
                }
            });
            // Mock proposal client responses
            mockProposalClient.create.resolves({
                proposalId: 'test-proposal-id',
                url: 'https://defender.openzeppelin.com/proposal/test-proposal-id'
            });
            mockProposalClient.get.resolves({
                transaction: {
                    isExecuted: true,
                    isSuccessful: true
                }
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
            (0, chai_1.expect)(mockProposalClient.create.called).to.be.true;
            // Check the arguments to create
            const createArg = mockProposalClient.create.firstCall.args[0].proposal;
            (0, chai_1.expect)(createArg.contract.address).to.equal(deployedData.DiamondAddress);
            (0, chai_1.expect)(createArg.contract.network).to.equal(NETWORK_NAME);
            (0, chai_1.expect)(createArg.functionInterface.name).to.equal('diamondCut');
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
                contractAddress: '0x1234567890123456789012345678901234567890'
            });
            // Execute the protected method via reflection
            const pollUntilComplete = Object.getPrototypeOf(strategy).constructor.prototype.pollUntilComplete;
            const result = await pollUntilComplete.call(strategy, stepName, diamond, {
                maxAttempts: 5,
                initialDelayMs: 10,
                maxDelayMs: 50,
                jitter: false
            });
            // Verify getDeployedContract was called until complete
            (0, chai_1.expect)(mockDeployClient.getDeployedContract.callCount).to.equal(3);
            // Verify result contains completed deployment
            (0, chai_1.expect)(result).to.not.be.null;
            (0, chai_1.expect)(result.status).to.equal('completed');
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
            // Mock getDeployedContract to transition from pending to failed
            mockDeployClient.getDeployedContract.onFirstCall().resolves({
                status: 'pending',
                deploymentId: proposalId
            });
            mockDeployClient.getDeployedContract.onSecondCall().resolves({
                status: 'failed',
                deploymentId: proposalId,
                error: 'Test error'
            });
            // Execute the protected method via reflection
            const pollUntilComplete = Object.getPrototypeOf(strategy).constructor.prototype.pollUntilComplete;
            const result = await pollUntilComplete.call(strategy, stepName, diamond, {
                maxAttempts: 5,
                initialDelayMs: 10,
                maxDelayMs: 50,
                jitter: false
            });
            // Verify getDeployedContract was called until failed
            (0, chai_1.expect)(mockDeployClient.getDeployedContract.callCount).to.equal(2);
            // Verify result indicates failure
            (0, chai_1.expect)(result).to.not.be.null;
            (0, chai_1.expect)(result.status).to.equal('failed');
        });
    });
});
//# sourceMappingURL=OZDefenderDeploymnetStrategy.test.js.map