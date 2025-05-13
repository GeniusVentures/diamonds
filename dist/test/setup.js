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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestEnvironment = exports.setupTestEnvironment = exports.setupTestFiles = exports.setupMockContracts = void 0;
// test/setup.ts
const hardhat_1 = require("hardhat");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Test setup helper that deploys mock contracts for diamond testing
 */
async function setupMockContracts() {
    const [deployer, ...accounts] = await hardhat_1.ethers.getSigners();
    // Deploy mock diamond cut facet
    const DiamondCutFacet = await hardhat_1.ethers.getContractFactory('MockDiamondCutFacet');
    const diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.deployed();
    // Deploy mock diamond loupe facet
    const DiamondLoupeFacet = await hardhat_1.ethers.getContractFactory('MockDiamondLoupeFacet');
    const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
    await diamondLoupeFacet.deployed();
    // Deploy mock test facet
    const TestFacet = await hardhat_1.ethers.getContractFactory('MockTestFacet');
    const testFacet = await TestFacet.deploy();
    await testFacet.deployed();
    // Deploy mock diamond
    const Diamond = await hardhat_1.ethers.getContractFactory('MockDiamond');
    const diamond = await Diamond.deploy(deployer.address, diamondCutFacet.address);
    await diamond.deployed();
    return {
        deployer,
        accounts,
        diamondCutFacet,
        diamondLoupeFacet,
        testFacet,
        diamond,
    };
}
exports.setupMockContracts = setupMockContracts;
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
    // Create sample config file
    const configPath = path.join(tempDir, diamondName, `${diamondName.toLowerCase()}.config.json`);
    // Sample configuration
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
    await fs.writeJson(configPath, sampleConfig, { spaces: 2 });
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
    // Create sample callback file
    const callbackPath = path.join(tempDir, diamondName, 'callbacks', 'TestFacet.ts');
    const callbackContent = `
import { CallbackArgs } from "../../../src/types";

export async function testCallback(args: CallbackArgs) {
  const { diamond } = args;
  console.log(\`Running test callback for \${diamond.diamondName} on \${diamond.networkName}\`);
  // Add any test callback logic here
}
`;
    await fs.writeFile(callbackPath, callbackContent);
    return {
        configPath,
        deploymentPath,
        callbackPath
    };
}
exports.setupTestFiles = setupTestFiles;
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
exports.setupTestEnvironment = setupTestEnvironment;
/**
 * Clean up test environment
 */
async function cleanupTestEnvironment(tempDir) {
    await fs.remove(tempDir);
}
exports.cleanupTestEnvironment = cleanupTestEnvironment;
//# sourceMappingURL=setup.js.map