"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = __importDefault(require("hardhat"));
const diamondAbiGenerator_1 = require("../../src/utils/diamondAbiGenerator");
const Diamond_1 = require("../../src/core/Diamond");
const DiamondDeployer_1 = require("../../src/core/DiamondDeployer");
const LocalDeploymentStrategy_1 = require("../../src/strategies/LocalDeploymentStrategy");
const FileDeploymentRepository_1 = require("../../src/repositories/FileDeploymentRepository");
const fs_1 = require("fs");
const path_1 = require("path");
const ethers_1 = require("ethers");
describe('Diamond ABI Integration Tests', () => {
    let diamond;
    let repository;
    let config;
    let testOutputDir;
    before(async () => {
        // Setup test configuration for a real diamond deployment
        config = {
            diamondName: 'IntegrationTestDiamond',
            networkName: 'hardhat',
            chainId: 31337,
            deploymentsPath: './test-diamonds-integration',
            contractsPath: './contracts'
        };
        repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        diamond = new Diamond_1.Diamond(config, repository);
        // Set up provider and signer
        diamond.setProvider(hardhat_1.default.ethers.provider);
        const signers = await hardhat_1.default.ethers.getSigners();
        diamond.setSigner(signers[0]);
        testOutputDir = './test-output/diamond-abi-integration';
    });
    after(() => {
        // Clean up test output
        if ((0, fs_1.existsSync)(testOutputDir)) {
            (0, fs_1.rmSync)(testOutputDir, { recursive: true, force: true });
        }
        if ((0, fs_1.existsSync)('./test-diamonds-integration')) {
            (0, fs_1.rmSync)('./test-diamonds-integration', { recursive: true, force: true });
        }
    });
    describe('Full Diamond Deployment and ABI Generation', () => {
        it('should generate correct ABI after diamond deployment', async function () {
            this.timeout(120000); // 2 minutes for deployment
            try {
                // Deploy the diamond using the standard deployment process
                const strategy = new LocalDeploymentStrategy_1.LocalDeploymentStrategy(false); // Non-verbose for cleaner test output
                const deployer = new DiamondDeployer_1.DiamondDeployer(diamond, strategy);
                // Perform the deployment
                await deployer.deployDiamond();
                const deployedData = diamond.getDeployedDiamondData();
                (0, chai_1.expect)(deployedData.DiamondAddress).to.not.be.empty;
                (0, chai_1.expect)(deployedData.DeployedFacets).to.exist;
                // Generate ABI after deployment
                const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                    outputDir: testOutputDir,
                    includeSourceInfo: true,
                    validateSelectors: true,
                    verbose: true
                });
                // Verify the ABI generation results
                (0, chai_1.expect)(result).to.have.property('abi').that.is.an('array');
                (0, chai_1.expect)(result).to.have.property('selectorMap').that.is.an('object');
                (0, chai_1.expect)(result).to.have.property('facetAddresses').that.is.an('array');
                (0, chai_1.expect)(result).to.have.property('outputPath').that.is.a('string');
                // Verify we have the core diamond functions
                (0, chai_1.expect)(result.stats.totalFunctions).to.be.greaterThan(0);
                (0, chai_1.expect)(result.stats.facetCount).to.be.greaterThan(0);
                // Check for essential diamond functions
                const hasLoupe = Object.keys(result.selectorMap).some(selector => result.selectorMap[selector] === 'DiamondLoupeFacet');
                const hasCut = Object.keys(result.selectorMap).some(selector => result.selectorMap[selector] === 'DiamondCutFacet');
                if (hasLoupe) {
                    console.log('✅ DiamondLoupeFacet functions found in ABI');
                }
                if (hasCut) {
                    console.log('✅ DiamondCutFacet functions found in ABI');
                }
                // Verify output file structure
                (0, chai_1.expect)((0, fs_1.existsSync)(result.outputPath)).to.be.true;
                const artifact = JSON.parse((0, fs_1.readFileSync)(result.outputPath, 'utf8'));
                (0, chai_1.expect)(artifact).to.have.property('contractName', 'IntegrationTestDiamond');
                (0, chai_1.expect)(artifact).to.have.property('abi').that.is.an('array');
                (0, chai_1.expect)(artifact).to.have.property('_diamondMetadata');
                // Test the generated ABI can be used with ethers
                const diamondInterface = new ethers_1.Interface(artifact.abi);
                (0, chai_1.expect)(diamondInterface).to.exist;
                // Verify we can get function fragments
                const functionCount = diamondInterface.fragments.filter(f => f.type === 'function').length;
                (0, chai_1.expect)(functionCount).to.be.greaterThan(0);
                console.log(`✅ Generated ABI with ${functionCount} functions for ${result.stats.facetCount} facets`);
            }
            catch (error) {
                console.error('❌ Integration test failed:', error);
                throw error;
            }
        });
        it('should handle diamond upgrades correctly', async function () {
            this.timeout(60000); // 1 minute for upgrade simulation
            // Simulate adding a new facet to the function selector registry
            diamond.registerFunctionSelectors({
                '0x12345678': {
                    facetName: 'MockTestFacet',
                    priority: 100,
                    address: '0x4567890123456789012345678901234567890123',
                    action: 1 // Add
                },
                '0x87654321': {
                    facetName: 'MockTestFacet',
                    priority: 100,
                    address: '0x4567890123456789012345678901234567890123',
                    action: 1 // Add
                }
            });
            // Generate ABI including the planned cuts
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                outputDir: (0, path_1.join)(testOutputDir, 'upgrade'),
                includeSourceInfo: true,
                verbose: true
            });
            // Should include the new selectors in the mapping
            (0, chai_1.expect)(result.selectorMap['0x12345678']).to.equal('MockTestFacet');
            (0, chai_1.expect)(result.selectorMap['0x87654321']).to.equal('MockTestFacet');
            // Verify output
            (0, chai_1.expect)(result.outputPath).to.exist;
            (0, chai_1.expect)((0, fs_1.existsSync)(result.outputPath)).to.be.true;
            console.log(`✅ Upgrade simulation: ABI now includes ${Object.keys(result.selectorMap).length} function selectors`);
        });
    });
    describe('ABI Validation and Integrity', () => {
        it('should produce valid ethers.js compatible ABI', async () => {
            // Generate ABI
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                includeSourceInfo: false,
                verbose: false
            });
            // Test ABI with ethers Interface
            let ethersInterface;
            (0, chai_1.expect)(() => {
                ethersInterface = new ethers_1.Interface(result.abi);
            }).to.not.throw();
            // Verify interface has expected properties
            (0, chai_1.expect)(ethersInterface).to.have.property('fragments');
            (0, chai_1.expect)(ethersInterface.fragments).to.be.an('array');
            // Test that we can encode/decode function calls
            const functionFragments = ethersInterface.fragments.filter(f => f.type === 'function');
            if (functionFragments.length > 0) {
                const fragment = functionFragments[0];
                // Test encoding (should not throw)
                (0, chai_1.expect)(() => {
                    if (fragment.type === 'function') {
                        const funcFragment = fragment;
                        if (funcFragment.inputs.length === 0) {
                            ethersInterface.encodeFunctionData(funcFragment.name, []);
                        }
                    }
                }).to.not.throw();
            }
            console.log(`✅ ABI validation passed with ${functionFragments.length} functions`);
        });
        it('should maintain selector uniqueness across facets', async () => {
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                validateSelectors: true,
                verbose: false
            });
            // Check that all selectors in the mapping are unique
            const selectors = Object.keys(result.selectorMap);
            const uniqueSelectors = [...new Set(selectors)];
            (0, chai_1.expect)(selectors.length).to.equal(uniqueSelectors.length);
            // Verify no duplicate function signatures
            const functionItems = result.abi.filter(item => item.type === 'function');
            const signatures = functionItems.map(item => {
                const inputs = item.inputs || [];
                return `${item.name}(${inputs.map((input) => input.type).join(',')})`;
            });
            const uniqueSignatures = [...new Set(signatures)];
            (0, chai_1.expect)(signatures.length).to.equal(uniqueSignatures.length);
            console.log(`✅ Selector uniqueness verified: ${selectors.length} unique selectors`);
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle large numbers of facets efficiently', async function () {
            this.timeout(30000); // 30 seconds
            // Simulate a diamond with many facets
            const manyFacetsData = diamond.getDeployedDiamondData();
            // Add multiple mock facets
            for (let i = 0; i < 20; i++) {
                const facetName = `MockFacet${i}`;
                const selectors = [];
                // Add 5 selectors per facet
                for (let j = 0; j < 5; j++) {
                    const selector = `0x${(i * 100 + j).toString(16).padStart(8, '0')}`;
                    selectors.push(selector);
                }
                if (!manyFacetsData.DeployedFacets) {
                    manyFacetsData.DeployedFacets = {};
                }
                manyFacetsData.DeployedFacets[facetName] = {
                    address: `0x${i.toString(16).padStart(40, '0')}`,
                    tx_hash: `0x${i.toString(16)}`,
                    version: 0,
                    funcSelectors: selectors
                };
            }
            diamond.setDeployedDiamondData(manyFacetsData);
            const startTime = Date.now();
            const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
                verbose: false,
                includeSourceInfo: false
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should complete in reasonable time (less than 10 seconds)
            (0, chai_1.expect)(duration).to.be.lessThan(10000);
            // Should handle all the facets
            (0, chai_1.expect)(result.stats.facetCount).to.be.greaterThan(15); // Some might not have artifacts
            (0, chai_1.expect)(Object.keys(result.selectorMap)).to.have.length.greaterThan(50);
            console.log(`✅ Performance test: Generated ABI for ${result.stats.facetCount} facets in ${duration}ms`);
        });
    });
});
//# sourceMappingURL=diamondAbiGeneration.test.js.map