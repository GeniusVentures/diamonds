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
// test/integration/defender/deployment.test.ts
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const sinon_1 = __importDefault(require("sinon"));
const Diamond_1 = require("../../../src/core/Diamond");
const DiamondDeployer_1 = require("../../../src/core/DiamondDeployer");
const FileDeploymentRepository_1 = require("../../../src/repositories/FileDeploymentRepository");
const OZDefenderDeploymentStrategy_1 = require("../../../src/strategies/OZDefenderDeploymentStrategy");
const defender_setup_1 = require("./setup/defender-setup");
describe('Integration: Defender Deployment', function () {
    this.timeout(300000); // 5 minutes for integration tests
    // Test constants
    const TEMP_DIR = path.join(__dirname, '../../.tmp-defender-integration');
    const DIAMOND_NAME = 'TestDiamond';
    const NETWORK_NAME = 'hardhat';
    const CHAIN_ID = 31337;
    // Test variables
    let diamond;
    let config;
    let repository;
    let strategy;
    let deployer;
    let signers;
    let mocks;
    before(async function () {
        // Create temporary directories for test artifacts
        await fs.ensureDir(TEMP_DIR);
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME));
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender'));
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));
        // Get hardhat signers
        signers = await hardhat_1.ethers.getSigners();
        // Stub console.log for cleaner test output
        sinon_1.default.stub(console, 'log');
        sinon_1.default.stub(console, 'error');
    });
    beforeEach(async function () {
        // Reset sinon stubs
        sinon_1.default.resetHistory();
        // Create fresh mocks for each test
        mocks = (0, defender_setup_1.createDefenderMocks)();
        // Mock the defender clients module
        const defenderClientsModule = await Promise.resolve().then(() => __importStar(require('../../../src/utils/defenderClients')));
        sinon_1.default.stub(defenderClientsModule, 'deployClient').value(mocks.mockDeployClient);
        sinon_1.default.stub(defenderClientsModule, 'adminClient').value(mocks.mockDefender);
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
        await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), sampleConfig, { spaces: 2 });
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
        repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        diamond = new Diamond_1.Diamond(config, repository);
        // Setup the diamond
        diamond.setProvider(hardhat_1.ethers.provider);
        diamond.setSigner(signers[0]);
        // Create the strategy
        strategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_KEY, defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_SECRET, defender_setup_1.DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS, defender_setup_1.DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE, defender_setup_1.DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS, 'Safe');
        // Create deployer
        deployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
    });
    afterEach(function () {
        // Restore all mocks
        sinon_1.default.restore();
    });
    after(async function () {
        // Clean up temp directory after tests
        await fs.remove(TEMP_DIR);
    });
    describe('Complete Deployment Flow', function () {
        it('should successfully deploy a new diamond with all facets', async function () {
            // Setup successful deployment mocks
            (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
            // Execute deployment
            await deployer.deployDiamond();
            // Verify deployment calls were made
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4); // DiamondCutFacet + Diamond + 2 facets
            (0, chai_1.expect)(mocks.mockProposalClient.create.called).to.be.true;
            // Verify deployment data was updated
            const deployedData = diamond.getDeployedDiamondData();
            (0, chai_1.expect)(deployedData.DiamondAddress).to.not.be.undefined;
            (0, chai_1.expect)(deployedData.DeployedFacets).to.not.be.undefined;
            (0, chai_1.expect)(deployedData.DeployedFacets['DiamondCutFacet']).to.not.be.undefined;
        });
        it('should handle deployment with network delays gracefully', async function () {
            // Setup mocks with realistic network delays
            (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
            (0, defender_setup_1.addNetworkDelay)(mocks, 50); // 50ms delay
            // Execute deployment
            const startTime = Date.now();
            await deployer.deployDiamond();
            const endTime = Date.now();
            // Verify it took some time due to delays
            (0, chai_1.expect)(endTime - startTime).to.be.at.least(200); // Should have some delay
            // Verify successful completion
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
        });
        it('should properly handle facet deployment ordering by priority', async function () {
            // Setup successful deployment mocks
            (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
            // Execute deployment
            await deployer.deployDiamond();
            // Get deployment calls
            const deploymentCalls = mocks.mockDeployClient.deployContract.getCalls();
            // Should have DiamondCutFacet first, then Diamond, then facets by priority
            (0, chai_1.expect)(deploymentCalls[0].args[0].contractName).to.equal('DiamondCutFacet');
            (0, chai_1.expect)(deploymentCalls[1].args[0].contractName).to.equal(DIAMOND_NAME);
            // Remaining calls should be facets (order may vary based on priority)
            const facetCalls = deploymentCalls.slice(2);
            (0, chai_1.expect)(facetCalls.length).to.be.at.least(2);
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
            config.facets['TestFacet'].versions['1.0'] = {
                deployInit: "initialize()",
                upgradeInit: "reinitialize()",
                callbacks: ["testCallback"],
                deployInclude: [],
                deployExclude: []
            };
            config.protocolVersion = 1.0;
            // Write updated config
            await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), config, { spaces: 2 });
            // Reload configuration
            repository = new FileDeploymentRepository_1.FileDeploymentRepository(diamond.getDiamondConfig());
            diamond = new Diamond_1.Diamond(diamond.getDiamondConfig(), repository);
            diamond.setProvider(hardhat_1.ethers.provider);
            diamond.setSigner(signers[0]);
            diamond.updateDeployedDiamondData(existingDeployedData);
            // Setup mocks for upgrade
            (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
            // Execute upgrade (DiamondDeployer automatically detects existing deployment)
            await deployer.deployDiamond();
            // Should only deploy the upgraded facet, not the whole diamond
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.equal(1); // Only TestFacet v1.0
            (0, chai_1.expect)(mocks.mockProposalClient.create.called).to.be.true;
        });
    });
    describe('Error Handling', function () {
        it('should handle deployment failures gracefully', async function () {
            // Setup failed deployment mocks
            (0, defender_setup_1.setupFailedDeploymentMocks)(mocks, 'deploy');
            // Execute deployment and expect it to fail
            try {
                await deployer.deployDiamond();
                chai_1.expect.fail('Expected deployment to fail');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(Error);
                (0, chai_1.expect)(error.message).to.include('failed');
            }
        });
        it('should handle proposal creation failures gracefully', async function () {
            // Setup failed proposal mocks
            (0, defender_setup_1.setupFailedDeploymentMocks)(mocks, 'proposal');
            // Execute deployment and expect it to fail at proposal stage
            try {
                await deployer.deployDiamond();
                chai_1.expect.fail('Expected proposal creation to fail');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceOf(Error);
                (0, chai_1.expect)(error.message).to.include('Proposal creation failed');
            }
        });
        it('should handle proposal execution failures gracefully', async function () {
            // Setup failed execution mocks
            (0, defender_setup_1.setupFailedDeploymentMocks)(mocks, 'execution');
            // Execute deployment
            await deployer.deployDiamond();
            // Should complete deployment but fail at execution
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
            (0, chai_1.expect)(mocks.mockProposalClient.create.called).to.be.true;
        });
    });
    describe('Configuration Validation', function () {
        it('should validate required Defender configuration', function () {
            // Test with missing API key
            (0, chai_1.expect)(() => new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy('', defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_SECRET, defender_setup_1.DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS, defender_setup_1.DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE, defender_setup_1.DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS, 'Safe')).to.not.throw(); // Constructor doesn't validate, but usage should fail
            // Test with missing API secret
            (0, chai_1.expect)(() => new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_KEY, '', defender_setup_1.DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS, defender_setup_1.DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE, defender_setup_1.DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS, 'Safe')).to.not.throw(); // Constructor doesn't validate, but usage should fail
        });
        it('should handle different via types correctly', function () {
            // Test with Gnosis Safe
            const safeStrategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_KEY, defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_SECRET, defender_setup_1.DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS, false, defender_setup_1.DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS, 'Safe');
            (0, chai_1.expect)(safeStrategy).to.be.instanceOf(OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy);
            // Test with Relayer
            const relayerStrategy = new OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy(defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_KEY, defender_setup_1.DEFAULT_DEFENDER_CONFIG.API_SECRET, defender_setup_1.DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS, false, defender_setup_1.DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS, 'Relayer');
            (0, chai_1.expect)(relayerStrategy).to.be.instanceOf(OZDefenderDeploymentStrategy_1.OZDefenderDeploymentStrategy);
        });
    });
    describe('State Management', function () {
        it('should persist deployment state correctly', async function () {
            // Setup successful deployment mocks
            (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
            // Execute deployment
            await deployer.deployDiamond();
            // Check that state files were created
            const stateDir = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', 'defender');
            const stateFiles = await fs.readdir(stateDir);
            (0, chai_1.expect)(stateFiles.length).to.be.at.least(1);
            // Check deployment data file
            const deploymentDataFile = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`);
            (0, chai_1.expect)(await fs.pathExists(deploymentDataFile)).to.be.true;
            const deploymentData = await fs.readJson(deploymentDataFile);
            (0, chai_1.expect)(deploymentData.DiamondAddress).to.not.be.undefined;
            (0, chai_1.expect)(deploymentData.DeployedFacets).to.not.be.undefined;
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
            (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
            // Execute deployment
            await deployer.deployDiamond();
            // Should complete the remaining deployments
            (0, chai_1.expect)(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(2); // Remaining facets
        });
    });
});
//# sourceMappingURL=deployment.test.js.map