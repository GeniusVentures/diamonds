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
const Diamond_1 = require("../../../src/core/Diamond");
const FileDeploymentRepository_1 = require("../../../src/repositories/FileDeploymentRepository");
const types_1 = require("../../../src/types");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
describe('Diamond', () => {
    // Test constants
    const TEMP_DIR = path.join(__dirname, '../../../.tmp-test');
    const DIAMOND_NAME = 'TestDiamond';
    const NETWORK_NAME = 'hardhat';
    const CHAIN_ID = 31337;
    // Test variables
    let diamond;
    let config;
    let repository;
    let signers;
    let provider;
    before(async () => {
        // Create temporary directories for test artifacts
        await fs.ensureDir(TEMP_DIR);
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME));
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
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
                            callbacks: ["testCallback"]
                        }
                    }
                }
            }
        };
        await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), sampleConfig, { spaces: 2 });
        // Get hardhat signers and provider
        signers = await hardhat_1.default.ethers.getSigners();
        provider = hardhat_1.default.ethers.provider;
    });
    beforeEach(async () => {
        // Clean up any existing deployment files to ensure clean state
        const deploymentFile = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`);
        if (await fs.pathExists(deploymentFile)) {
            await fs.remove(deploymentFile);
        }
        // Set up a new config and repository for each test
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
    });
    after(async () => {
        // Clean up temp directory after tests
        await fs.remove(TEMP_DIR);
    });
    describe('initialization', () => {
        it('should initialize with the correct config values', () => {
            (0, chai_1.expect)(diamond.diamondName).to.equal(DIAMOND_NAME);
            (0, chai_1.expect)(diamond.networkName).to.equal(NETWORK_NAME);
            (0, chai_1.expect)(diamond.chainId).to.equal(CHAIN_ID);
            (0, chai_1.expect)(diamond.deploymentsPath).to.equal(TEMP_DIR);
            (0, chai_1.expect)(diamond.contractsPath).to.equal('contracts');
        });
        it('should load the deployment config from the repository', () => {
            const deployConfig = diamond.getDeployConfig();
            (0, chai_1.expect)(deployConfig.protocolVersion).to.equal(0);
            (0, chai_1.expect)(deployConfig.facets).to.have.keys(['DiamondCutFacet', 'DiamondLoupeFacet', 'TestFacet']);
        });
        it('should initialize an empty function selector registry for a new diamond', () => {
            (0, chai_1.expect)(diamond.functionSelectorRegistry.size).to.equal(0);
        });
    });
    describe('provider and signer management', () => {
        it('should set and get provider', () => {
            diamond.setProvider(provider);
            (0, chai_1.expect)(diamond.getProvider()).to.equal(provider);
        });
        it('should set and get signer', () => {
            const signer = signers[0];
            diamond.setSigner(signer);
            (0, chai_1.expect)(diamond.getSigner()).to.equal(signer);
        });
    });
    describe('function selector registry', () => {
        it('should register function selectors', () => {
            const selector = '0x12345678';
            diamond.registerFunctionSelectors({
                [selector]: {
                    facetName: 'TestFacet',
                    priority: 100,
                    address: '0x1234567890123456789012345678901234567890',
                    action: types_1.RegistryFacetCutAction.Add
                }
            });
            (0, chai_1.expect)(diamond.isFunctionSelectorRegistered(selector)).to.be.true;
            const entry = diamond.functionSelectorRegistry.get(selector);
            (0, chai_1.expect)(entry?.facetName).to.equal('TestFacet');
            (0, chai_1.expect)(entry?.priority).to.equal(100);
            (0, chai_1.expect)(entry?.action).to.equal(types_1.RegistryFacetCutAction.Add);
        });
        it('should update function selectors', () => {
            const selector = '0x12345678';
            diamond.registerFunctionSelectors({
                [selector]: {
                    facetName: 'TestFacet',
                    priority: 100,
                    address: '0x1234567890123456789012345678901234567890',
                    action: types_1.RegistryFacetCutAction.Add
                }
            });
            diamond.updateFunctionSelectorRegistry(selector, {
                facetName: 'UpdatedFacet',
                priority: 200,
                address: '0x1234567890123456789012345678901234567891',
                action: types_1.RegistryFacetCutAction.Replace
            });
            const entry = diamond.functionSelectorRegistry.get(selector);
            (0, chai_1.expect)(entry?.facetName).to.equal('UpdatedFacet');
            (0, chai_1.expect)(entry?.priority).to.equal(200);
            (0, chai_1.expect)(entry?.action).to.equal(types_1.RegistryFacetCutAction.Replace);
        });
    });
    describe('deployed diamond data', () => {
        it('should get and update deployed diamond data', () => {
            const data = diamond.getDeployedDiamondData();
            (0, chai_1.expect)(data.DiamondAddress).to.equal(''); // Empty string due to Zod validation
            data.DiamondAddress = '0x1234567890123456789012345678901234567890';
            diamond.updateDeployedDiamondData(data);
            const updatedData = diamond.getDeployedDiamondData();
            (0, chai_1.expect)(updatedData.DiamondAddress).to.equal('0x1234567890123456789012345678901234567890');
        });
        it('should detect if it is an upgrade deployment', () => {
            (0, chai_1.expect)(diamond.isUpgradeDeployment()).to.be.false;
            const data = diamond.getDeployedDiamondData();
            data.DiamondAddress = '0x1234567890123456789012345678901234567890';
            diamond.updateDeployedDiamondData(data);
            (0, chai_1.expect)(diamond.isUpgradeDeployment()).to.be.true;
        });
    });
    describe('facet management', () => {
        it('should update new deployed facets', () => {
            const facetData = {
                priority: 30,
                address: '0x1234567890123456789012345678901234567890',
                tx_hash: '0x123456789abcdef',
                version: 1,
                initFunction: 'initialize()',
                funcSelectors: ['0x12345678', '0x87654321'],
                deployInclude: [],
                deployExclude: [],
                verified: false
            };
            diamond.updateNewDeployedFacets('TestFacet', facetData);
            const newFacets = diamond.getNewDeployedFacets();
            (0, chai_1.expect)(newFacets).to.have.key('TestFacet');
            (0, chai_1.expect)(newFacets.TestFacet).to.deep.equal(facetData);
        });
        it('should register initializers', () => {
            diamond.registerInitializers('TestFacet', 'initialize()');
            // Since initializerRegistry is a Map, we need to convert it to an object for testing
            const registry = Object.fromEntries(diamond.initializerRegistry.entries());
            (0, chai_1.expect)(registry).to.deep.equal({ 'TestFacet': 'initialize()' });
        });
    });
    describe('init address management', () => {
        it('should set and get init address', () => {
            const address = '0x1234567890123456789012345678901234567890';
            diamond.setInitAddress(address);
            (0, chai_1.expect)(diamond.getInitAddress()).to.equal(address);
        });
    });
});
//# sourceMappingURL=Diamond.test.js.map