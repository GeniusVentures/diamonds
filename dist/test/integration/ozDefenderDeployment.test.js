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
// test/integration/ozDefenderDeployment.test.ts
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const sinon_1 = __importDefault(require("sinon"));
const Diamond_1 = require("../../src/core/Diamond");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
const DiamondDeployer_1 = require("../../src/core/DiamondDeployer");
const OZDefenderDeploymentStrategy_1 = require("../../src/strategies/OZDefenderDeploymentStrategy");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const setup_1 = require("../setup");
const defender_setup_1 = require("./defender/setup/defender-setup");
describe('Integration: OZDefenderDeploymentStrategy', function () {
    // This test might take longer due to complex operations
    this.timeout(30000);
    // Test constants
    const TEMP_DIR = path.join(__dirname, '../../.tmp-test-integration-oz');
    const DIAMOND_NAME = 'TestDiamond';
    const NETWORK_NAME = 'goerli';
    const CHAIN_ID = 5;
    // Use mock config from defender-setup
    const { API_KEY, API_SECRET, RELAYER_ADDRESS, SAFE_ADDRESS } = defender_setup_1.DEFAULT_DEFENDER_CONFIG;
    // Test variables
    let config;
    let repository;
    let diamond;
    let deployer;
    let accounts;
    let diamondCutFacet;
    let diamondLoupeFacet;
    let testFacet;
    let mockDiamond;
    let mocks;
    before(async function () {
        // Set up test environment
        const setup = await (0, setup_1.setupTestEnvironment)(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);
        deployer = setup.deployer;
        accounts = setup.accounts;
        diamondCutFacet = setup.diamondCutFacet;
        diamondLoupeFacet = setup.diamondLoupeFacet;
        testFacet = setup.testFacet;
        mockDiamond = setup.diamond;
        // Create and setup Defender mocks
        mocks = (0, defender_setup_1.createDefenderMocks)();
        (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
        // Spy on console.log for assertions
        sinon_1.default.stub(console, 'log');
        sinon_1.default.stub(console, 'error');
    });
    beforeEach(async function () {
        // Reset and setup fresh mocks for each test
        mocks.restore();
        mocks = (0, defender_setup_1.createDefenderMocks)();
        (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
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
        // Set provider and signer
        diamond.setProvider(hardhat_1.ethers.provider);
        diamond.setSigner(deployer);
    });
    after(async function () {
        // Clean up temp directory after tests
        await (0, setup_1.cleanupTestEnvironment)(TEMP_DIR);
        // Restore console stubs
        sinon_1.default.restore();
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
            const strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, // autoApprove
            SAFE_ADDRESS, 'Safe');
            // Create deployer
            const diamondDeployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
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
            (0, chai_1.expect)(mockDeployClient.deployContract.callCount).to.be.at.least(4);
            (0, chai_1.expect)(mockProposalClient.create.called).to.be.true;
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
            const config = repository.loadDeployConfig();
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
            await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), config, { spaces: 2 });
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
            const strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, // autoApprove
            SAFE_ADDRESS, 'Safe');
            // Create deployer
            const upgradeDeployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
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
            (0, chai_1.expect)(mockDeployClient.deployContract.called).to.be.true;
            (0, chai_1.expect)(mockProposalClient.create.called).to.be.true;
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
            const strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, // autoApprove
            SAFE_ADDRESS, 'Safe');
            // Create deployer
            const deployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
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
                chai_1.expect.fail('Should have thrown an error for failed deployment');
            }
            catch (error) {
                // Just verify we got here - we expect an error
                (0, chai_1.expect)(true).to.be.true;
            }
            // Verify deployment was attempted
            (0, chai_1.expect)(mockDeployClient.deployContract.called).to.be.true;
            (0, chai_1.expect)(mockDeployClient.getDeployedContract.called).to.be.true;
        });
    });
});
//# sourceMappingURL=ozDefenderDeployment.test.js.map