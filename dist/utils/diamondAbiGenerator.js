"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiamondAbiGenerator = void 0;
exports.generateDiamondAbi = generateDiamondAbi;
exports.previewDiamondAbi = previewDiamondAbi;
const chalk_1 = __importDefault(require("chalk"));
const ethers_1 = require("ethers");
const fs_1 = require("fs");
const path_1 = require("path");
const types_1 = require("../types");
const contractMapping_1 = require("../utils/contractMapping");
/**
 * Comprehensive Diamond ABI Generator
 *
 * This class generates a complete ABI for a diamond contract based on:
 * - Current deployment state (deployed facets)
 * - Planned diamond cuts (upgrades, additions, removals)
 * - Function selector registry
 * - Deployment configuration
 */
class DiamondAbiGenerator {
    diamond;
    options;
    seenSelectors = new Set();
    selectorToFacet = {};
    combinedAbi = [];
    stats = {
        totalFunctions: 0,
        totalEvents: 0,
        totalErrors: 0,
        facetCount: 0,
        duplicateSelectorsSkipped: 0
    };
    constructor(options) {
        this.diamond = options.diamond;
        this.options = {
            outputDir: options.outputDir || this.diamond.getDiamondAbiPath(),
            includeSourceInfo: true,
            validateSelectors: true,
            verbose: false,
            ...options
        };
    }
    /**
     * Generate the complete diamond ABI
     */
    async generateAbi() {
        if (this.options.verbose) {
            console.log(chalk_1.default.blue('🔧 Generating Diamond ABI...'));
        }
        // Reset state
        this.seenSelectors.clear();
        this.selectorToFacet = {};
        this.combinedAbi = [];
        this.stats = {
            totalFunctions: 0,
            totalEvents: 0,
            totalErrors: 0,
            facetCount: 0,
            duplicateSelectorsSkipped: 0
        };
        // Get facets to include in ABI
        const facetsToInclude = await this.getFacetsToInclude();
        // Process each facet
        for (const [facetName, facetInfo] of Object.entries(facetsToInclude)) {
            await this.processFacet(facetName, facetInfo);
        }
        // Add DiamondLoupe functions if not already included
        await this.ensureDiamondLoupeFunctions();
        // Sort ABI for consistency
        this.sortAbi();
        // Generate output
        const result = await this.generateOutput();
        if (this.options.verbose) {
            this.logStats();
        }
        return result;
    }
    /**
     * Get all facets that should be included in the ABI
     */
    async getFacetsToInclude() {
        const facetsToInclude = {};
        // 1. Get currently deployed facets
        const deployedData = this.diamond.getDeployedDiamondData();
        if (deployedData.DeployedFacets) {
            for (const [facetName, facetData] of Object.entries(deployedData.DeployedFacets)) {
                if (facetData.address && facetData.funcSelectors) {
                    facetsToInclude[facetName] = {
                        address: facetData.address,
                        selectors: facetData.funcSelectors,
                        action: types_1.RegistryFacetCutAction.Deployed,
                        source: 'deployed'
                    };
                }
            }
        }
        // 2. Get planned cuts from function selector registry
        const registry = this.diamond.functionSelectorRegistry;
        for (const [selector, entry] of registry.entries()) {
            if (entry.action === types_1.RegistryFacetCutAction.Add || entry.action === types_1.RegistryFacetCutAction.Replace) {
                const facetName = entry.facetName;
                if (!facetsToInclude[facetName]) {
                    facetsToInclude[facetName] = {
                        address: entry.address,
                        selectors: [],
                        action: entry.action,
                        source: 'registry'
                    };
                }
                facetsToInclude[facetName].selectors.push(selector);
            }
            else if (entry.action === types_1.RegistryFacetCutAction.Remove) {
                // Remove selector from existing facet
                const facetName = entry.facetName;
                if (facetsToInclude[facetName]) {
                    facetsToInclude[facetName].selectors = facetsToInclude[facetName].selectors.filter(s => s !== selector);
                }
            }
        }
        // 3. Apply custom facet cuts if provided
        if (this.options.customFacetCuts) {
            for (const cut of this.options.customFacetCuts) {
                const facetName = cut.name;
                if (cut.action === 0) { // Add
                    if (!facetsToInclude[facetName]) {
                        facetsToInclude[facetName] = {
                            address: cut.facetAddress,
                            selectors: [],
                            action: types_1.RegistryFacetCutAction.Add,
                            source: 'custom'
                        };
                    }
                    facetsToInclude[facetName].selectors.push(...cut.functionSelectors);
                }
                else if (cut.action === 2) { // Remove
                    if (facetsToInclude[facetName]) {
                        facetsToInclude[facetName].selectors = facetsToInclude[facetName].selectors.filter(s => !cut.functionSelectors.includes(s));
                    }
                }
            }
        }
        // Remove facets with no selectors
        for (const [facetName, facetInfo] of Object.entries(facetsToInclude)) {
            if (facetInfo.selectors.length === 0) {
                delete facetsToInclude[facetName];
            }
        }
        return facetsToInclude;
    }
    /**
     * Process a single facet and add its ABI items
     */
    async processFacet(facetName, facetInfo) {
        try {
            if (this.options.verbose) {
                console.log(chalk_1.default.cyan(`📄 Processing ${facetName}...`));
            }
            // Get the contract artifact
            let artifact;
            try {
                artifact = await (0, contractMapping_1.getContractArtifact)(facetName, this.diamond);
            }
            catch (artifactError) {
                if (this.options.verbose) {
                    console.log(chalk_1.default.yellow(`⚠️  Artifact loading failed for ${facetName}: ${artifactError}`));
                }
                artifact = null;
            }
            if (!artifact || !artifact.abi) {
                if (this.options.verbose) {
                    console.log(chalk_1.default.yellow(`⚠️  No ABI found for ${facetName}`));
                }
                // Still add selectors to mapping even if artifact can't be loaded
                // This handles cases where selectors are in the registry but no artifact exists
                for (const selector of facetInfo.selectors) {
                    if (!this.seenSelectors.has(selector)) {
                        this.selectorToFacet[selector] = facetName;
                        this.seenSelectors.add(selector);
                    }
                }
                return;
            }
            // Create interface for selector calculation
            const iface = new ethers_1.Interface(artifact.abi);
            // Process each ABI item
            for (const abiItem of artifact.abi) {
                await this.processAbiItem(abiItem, facetName, facetInfo, iface);
            }
            // For facets from the registry, add any selectors that weren't found in the ABI
            // This handles cases where selectors are manually registered but don't have corresponding ABI items
            if (facetInfo.source === 'registry') {
                for (const selector of facetInfo.selectors) {
                    if (!this.seenSelectors.has(selector)) {
                        this.selectorToFacet[selector] = facetName;
                        this.seenSelectors.add(selector);
                    }
                }
            }
            this.stats.facetCount++;
        }
        catch (error) {
            console.error(chalk_1.default.red(`❌ Error processing ${facetName}:`), error);
            // Still add selectors to mapping even if there was an error
            for (const selector of facetInfo.selectors) {
                if (!this.seenSelectors.has(selector)) {
                    this.selectorToFacet[selector] = facetName;
                    this.seenSelectors.add(selector);
                }
            }
        }
    }
    /**
     * Process a single ABI item
     */
    async processAbiItem(abiItem, facetName, facetInfo, iface) {
        // Skip constructors for diamond
        if (abiItem.type === 'constructor') {
            return;
        }
        // Handle functions
        if (abiItem.type === 'function') {
            const selector = iface.getFunction(abiItem.name)?.selector;
            if (!selector) {
                if (this.options.verbose) {
                    console.log(chalk_1.default.yellow(`⚠️  Could not calculate selector for ${abiItem.name}`));
                }
                return;
            }
            // Check if this function should be included
            if (facetInfo.selectors.length > 0 && !facetInfo.selectors.includes(selector)) {
                return; // Function not in the deployment
            }
            // Check for duplicates
            if (this.seenSelectors.has(selector)) {
                if (this.options.verbose) {
                    console.log(chalk_1.default.yellow(`⚠️  Skipping duplicate function: ${abiItem.name} (${selector})`));
                }
                this.stats.duplicateSelectorsSkipped++;
                return;
            }
            this.seenSelectors.add(selector);
            this.selectorToFacet[selector] = facetName;
            // Add source information if requested
            if (this.options.includeSourceInfo) {
                abiItem._diamondFacet = facetName;
                abiItem._diamondSelector = selector;
            }
            this.combinedAbi.push(abiItem);
            this.stats.totalFunctions++;
        }
        // Handle events
        else if (abiItem.type === 'event') {
            // Events are global to the diamond, so include all of them
            this.combinedAbi.push(abiItem);
            this.stats.totalEvents++;
        }
        // Handle errors
        else if (abiItem.type === 'error') {
            // Errors are global to the diamond, so include all of them
            this.combinedAbi.push(abiItem);
            this.stats.totalErrors++;
        }
    }
    /**
     * Ensure DiamondLoupe functions are included
     */
    async ensureDiamondLoupeFunctions() {
        const loupeSelectors = ['0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627']; // facets(), facetFunctionSelectors(), facetAddresses(), facetAddress()
        // Check if any loupe selectors are already included
        for (const selector of loupeSelectors) {
            if (!this.seenSelectors.has(selector)) {
                try {
                    await this.processFacet('DiamondLoupeFacet', {
                        address: '0x0000000000000000000000000000000000000000',
                        selectors: [selector],
                        action: types_1.RegistryFacetCutAction.Deployed,
                        source: 'loupe'
                    });
                }
                catch (error) {
                    // DiamondLoupeFacet might not be available, continue
                }
            }
        }
    }
    /**
     * Sort the ABI for consistency
     */
    sortAbi() {
        this.combinedAbi.sort((a, b) => {
            // Sort by type first (functions, events, errors)
            if (a.type !== b.type) {
                const typeOrder = { 'function': 0, 'event': 1, 'error': 2 };
                return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
            }
            // Then by name
            return (a.name || '').localeCompare(b.name || '');
        });
    }
    /**
     * Generate the output files and result
     */
    async generateOutput() {
        const result = {
            abi: this.combinedAbi,
            selectorMap: this.selectorToFacet,
            facetAddresses: [...new Set(Object.values(this.selectorToFacet))],
            stats: { ...this.stats }
        };
        // Create output directory if specified
        if (this.options.outputDir) {
            (0, fs_1.mkdirSync)(this.options.outputDir, { recursive: true });
            // Generate the diamond artifact
            const diamondArtifact = {
                "_format": "hh-sol-artifact-1",
                "contractName": this.diamond.diamondName,
                "sourceName": "diamond-abi/DiamondABI.sol",
                "abi": this.combinedAbi,
                "bytecode": "",
                "deployedBytecode": "",
                "linkReferences": {},
                "deployedLinkReferences": {},
                "_diamondMetadata": {
                    "generatedAt": new Date().toISOString(),
                    "diamondName": this.diamond.diamondName,
                    "networkName": this.diamond.networkName,
                    "chainId": this.diamond.chainId,
                    "selectorMap": this.selectorToFacet,
                    "stats": this.stats
                }
            };
            // Write the combined artifact
            const outputPath = (0, path_1.join)(this.options.outputDir, `${this.diamond.getDiamondAbiFileName()}.json`);
            (0, fs_1.writeFileSync)(outputPath, JSON.stringify(diamondArtifact, null, 2));
            // Write a TypeScript interface file
            const interfacePath = (0, path_1.join)(this.options.outputDir, `${this.diamond.getDiamondAbiFileName()}.d.ts`);
            this.generateTypeScriptInterface(interfacePath);
            result.outputPath = outputPath;
            if (this.options.verbose) {
                console.log(chalk_1.default.green(`✅ Diamond ABI artifact created at: ${outputPath}`));
            }
        }
        return result;
    }
    /**
     * Generate TypeScript interface for the diamond
     */
    generateTypeScriptInterface(outputPath) {
        const interfaceContent = `
// Auto-generated Diamond ABI interface
// Generated at: ${new Date().toISOString()}
// Diamond: ${this.diamond.diamondName}
// Network: ${this.diamond.networkName}

export interface ${this.diamond.diamondName}Interface {
  // Function selectors to facet mapping
  readonly selectorMap: {
${Object.entries(this.selectorToFacet).map(([selector, facet]) => `    "${selector}": "${facet}";`).join('\n')}
  };
  
  // Facet addresses
  readonly facetAddresses: string[];
  
  // ABI for ethers.js Contract instantiation
  readonly abi: AbiItem[];
}

export const ${this.diamond.diamondName}ABI: ${this.diamond.diamondName}Interface;
`;
        (0, fs_1.writeFileSync)(outputPath, interfaceContent);
    }
    /**
     * Log generation statistics
     */
    logStats() {
        console.log(chalk_1.default.blue('\n📊 Diamond ABI Generation Statistics:'));
        console.log(chalk_1.default.cyan(`  Functions: ${this.stats.totalFunctions}`));
        console.log(chalk_1.default.cyan(`  Events: ${this.stats.totalEvents}`));
        console.log(chalk_1.default.cyan(`  Errors: ${this.stats.totalErrors}`));
        console.log(chalk_1.default.cyan(`  Facets: ${this.stats.facetCount}`));
        console.log(chalk_1.default.cyan(`  Unique selectors: ${this.seenSelectors.size}`));
        if (this.stats.duplicateSelectorsSkipped > 0) {
            console.log(chalk_1.default.yellow(`  Duplicate selectors skipped: ${this.stats.duplicateSelectorsSkipped}`));
        }
    }
    /**
     * Static method to generate ABI for a diamond
     */
    static async generate(options) {
        const generator = new DiamondAbiGenerator(options);
        return generator.generateAbi();
    }
}
exports.DiamondAbiGenerator = DiamondAbiGenerator;
/**
 * Generate ABI for a diamond (convenience function)
 */
async function generateDiamondAbi(diamond, options = {}) {
    return DiamondAbiGenerator.generate({ diamond, ...options });
}
/**
 * Preview what the ABI would look like after planned cuts
 */
async function previewDiamondAbi(diamond, plannedCuts, options = {}) {
    return DiamondAbiGenerator.generate({
        diamond,
        customFacetCuts: plannedCuts,
        ...options
    });
}
//# sourceMappingURL=diamondAbiGenerator.js.map