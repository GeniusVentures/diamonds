import { expect } from 'chai';
import hre from 'hardhat';
import { 
    DiamondAbiGenerator, 
    generateDiamondAbi 
} from '../../src/utils/diamondAbiGenerator';
import { Diamond } from '../../src/core/Diamond';
import { DiamondDeployer } from '../../src/core/DiamondDeployer';
import { LocalDeploymentStrategy } from '../../src/strategies/LocalDeploymentStrategy';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { DiamondConfig } from '../../src/types';
import { rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Interface } from 'ethers';

describe('Diamond ABI Integration Tests', () => {
    let diamond: Diamond;
    let repository: FileDeploymentRepository;
    let config: DiamondConfig;
    let testOutputDir: string;

    before(async () => {
        // Setup test configuration for a real diamond deployment
        config = {
            diamondName: 'IntegrationTestDiamond',
            networkName: 'hardhat',
            chainId: 31337,
            deploymentsPath: './test-diamonds-integration',
            contractsPath: './contracts'
        };

        repository = new FileDeploymentRepository(config);
        diamond = new Diamond(config, repository);

        // Set up provider and signer
        diamond.setProvider((hre as any).ethers.provider);
        const signers = await (hre as any).ethers.getSigners();
        diamond.setSigner(signers[0]);

        testOutputDir = './test-output/diamond-abi-integration';
    });

    after(() => {
        // Clean up test output
        if (existsSync(testOutputDir)) {
            rmSync(testOutputDir, { recursive: true, force: true });
        }
        if (existsSync('./test-diamonds-integration')) {
            rmSync('./test-diamonds-integration', { recursive: true, force: true });
        }
    });

    describe('Full Diamond Deployment and ABI Generation', () => {
        it('should generate correct ABI after diamond deployment', async function() {
            this.timeout(120000); // 2 minutes for deployment

            try {
                // Deploy the diamond using the standard deployment process
                const strategy = new LocalDeploymentStrategy(false); // Non-verbose for cleaner test output
                const deployer = new DiamondDeployer(diamond, strategy);
                
                // Perform the deployment
                await deployer.deployDiamond();
                
                const deployedData = diamond.getDeployedDiamondData();
                expect(deployedData.DiamondAddress).to.not.be.empty;
                expect(deployedData.DeployedFacets).to.exist;
                
                // Generate ABI after deployment
                const result = await generateDiamondAbi(diamond, {
                    outputDir: testOutputDir,
                    includeSourceInfo: true,
                    validateSelectors: true,
                    verbose: true
                });

                // Verify the ABI generation results
                expect(result).to.have.property('abi').that.is.an('array');
                expect(result).to.have.property('selectorMap').that.is.an('object');
                expect(result).to.have.property('facetAddresses').that.is.an('array');
                expect(result).to.have.property('outputPath').that.is.a('string');

                // Verify we have the core diamond functions
                expect(result.stats.totalFunctions).to.be.greaterThan(0);
                expect(result.stats.facetCount).to.be.greaterThan(0);

                // Check for essential diamond functions
                const hasLoupe = Object.keys(result.selectorMap).some(selector => 
                    result.selectorMap[selector] === 'DiamondLoupeFacet'
                );
                const hasCut = Object.keys(result.selectorMap).some(selector => 
                    result.selectorMap[selector] === 'DiamondCutFacet'
                );

                if (hasLoupe) {
                    console.log('✅ DiamondLoupeFacet functions found in ABI');
                }
                if (hasCut) {
                    console.log('✅ DiamondCutFacet functions found in ABI');
                }

                // Verify output file structure
                expect(existsSync(result.outputPath!)).to.be.true;
                
                const artifact = JSON.parse(readFileSync(result.outputPath!, 'utf8'));
                expect(artifact).to.have.property('contractName', 'IntegrationTestDiamond');
                expect(artifact).to.have.property('abi').that.is.an('array');
                expect(artifact).to.have.property('_diamondMetadata');

                // Test the generated ABI can be used with ethers
                const diamondInterface = new Interface(artifact.abi);
                expect(diamondInterface).to.exist;
                
                // Verify we can get function fragments
                const functionCount = diamondInterface.fragments.filter(f => f.type === 'function').length;
                expect(functionCount).to.be.greaterThan(0);
                
                console.log(`✅ Generated ABI with ${functionCount} functions for ${result.stats.facetCount} facets`);

            } catch (error) {
                console.error('❌ Integration test failed:', error);
                throw error;
            }
        });

        it('should handle diamond upgrades correctly', async function() {
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
            const result = await generateDiamondAbi(diamond, {
                outputDir: join(testOutputDir, 'upgrade'),
                includeSourceInfo: true,
                verbose: true
            });

            // Should include the new selectors in the mapping
            expect(result.selectorMap['0x12345678']).to.equal('MockTestFacet');
            expect(result.selectorMap['0x87654321']).to.equal('MockTestFacet');

            // Verify output
            expect(result.outputPath).to.exist;
            expect(existsSync(result.outputPath!)).to.be.true;

            console.log(`✅ Upgrade simulation: ABI now includes ${Object.keys(result.selectorMap).length} function selectors`);
        });
    });

    describe('ABI Validation and Integrity', () => {
        it('should produce valid ethers.js compatible ABI', async () => {
            // Generate ABI
            const result = await generateDiamondAbi(diamond, {
                includeSourceInfo: false,
                verbose: false
            });

            // Test ABI with ethers Interface
            let ethersInterface: Interface;
            expect(() => {
                ethersInterface = new Interface(result.abi);
            }).to.not.throw();

            // Verify interface has expected properties
            expect(ethersInterface!).to.have.property('fragments');
            expect(ethersInterface!.fragments).to.be.an('array');

            // Test that we can encode/decode function calls
            const functionFragments = ethersInterface!.fragments.filter(f => f.type === 'function');
            if (functionFragments.length > 0) {
                const fragment = functionFragments[0];
                
                // Test encoding (should not throw)
                expect(() => {
                    if (fragment.type === 'function') {
                        const funcFragment = fragment as any;
                        if (funcFragment.inputs.length === 0) {
                            ethersInterface!.encodeFunctionData(funcFragment.name, []);
                        }
                    }
                }).to.not.throw();
            }

            console.log(`✅ ABI validation passed with ${functionFragments.length} functions`);
        });

        it('should maintain selector uniqueness across facets', async () => {
            const result = await generateDiamondAbi(diamond, {
                validateSelectors: true,
                verbose: false
            });

            // Check that all selectors in the mapping are unique
            const selectors = Object.keys(result.selectorMap);
            const uniqueSelectors = [...new Set(selectors)];
            
            expect(selectors.length).to.equal(uniqueSelectors.length);

            // Verify no duplicate function signatures
            const functionItems = result.abi.filter(item => item.type === 'function');
            const signatures = functionItems.map(item => {
                const inputs = item.inputs || [];
                return `${item.name}(${inputs.map((input: any) => input.type).join(',')})`;
            });
            
            const uniqueSignatures = [...new Set(signatures)];
            expect(signatures.length).to.equal(uniqueSignatures.length);

            console.log(`✅ Selector uniqueness verified: ${selectors.length} unique selectors`);
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle large numbers of facets efficiently', async function() {
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
            
            const result = await generateDiamondAbi(diamond, {
                verbose: false,
                includeSourceInfo: false
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time (less than 10 seconds)
            expect(duration).to.be.lessThan(10000);
            
            // Should handle all the facets
            expect(result.stats.facetCount).to.be.greaterThan(15); // Some might not have artifacts
            expect(Object.keys(result.selectorMap)).to.have.length.greaterThan(50);

            console.log(`✅ Performance test: Generated ABI for ${result.stats.facetCount} facets in ${duration}ms`);
        });
    });
});
