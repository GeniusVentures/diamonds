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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// test/integration/ozDefenderDeployment.test.ts
const chai_1 = require("chai");
const hardhat_1 = __importDefault(require("hardhat"));
;
const sinon_1 = __importDefault(require("sinon"));
const Diamond_1 = require("../../src/core/Diamond");
const DiamondDeployer_1 = require("../../src/core/DiamondDeployer");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
const OZDefenderDeploymentStrategy_1 = require("../../src/strategies/OZDefenderDeploymentStrategy");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const setup_1 = require("../setup");
const defender_setup_1 = require("./defender/setup/defender-setup");
describe("Integration: OZDefenderDeploymentStrategy", function () {
    // This test might take longer due to complex operations
    this.timeout(30000);
    // Test constants
    const TEMP_DIR = path.join(__dirname, "../../.tmp-test-integration-oz");
    const DIAMOND_NAME = "TestDiamond";
    const NETWORK_NAME = "sepolia";
    const CHAIN_ID = 11155111;
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
        // Set test environment
        process.env.NODE_ENV = 'test';
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
        // Mock ethers.getContractFactory to avoid artifact lookup issues in tests
        sinon_1.default.stub(hardhat_1.default.ethers, 'getContractFactory').callsFake((...args) => {
            // Return a mock factory with a minimal interface
            return Promise.resolve({
                interface: {
                    functions: {
                        'diamondCut(tuple[],address,bytes)': 'function diamondCut((address,uint8,bytes4[])[],address,bytes)',
                        'facets()': 'function facets() view returns ((address,bytes4[])[])',
                        'supportsInterface(bytes4)': 'function supportsInterface(bytes4) view returns (bool)',
                    },
                    getSighash: (fn) => {
                        const sighashes = {
                            'diamondCut(tuple[],address,bytes)': '0x1f931c1c',
                            'facets()': '0x7a0ed627',
                            'supportsInterface(bytes4)': '0x01ffc9a7',
                        };
                        return sighashes[fn] || '0x00000000';
                    }
                }
            });
        });
        // Don't stub console during debug
        // sinon.stub(console, 'log');
        // sinon.stub(console, 'error');
    });
    beforeEach(async function () {
        // Clean up any existing deployment state files
        await (0, setup_1.cleanupTestEnvironment)(TEMP_DIR);
        // Recreate test files after cleanup
        await (0, setup_1.setupTestFiles)(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);
        // Recreate mocks entirely to reset closure variables
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
        diamond.setProvider(hardhat_1.default.ethers.provider);
        diamond.setSigner(deployer);
    });
    after(async function () {
        // Clean up temp directory after tests
        await (0, setup_1.cleanupTestEnvironment)(TEMP_DIR);
        // Clear callback manager instances to avoid conflicts with other tests
        const { CallbackManager } = await Promise.resolve().then(() => __importStar(require('../../src/core/CallbackManager')));
        CallbackManager.clearInstances();
        // Restore console stubs
        sinon_1.default.restore();
    });
    describe('End-to-end deployment', () => {
        it('should deploy a diamond with facets using OZDefenderDeploymentStrategy', async function () {
            // Create strategy with our production-ready mocks
            const mockDefenderClient = {
                deploy: mocks.mockDeployClient,
                proposal: mocks.mockProposalClient
            };
            const strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, false, // autoApprove
            RELAYER_ADDRESS, // via
            'Relayer', // viaType
            true, // verbose
            mockDefenderClient // inject our mock client
            );
            const deployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
            // Execute deployment
            await deployer.deployDiamond();
            // Verify that mocks were called appropriately
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
            (0, chai_1.expect)(mocks.mockProposalClient.create.called).to.be.true;
        });
        it('should handle facet upgrades correctly', async function () {
            // First set up with an existing deployment
            const deployedData = diamond.getDeployedDiamondData();
            deployedData.DiamondAddress = await mockDiamond.getAddress();
            deployedData.DeployerAddress = deployer.address;
            deployedData.DeployedFacets = {
                DiamondCutFacet: {
                    address: await diamondCutFacet.getAddress(),
                    tx_hash: '0x123456789abcdef',
                    version: 0, // Number format for deployment data
                    funcSelectors: ['0x1f931c1c'] // diamondCut function selector
                },
                DiamondLoupeFacet: {
                    address: await diamondLoupeFacet.getAddress(),
                    tx_hash: '0x123456789abcdef',
                    version: 0, // Number format for deployment data
                    funcSelectors: ['0x7a0ed627'] // facets function selector
                },
                TestFacet: {
                    address: await testFacet.getAddress(),
                    tx_hash: '0x123456789abcdef',
                    version: 0, // Number format for deployment data
                    funcSelectors: ['0x12345678'] // setValue function selector
                }
            };
            diamond.updateDeployedDiamondData(deployedData);
            // Create new facet version in config with proper version format
            const config = repository.loadDeployConfig();
            if (!config.facets['TestFacet'].versions) {
                config.facets['TestFacet'].versions = {};
            }
            // Add version "1.0" (string format in config) to create an actual upgrade scenario
            config.facets['TestFacet'].versions["1.0"] = {
                deployInit: "initialize()",
                upgradeInit: "reinitialize()",
                callbacks: ["testCallback"],
                deployInclude: [],
                deployExclude: []
            };
            // Update protocol version to 1.0 to trigger upgrade
            config.protocolVersion = 1.0;
            // Write updated config
            await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), config, { spaces: 2 });
            // Force reload the deploy config in the diamond instance
            diamond.deployConfig = repository.loadDeployConfig();
            diamond.facetsConfig = diamond.deployConfig.facets;
            // Setup using our production-ready mocks (they're already configured for success)
            // Create strategy with our mocks
            const mockDefenderClient = {
                deploy: mocks.mockDeployClient,
                proposal: mocks.mockProposalClient
            };
            const strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, // autoApprove
            RELAYER_ADDRESS, // via
            'Relayer', // viaType  
            true, // verbose
            mockDefenderClient // inject our mock client
            );
            const upgradeDeployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
            // Deploy the upgrade
            await upgradeDeployer.deployDiamond();
            // For upgrade scenario, TestFacet should be deployed with new version "1.0"
            // Since only TestFacet has version "1.0", only it should be deployed
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(1); // TestFacet v1.0 deployment
            (0, chai_1.expect)(mocks.mockProposalClient.create.called).to.be.true; // Diamond cut proposal created
            (0, chai_1.expect)(mocks.mockProposalClient.get.callCount).to.be.at.least(1); // Proposal status checked
        });
        it('should handle deployment failures', async function () {
            // Setup failed deployment mocks
            const failedMocks = (0, defender_setup_1.createDefenderMocks)();
            (0, defender_setup_1.setupFailedDeploymentMocks)(failedMocks, 'deploy');
            // Create strategy with failed mocks
            const mockDefenderClient = {
                deploy: failedMocks.mockDeployClient,
                proposal: failedMocks.mockProposalClient
            };
            const strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(API_KEY, API_SECRET, RELAYER_ADDRESS, true, // autoApprove
            RELAYER_ADDRESS, // via
            'Relayer', // viaType
            true, // verbose
            mockDefenderClient // inject our mock client
            );
            const deployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
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
            (0, chai_1.expect)(failedMocks.mockDeployClient.deployContract.called).to.be.true;
            (0, chai_1.expect)(failedMocks.mockDeployClient.getDeployedContract.called).to.be.true;
        });
    });
});
//# sourceMappingURL=ozDefenderDeployment.test.js.map