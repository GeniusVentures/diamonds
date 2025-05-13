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
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const Diamond_1 = require("../../src/core/Diamond");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
const DiamondDeployer_1 = require("../../src/core/DiamondDeployer");
const LocalDeploymentStrategy_1 = require("../../src/strategies/LocalDeploymentStrategy");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const setup_1 = require("../setup");
const sinon_1 = __importDefault(require("sinon"));
describe('Integration: LocalDeploymentStrategy', function () {
    // This test might take longer due to contract deployments
    this.timeout(30000);
    // Test constants
    const TEMP_DIR = path.join(__dirname, '../../.tmp-test-integration');
    const DIAMOND_NAME = 'TestDiamond';
    const NETWORK_NAME = 'hardhat';
    const CHAIN_ID = 31337;
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
    before(async function () {
        // Set up test environment
        const setup = await (0, setup_1.setupTestEnvironment)(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);
        deployer = setup.deployer;
        accounts = setup.accounts;
        diamondCutFacet = setup.diamondCutFacet;
        diamondLoupeFacet = setup.diamondLoupeFacet;
        testFacet = setup.testFacet;
        mockDiamond = setup.diamond;
        // Spy on console.log for assertions
        sinon_1.default.spy(console, 'log');
    });
    beforeEach(async function () {
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
        // Reset sinon spies
        sinon_1.default.resetHistory();
    });
    after(async function () {
        // Clean up temp directory
        await (0, setup_1.cleanupTestEnvironment)(TEMP_DIR);
        // Restore console.log
        console.log.restore();
    });
    // Mock function to simulate contract deployments
    async function mockContractFactory(name) {
        if (name === 'DiamondCutFacet') {
            return {
                deploy: async () => diamondCutFacet,
                connect: () => ({ deploy: async () => diamondCutFacet })
            };
        }
        else if (name === 'DiamondLoupeFacet') {
            return {
                deploy: async () => diamondLoupeFacet,
                connect: () => ({ deploy: async () => diamondLoupeFacet })
            };
        }
        else if (name === 'TestFacet') {
            return {
                deploy: async () => testFacet,
                connect: () => ({ deploy: async () => testFacet })
            };
        }
        else if (name.includes(DIAMOND_NAME)) {
            return {
                deploy: async () => mockDiamond,
                connect: () => ({ deploy: async () => mockDiamond })
            };
        }
        throw new Error(`Unexpected contract name: ${name}`);
    }
    describe('End-to-end deployment', () => {
        it('should deploy a diamond with facets using LocalDeploymentStrategy', async function () {
            // Mock ethers.getContractFactory
            const originalGetContractFactory = hardhat_1.ethers.getContractFactory;
            // @ts-ignore - We need to mock this
            hardhat_1.ethers.getContractFactory = mockContractFactory;
            try {
                // Create strategy
                const strategy = new LocalDeploymentStrategy_1.LocalDeploymentStrategy();
                // Create deployer
                const deployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
                // Deploy the diamond
                await deployer.deployDiamond();
                // Verify deployment succeeded
                const deployedData = diamond.getDeployedDiamondData();
                // Diamond address should be set
                (0, chai_1.expect)(deployedData.DiamondAddress).to.not.be.empty;
                // TODO Fix this test 
                // // Deployer address should match our signer
                // expect(deployedData.DeployerAddress.toLowerCase()).to.equal(deployer.address.toLowerCase());
                // Should have deployed facets
                (0, chai_1.expect)(deployedData.DeployedFacets).to.have.keys(['DiamondCutFacet', 'DiamondLoupeFacet', 'TestFacet']);
                // Should have run callback
                (0, chai_1.expect)(console.log.calledWith(sinon_1.default.match(/Running test callback/))).to.be.true;
            }
            finally {
                // Restore original function
                hardhat_1.ethers.getContractFactory = originalGetContractFactory;
            }
        });
        it('should handle facet upgrades correctly', async function () {
            var _a;
            // First deploy the diamond
            // Mock ethers.getContractFactory
            const originalGetContractFactory = hardhat_1.ethers.getContractFactory;
            // @ts-ignore - We need to mock this
            hardhat_1.ethers.getContractFactory = mockContractFactory;
            try {
                // Create and deploy with initial strategy
                const initialStrategy = new LocalDeploymentStrategy_1.LocalDeploymentStrategy();
                const initialDeployer = new DiamondDeployer_1.DiamondDeployer(diamond, initialStrategy);
                await initialDeployer.deployDiamond();
                // Get initial deployment data
                const initialData = diamond.getDeployedDiamondData();
                // Now simulate an upgrade
                // Create new facet version
                const config = repository.loadDeployConfig();
                if (!config.facets.TestFacet.versions) {
                    config.facets.TestFacet.versions = {};
                }
                config.facets.TestFacet.versions[1.0] = {
                    deployInit: "initialize()",
                    upgradeInit: "reinitialize()",
                    callbacks: ["testCallback"],
                    deployInclude: [],
                    deployExclude: []
                };
                // Write updated config
                await fs.writeJson(path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`), config, { spaces: 2 });
                // Create new strategy and deployer for upgrade
                const upgradeStrategy = new LocalDeploymentStrategy_1.LocalDeploymentStrategy();
                const upgradeDeployer = new DiamondDeployer_1.DiamondDeployer(diamond, upgradeStrategy);
                // Perform upgrade
                await upgradeDeployer.deployDiamond();
                // Get upgraded deployment data
                const upgradedData = diamond.getDeployedDiamondData();
                // Diamond address should be the same
                (0, chai_1.expect)(upgradedData.DiamondAddress).to.equal(initialData.DiamondAddress);
                // TestFacet should be updated
                (0, chai_1.expect)((_a = upgradedData.DeployedFacets) === null || _a === void 0 ? void 0 : _a.TestFacet.version).to.equal(1.0);
                // Callback should have been called again
                (0, chai_1.expect)(console.log.calledWith(sinon_1.default.match(/Running test callback/))).to.be.true;
            }
            finally {
                // Restore original function
                hardhat_1.ethers.getContractFactory = originalGetContractFactory;
            }
        });
    });
});
//# sourceMappingURL=localDeployment.test.js.map