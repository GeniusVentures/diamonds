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
exports.setupMockContracts = setupMockContracts;
exports.setupTestFiles = setupTestFiles;
exports.setupTestEnvironment = setupTestEnvironment;
exports.cleanupTestEnvironment = cleanupTestEnvironment;
// test/setup.ts
const hardhat_1 = __importDefault(require("hardhat"));
;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Test setup helper that deploys mock contracts for diamond testing
 */
async function setupMockContracts() {
    const [deployer, ...accounts] = await hardhat_1.default.ethers.getSigners();
    // Deploy mock diamond cut facet
    const DiamondCutFacet = await hardhat_1.default.ethers.getContractFactory('MockDiamondCutFacet');
    const diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.waitForDeployment();
    // Deploy mock diamond loupe facet
    const DiamondLoupeFacet = await hardhat_1.default.ethers.getContractFactory('MockDiamondLoupeFacet');
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    await diamondLoupeFacet.waitForDeployment();
    // Deploy mock test facet
    const TestFacet = await hardhat_1.default.ethers.getContractFactory('MockTestFacet');
    const testFacet = await TestFacet.deploy();
    await testFacet.waitForDeployment();
    // Deploy mock diamond
    const Diamond = await hardhat_1.default.ethers.getContractFactory('MockDiamond');
    const diamond = await Diamond.deploy(deployer.address, await diamondCutFacet.getAddress());
    await diamond.waitForDeployment();
    return {
        deployer,
        accounts,
        diamondCutFacet,
        diamondLoupeFacet,
        testFacet,
        diamond,
    };
}
/**
 * Create test files and directories
 */
async function setupTestFiles(tempDir, diamondName, networkName, chainId) {
    // Create temporary directories for test artifacts
    await fs.ensureDir(tempDir);
    await fs.ensureDir(path.join(tempDir, diamondName));
    await fs.ensureDir(path.join(tempDir, diamondName, 'deployments'));
    await fs.ensureDir(path.join(tempDir, diamondName, 'deployments', 'defender'));
    await fs.ensureDir(path.join(tempDir, diamondName, 'callbacks'));
    await fs.ensureDir(path.join(tempDir, diamondName, 'deployments', diamondName, 'callbacks'));
    // Create sample config file
    const configPath = path.join(tempDir, diamondName, `${diamondName.toLowerCase()}.config.json`);
    // Copy the mock config file instead of creating a new one
    const mockConfigPath = path.join(__dirname, 'mocks', 'testdiamond.config.json');
    await fs.copy(mockConfigPath, configPath);
    // Create empty deployment data file
    const deploymentPath = path.join(tempDir, diamondName, 'deployments', `${diamondName.toLowerCase()}-${networkName.toLowerCase()}-${chainId}.json`);
    const emptyDeployment = {
        DiamondAddress: "",
        DeployerAddress: "",
        DeployedFacets: {},
        ExternalLibraries: {},
        protocolVersion: 0
    };
    await fs.writeJson(deploymentPath, emptyDeployment, { spaces: 2 });
    // Create sample callback file in both locations for compatibility
    const callbackPath1 = path.join(tempDir, diamondName, 'callbacks', 'TestFacet.js');
    const callbackPath2 = path.join(tempDir, diamondName, 'deployments', diamondName, 'callbacks', 'TestFacet.js');
    // Copy the mock callback file to both locations
    const mockCallbackPath = path.join(__dirname, 'mocks', 'callbacks', 'TestFacet.js');
    await fs.copy(mockCallbackPath, callbackPath1);
    await fs.copy(mockCallbackPath, callbackPath2);
    return {
        configPath,
        deploymentPath,
        callbackPath1,
        callbackPath2
    };
}
/**
 * Helper to create a temporary testing environment
 */
async function setupTestEnvironment(tempDir, diamondName = 'TestDiamond', networkName = 'hardhat', chainId = 31337) {
    const contracts = await setupMockContracts();
    const files = await setupTestFiles(tempDir, diamondName, networkName, chainId);
    return {
        ...contracts,
        ...files,
        tempDir,
        diamondName,
        networkName,
        chainId
    };
}
/**
 * Clean up test environment
 */
async function cleanupTestEnvironment(tempDir) {
    await fs.remove(tempDir);
}
//# sourceMappingURL=setup.js.map