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
const chai_1 = require("chai");
const hardhat_1 = __importDefault(require("hardhat"));
;
const Diamond_1 = require("../../src/core/Diamond");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
const DiamondDeployer_1 = require("../../src/core/DiamondDeployer");
const LocalDeploymentStrategy_1 = require("../../src/strategies/LocalDeploymentStrategy");
const configurationResolver_1 = require("../../src/utils/configurationResolver");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const setup_1 = require("../setup");
describe('Integration: Dual Configuration Support', function () {
    this.timeout(30000);
    const TEMP_DIR = path.join(__dirname, '../../.tmp-test-dual-config');
    const DIAMOND_NAME = 'ConfigTestDiamond';
    const NETWORK_NAME = 'hardhat';
    const CHAIN_ID = 31337;
    let deployer;
    let accounts;
    before(async function () {
        const setupData = await (0, setup_1.setupTestEnvironment)(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);
        deployer = setupData.deployer;
        accounts = setupData.accounts;
    });
    after(async function () {
        await (0, setup_1.cleanupTestEnvironment)(TEMP_DIR);
    });
    describe('Standalone JSON Configuration', () => {
        it('should resolve configuration from JSON file in diamonds directory', async function () {
            // Create a standalone config file
            const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
            const config = await configurationResolver_1.ConfigurationResolver.resolveDiamondConfig(DIAMOND_NAME, configPath, NETWORK_NAME, CHAIN_ID);
            (0, chai_1.expect)(config.diamondName).to.equal(DIAMOND_NAME);
            (0, chai_1.expect)(config.networkName).to.equal(NETWORK_NAME);
            (0, chai_1.expect)(config.chainId).to.equal(CHAIN_ID);
            (0, chai_1.expect)(config.configFilePath).to.equal(configPath);
            (0, chai_1.expect)(config.contractsPath).to.include('contracts');
            (0, chai_1.expect)(config.deploymentsPath).to.include('deployments');
        });
        it('should create directory structure for standalone configuration', async function () {
            const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
            const config = await configurationResolver_1.ConfigurationResolver.resolveDiamondConfig(DIAMOND_NAME, configPath, NETWORK_NAME, CHAIN_ID);
            await configurationResolver_1.ConfigurationResolver.ensureDirectoryStructure(config);
            // Verify directories were created
            (0, chai_1.expect)(await fs.pathExists(config.deploymentsPath)).to.be.true;
            (0, chai_1.expect)(await fs.pathExists(config.callbacksPath)).to.be.true;
        });
    });
    describe('Default Configuration', () => {
        it('should use default paths when no configuration is found', async function () {
            const config = await configurationResolver_1.ConfigurationResolver.resolveDiamondConfig('NonExistentDiamond', undefined, NETWORK_NAME, CHAIN_ID);
            (0, chai_1.expect)(config.diamondName).to.equal('NonExistentDiamond');
            (0, chai_1.expect)(config.contractsPath).to.include('contracts');
            (0, chai_1.expect)(config.deploymentsPath).to.include('diamonds');
            (0, chai_1.expect)(config.configFilePath).to.include('diamonds/NonExistentDiamond/nonexistentdiamond.config.json');
        });
    });
    describe('Full Deployment with Dual Configuration', () => {
        it('should deploy diamond using standalone JSON configuration', async function () {
            // Use the ConfigurationResolver to get config
            const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
            const resolvedConfig = await configurationResolver_1.ConfigurationResolver.resolveDiamondConfig(DIAMOND_NAME, configPath, NETWORK_NAME, CHAIN_ID);
            // Ensure directory structure exists
            await configurationResolver_1.ConfigurationResolver.ensureDirectoryStructure(resolvedConfig);
            // Create repository and diamond using resolved config
            const repository = new FileDeploymentRepository_1.FileDeploymentRepository(resolvedConfig);
            const diamond = new Diamond_1.Diamond(resolvedConfig, repository);
            // Set provider and signer
            diamond.setProvider(hardhat_1.default.ethers.provider);
            diamond.setSigner(deployer);
            // Mock ethers.getContractFactory for this test
            const originalGetContractFactory = hardhat_1.default.ethers.getContractFactory;
            // @ts-ignore
            hardhat_1.default.ethers.getContractFactory = async (name) => {
                // Simple mock that returns a deployable contract
                return {
                    deploy: async () => {
                        const mockAddress = '0x' + Math.random().toString(16).substring(2, 42).padStart(40, '0');
                        const mockTxHash = '0x' + Math.random().toString(16).substring(2);
                        return {
                            address: mockAddress,
                            getAddress: async () => mockAddress,
                            deployed: async () => ({}),
                            waitForDeployment: async () => ({}),
                            deploymentTransaction: () => ({ hash: mockTxHash }),
                            interface: {
                                functions: {},
                                getSighash: () => '0x12345678',
                                forEachFunction: (callback) => {
                                    // Mock some function selectors
                                    callback({ selector: '0x1f931c1c' }); // diamondCut
                                    callback({ selector: '0xcdffacc6' }); // facets
                                }
                            }
                        };
                    },
                    interface: {
                        functions: {},
                        getSighash: () => '0x12345678',
                        forEachFunction: (callback) => {
                            // Mock some function selectors
                            callback({ selector: '0x1f931c1c' }); // diamondCut
                            callback({ selector: '0xcdffacc6' }); // facets
                        }
                    }
                };
            };
            try {
                // Create strategy and deployer
                const strategy = new LocalDeploymentStrategy_1.LocalDeploymentStrategy();
                const diamondDeployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
                // Deploy the diamond
                await diamondDeployer.deployDiamond();
                // Verify deployment succeeded
                const deployedData = diamond.getDeployedDiamondData();
                (0, chai_1.expect)(deployedData.DiamondAddress).to.not.be.empty;
                // Verify the configuration was used correctly
                (0, chai_1.expect)(diamond.diamondName).to.equal(DIAMOND_NAME);
                (0, chai_1.expect)(diamond.networkName).to.equal(NETWORK_NAME);
                (0, chai_1.expect)(diamond.chainId).to.equal(CHAIN_ID);
            }
            finally {
                // Restore original function
                hardhat_1.default.ethers.getContractFactory = originalGetContractFactory;
            }
        });
    });
    describe('Configuration Priority', () => {
        it('should prioritize provided config path over defaults', async function () {
            const customConfigPath = path.join(TEMP_DIR, 'custom-config.json');
            // Create a custom config file
            await fs.writeJson(customConfigPath, {
                protocolVersion: 0.0,
                facets: {
                    TestFacet: {
                        priority: 30,
                        versions: { "0.0": {} }
                    }
                }
            });
            const config = await configurationResolver_1.ConfigurationResolver.resolveDiamondConfig(DIAMOND_NAME, customConfigPath, NETWORK_NAME, CHAIN_ID);
            (0, chai_1.expect)(config.configFilePath).to.equal(customConfigPath);
        });
    });
});
//# sourceMappingURL=dualConfiguration.test.js.map