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
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const Diamond_1 = require("../../src/core/Diamond");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
describe('Diamond Setup Test', function () {
    this.timeout(10000);
    const TEMP_DIR = path.join(__dirname, '../.tmp-diamond-setup');
    const DIAMOND_NAME = 'SetupTestDiamond';
    let signers;
    before(async function () {
        await fs.ensureDir(TEMP_DIR);
        signers = await hardhat_1.default.ethers.getSigners();
    });
    after(async function () {
        await fs.remove(TEMP_DIR);
    });
    it('should create and configure diamond successfully', async function () {
        // Create test directories
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
        await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));
        // Create a simple config
        const sampleConfig = {
            protocolVersion: 0.0,
            protocolInitFacet: 'TestFacet',
            facets: {
                DiamondCutFacet: {
                    priority: 10,
                    versions: { "0.0": {} }
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
        const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
        await fs.writeJson(configPath, sampleConfig, { spaces: 2 });
        // Create callback file
        const callbackFile = path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks', 'TestFacet.js');
        const callbackContent = `
module.exports = {
  testCallback: function() {
    console.log('Test callback executed');
  }
};
`;
        await fs.writeFile(callbackFile, callbackContent);
        // Set up configuration
        const config = {
            diamondName: DIAMOND_NAME,
            networkName: 'hardhat',
            chainId: 31337,
            deploymentsPath: TEMP_DIR,
            contractsPath: 'test/mocks/contracts',
            callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
            configFilePath: configPath,
            deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-hardhat-31337.json`)
        };
        // Create diamond
        const repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        const diamond = new Diamond_1.Diamond(config, repository);
        // Setup the diamond
        diamond.setProvider(hardhat_1.default.ethers.provider);
        diamond.setSigner(signers[0]);
        // Test basic functionality
        (0, chai_1.expect)(diamond.diamondName).to.equal(DIAMOND_NAME);
        (0, chai_1.expect)(diamond.getDiamondConfig()).to.deep.equal(config);
        // Test loading configuration
        const deployConfig = diamond.getDeployConfig();
        (0, chai_1.expect)(deployConfig.facets).to.have.property('DiamondCutFacet');
        (0, chai_1.expect)(deployConfig.facets).to.have.property('TestFacet');
        console.log('Diamond configuration test passed!');
    });
});
//# sourceMappingURL=diamond-setup.test.js.map