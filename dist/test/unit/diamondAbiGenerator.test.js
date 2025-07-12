"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = __importDefault(require("hardhat"));
const diamondAbiGenerator_1 = require("../../src/utils/diamondAbiGenerator");
const Diamond_1 = require("../../src/core/Diamond");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
const types_1 = require("../../src/types");
const fs_1 = require("fs");
const path_1 = require("path");
describe('DiamondAbiGenerator', () => {
    let diamond;
    let repository;
    let config;
    let testOutputDir;
    beforeEach(async () => {
        // Setup test configuration
        config = {
            diamondName: 'TestDiamond',
            networkName: 'test',
            chainId: 31337,
            deploymentsPath: './test-diamonds',
            contractsPath: './contracts'
        };
        repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        diamond = new Diamond_1.Diamond(config, repository);
        // Set up provider and signer
        diamond.setProvider(hardhat_1.default.ethers.provider);
        const signers = await hardhat_1.default.ethers.getSigners();
        diamond.setSigner(signers[0]);
        testOutputDir = './test-output/diamond-abi';
    });
    afterEach(() => {
        // Clean up test output
        if ((0, fs_1.existsSync)(testOutputDir)) {
            (0, fs_1.rmSync)(testOutputDir, { recursive: true, force: true });
        }
    });
    describe('Basic ABI Generation', () => {
        it('should generate ABI for diamond with deployed facets', async () => {
            // Setup deployed diamond data
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c'] // diamondCut
                    },
                    'DiamondLoupeFacet': {
                        address: '0x3456789012345678901234567890123456789012',
                        tx_hash: '0xefgh',
                        version: 0,
                        funcSelectors: ['0xcdffacc6', '0x52ef6b2c'] // facets, facetFunctionSelectors
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                outputDir: testOutputDir,
                verbose: true
            });
            // Verify result structure
            (0, chai_1.expect)(result).to.have.property('abi').that.is.an('array');
            (0, chai_1.expect)(result).to.have.property('selectorMap').that.is.an('object');
            (0, chai_1.expect)(result).to.have.property('facetAddresses').that.is.an('array');
            (0, chai_1.expect)(result).to.have.property('stats').that.is.an('object');
            // Verify stats
            (0, chai_1.expect)(result.stats.facetCount).to.equal(2);
            (0, chai_1.expect)(result.stats.totalFunctions).to.be.greaterThan(0);
            // Verify selectors are mapped correctly
            (0, chai_1.expect)(result.selectorMap['0x1f931c1c']).to.equal('DiamondCutFacet');
            (0, chai_1.expect)(result.selectorMap['0xcdffacc6']).to.equal('DiamondLoupeFacet');
            // Verify output file was created
            (0, chai_1.expect)(result.outputPath).to.exist;
            (0, chai_1.expect)((0, fs_1.existsSync)(result.outputPath)).to.be.true;
        });
        it('should handle empty diamond (no deployed facets)', async () => {
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                verbose: true
            });
            (0, chai_1.expect)(result.abi).to.be.an('array');
            (0, chai_1.expect)(result.stats.facetCount).to.equal(0);
            (0, chai_1.expect)(result.stats.totalFunctions).to.be.greaterThanOrEqual(0);
        });
        it('should include planned cuts from function selector registry', async () => {
            // Add planned cuts to registry
            diamond.registerFunctionSelectors({
                '0x12345678': {
                    facetName: 'TestFacet',
                    priority: 100,
                    address: '0x4567890123456789012345678901234567890123',
                    action: types_1.RegistryFacetCutAction.Add
                },
                '0x87654321': {
                    facetName: 'TestFacet',
                    priority: 100,
                    address: '0x4567890123456789012345678901234567890123',
                    action: types_1.RegistryFacetCutAction.Add
                }
            });
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                verbose: true
            });
            // Should include the planned additions
            (0, chai_1.expect)(result.selectorMap['0x12345678']).to.equal('TestFacet');
            (0, chai_1.expect)(result.selectorMap['0x87654321']).to.equal('TestFacet');
        });
    });
    describe('ABI Preview Functionality', () => {
        beforeEach(() => {
            // Setup some initial deployed state
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c']
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
        });
        it('should preview ABI changes with custom facet cuts', async () => {
            const plannedCuts = [
                {
                    facetAddress: '0x3456789012345678901234567890123456789012',
                    action: 0, // Add
                    functionSelectors: ['0xcdffacc6', '0x52ef6b2c'],
                    name: 'DiamondLoupeFacet'
                }
            ];
            const result = await (0, diamondAbiGenerator_1.previewDiamondAbi)(diamond, plannedCuts, {
                verbose: true
            });
            // Should include both existing and planned facets
            (0, chai_1.expect)(result.selectorMap['0x1f931c1c']).to.equal('DiamondCutFacet');
            (0, chai_1.expect)(result.selectorMap['0xcdffacc6']).to.equal('DiamondLoupeFacet');
            (0, chai_1.expect)(result.selectorMap['0x52ef6b2c']).to.equal('DiamondLoupeFacet');
        });
        it('should handle facet removal in preview', async () => {
            const plannedCuts = [
                {
                    facetAddress: '0x0000000000000000000000000000000000000000',
                    action: 2, // Remove
                    functionSelectors: ['0x1f931c1c'],
                    name: 'DiamondCutFacet'
                }
            ];
            const result = await (0, diamondAbiGenerator_1.previewDiamondAbi)(diamond, plannedCuts, {
                verbose: true
            });
            // DiamondCutFacet selector should be removed
            (0, chai_1.expect)(result.selectorMap['0x1f931c1c']).to.be.undefined;
        });
    });
    describe('Output Generation', () => {
        it('should create properly formatted artifact file', async () => {
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c']
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                outputDir: testOutputDir,
                includeSourceInfo: true
            });
            // Verify artifact file structure
            const artifactPath = result.outputPath;
            (0, chai_1.expect)((0, fs_1.existsSync)(artifactPath)).to.be.true;
            const artifact = JSON.parse((0, fs_1.readFileSync)(artifactPath, 'utf8'));
            (0, chai_1.expect)(artifact).to.have.property('_format', 'hh-sol-artifact-1');
            (0, chai_1.expect)(artifact).to.have.property('contractName', 'TestDiamond');
            (0, chai_1.expect)(artifact).to.have.property('abi').that.is.an('array');
            (0, chai_1.expect)(artifact).to.have.property('_diamondMetadata').that.is.an('object');
            // Verify metadata
            const metadata = artifact._diamondMetadata;
            (0, chai_1.expect)(metadata).to.have.property('diamondName', 'TestDiamond');
            (0, chai_1.expect)(metadata).to.have.property('networkName', 'test');
            (0, chai_1.expect)(metadata).to.have.property('chainId', 31337);
            (0, chai_1.expect)(metadata).to.have.property('selectorMap').that.is.an('object');
            (0, chai_1.expect)(metadata).to.have.property('stats').that.is.an('object');
        });
        it('should create TypeScript interface file', async () => {
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c']
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                outputDir: testOutputDir,
                includeSourceInfo: true
            });
            // Verify TypeScript interface file
            const interfacePath = (0, path_1.join)(testOutputDir, 'TestDiamond.d.ts');
            (0, chai_1.expect)((0, fs_1.existsSync)(interfacePath)).to.be.true;
            const interfaceContent = (0, fs_1.readFileSync)(interfacePath, 'utf8');
            (0, chai_1.expect)(interfaceContent).to.include('TestDiamondInterface');
            (0, chai_1.expect)(interfaceContent).to.include('selectorMap');
            (0, chai_1.expect)(interfaceContent).to.include('0x1f931c1c');
            (0, chai_1.expect)(interfaceContent).to.include('DiamondCutFacet');
        });
        it('should include source information when requested', async () => {
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c']
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                includeSourceInfo: true
            });
            // Check if ABI items include source information
            const functionItems = result.abi.filter(item => item.type === 'function');
            if (functionItems.length > 0) {
                const hasSourceInfo = functionItems.some(item => item._diamondFacet && item._diamondSelector);
                (0, chai_1.expect)(hasSourceInfo).to.be.true;
            }
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle non-existent facet contracts gracefully', async () => {
            // Add a facet that doesn't exist
            diamond.registerFunctionSelectors({
                '0x12345678': {
                    facetName: 'NonExistentFacet',
                    priority: 100,
                    address: '0x4567890123456789012345678901234567890123',
                    action: types_1.RegistryFacetCutAction.Add
                }
            });
            // Should not throw an error
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                verbose: true
            });
            (0, chai_1.expect)(result).to.have.property('abi');
            (0, chai_1.expect)(result).to.have.property('stats');
        });
        it('should skip duplicate function selectors', async () => {
            // Setup diamond with duplicate selectors from different facets
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'FacetA': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x12345678']
                    },
                    'FacetB': {
                        address: '0x3456789012345678901234567890123456789012',
                        tx_hash: '0xefgh',
                        version: 0,
                        funcSelectors: ['0x12345678'] // Same selector
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                verbose: true
            });
            (0, chai_1.expect)(result.stats.duplicateSelectorsSkipped).to.be.greaterThan(0);
        });
        it('should validate selector uniqueness when enabled', async () => {
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c']
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                validateSelectors: true,
                verbose: true
            });
            (0, chai_1.expect)(result).to.have.property('abi');
            (0, chai_1.expect)(result.stats.totalFunctions).to.be.greaterThanOrEqual(0);
        });
    });
    describe('Integration with Diamond System', () => {
        it('should work with actual diamond deployment flow', async () => {
            // This would be a more complex integration test
            // that simulates the actual deployment process
            // Setup initial deployment
            const deployedData = {
                DiamondAddress: '0x1234567890123456789012345678901234567890',
                DeployerAddress: '0x742d35Cc6634C0532925a3b8D50d97e7',
                DeployedFacets: {
                    'DiamondCutFacet': {
                        address: '0x2345678901234567890123456789012345678901',
                        tx_hash: '0xabcd',
                        version: 0,
                        funcSelectors: ['0x1f931c1c']
                    }
                }
            };
            diamond.setDeployedDiamondData(deployedData);
            // Add some planned cuts via registry
            diamond.registerFunctionSelectors({
                '0xcdffacc6': {
                    facetName: 'DiamondLoupeFacet',
                    priority: 20,
                    address: '0x3456789012345678901234567890123456789012',
                    action: types_1.RegistryFacetCutAction.Add
                }
            });
            // Generate ABI that includes both deployed and planned
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                outputDir: testOutputDir,
                verbose: true
            });
            // Should include both existing and planned functions
            (0, chai_1.expect)(result.selectorMap['0x1f931c1c']).to.equal('DiamondCutFacet');
            (0, chai_1.expect)(result.selectorMap['0xcdffacc6']).to.equal('DiamondLoupeFacet');
            (0, chai_1.expect)(result.stats.facetCount).to.be.greaterThan(0);
        });
    });
});
//# sourceMappingURL=diamondAbiGenerator.test.js.map