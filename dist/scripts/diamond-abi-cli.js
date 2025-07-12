#!/usr/bin/env node
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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const diamondAbiGenerator_1 = require("../src/utils/diamondAbiGenerator");
const Diamond_1 = require("../src/core/Diamond");
const FileDeploymentRepository_1 = require("../src/repositories/FileDeploymentRepository");
const fs_1 = require("fs");
const hardhat_1 = __importDefault(require("hardhat"));
const program = new commander_1.Command();
program
    .name('diamond-abi')
    .description('Diamond ABI generation utilities')
    .version('1.0.0');
// Generate command
program
    .command('generate')
    .description('Generate ABI for a deployed diamond')
    .option('-d, --diamond <name>', 'Diamond name', 'GeniusDiamond')
    .option('-n, --network <name>', 'Network name', 'localhost')
    .option('-c, --chain-id <id>', 'Chain ID', '31337')
    .option('-o, --output <dir>', 'Output directory', 'artifacts/diamond-abi')
    .option('--deployments-path <path>', 'Deployments path', './diamonds')
    .option('--contracts-path <path>', 'Contracts path', './contracts')
    .option('--include-source', 'Include source information in ABI', false)
    .option('--validate-selectors', 'Validate function selector uniqueness', true)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔧 Generating Diamond ABI...'));
        const config = {
            diamondName: options.diamond,
            networkName: options.network,
            chainId: parseInt(options.chainId),
            deploymentsPath: options.deploymentsPath,
            contractsPath: options.contractsPath
        };
        if (options.verbose) {
            console.log(chalk_1.default.cyan('📋 Configuration:'));
            console.log(chalk_1.default.gray(`  Diamond: ${config.diamondName}`));
            console.log(chalk_1.default.gray(`  Network: ${config.networkName}`));
            console.log(chalk_1.default.gray(`  Chain ID: ${config.chainId}`));
            console.log(chalk_1.default.gray(`  Output: ${options.output}`));
        }
        // Create diamond instance
        const repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        const diamond = new Diamond_1.Diamond(config, repository);
        // Set provider and signer if available
        await setupDiamondConnection(diamond, options.verbose);
        // Generate ABI
        const result = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
            outputDir: options.output,
            includeSourceInfo: options.includeSource,
            validateSelectors: options.validateSelectors,
            verbose: options.verbose
        });
        console.log(chalk_1.default.green('\n✅ Diamond ABI generation completed!'));
        displayResults(result, options.verbose);
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error generating Diamond ABI:'), error);
        process.exit(1);
    }
});
// Preview command
program
    .command('preview')
    .description('Preview ABI changes for planned diamond cuts')
    .option('-d, --diamond <name>', 'Diamond name', 'GeniusDiamond')
    .option('-n, --network <name>', 'Network name', 'localhost')
    .option('-c, --chain-id <id>', 'Chain ID', '31337')
    .option('--deployments-path <path>', 'Deployments path', './diamonds')
    .option('--contracts-path <path>', 'Contracts path', './contracts')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔍 Previewing Diamond ABI changes...'));
        const config = {
            diamondName: options.diamond,
            networkName: options.network,
            chainId: parseInt(options.chainId),
            deploymentsPath: options.deploymentsPath,
            contractsPath: options.contractsPath
        };
        const repository = new FileDeploymentRepository_1.FileDeploymentRepository(config);
        const diamond = new Diamond_1.Diamond(config, repository);
        await setupDiamondConnection(diamond, options.verbose);
        // Get current state
        const currentResult = await (0, diamondAbiGenerator_1.generateDiamondAbi)(diamond, {
            verbose: false,
            includeSourceInfo: false
        });
        console.log(chalk_1.default.cyan('\n📋 Current ABI state:'));
        console.log(chalk_1.default.gray(`  Functions: ${currentResult.stats.totalFunctions}`));
        console.log(chalk_1.default.gray(`  Events: ${currentResult.stats.totalEvents}`));
        console.log(chalk_1.default.gray(`  Facets: ${currentResult.stats.facetCount}`));
        // Check for planned cuts
        const registry = diamond.functionSelectorRegistry;
        const plannedCuts = Array.from(registry.entries())
            .filter(([_, entry]) => entry.action !== 0) // Not deployed
            .map(([selector, entry]) => ({
            facetAddress: entry.address,
            action: entry.action,
            functionSelectors: [selector],
            name: entry.facetName
        }));
        if (plannedCuts.length === 0) {
            console.log(chalk_1.default.yellow('\n⚠️  No planned cuts found in function selector registry'));
            console.log(chalk_1.default.gray('   Use the diamond deployment system to plan upgrades first.'));
            return;
        }
        console.log(chalk_1.default.cyan(`\n🔄 Found ${plannedCuts.length} planned cuts:`));
        for (const cut of plannedCuts) {
            const actionName = cut.action === 1 ? 'Add' : cut.action === 2 ? 'Remove' : 'Replace';
            console.log(chalk_1.default.gray(`  ${actionName}: ${cut.name} (${cut.functionSelectors.length} selectors)`));
        }
        // Preview with planned cuts
        const previewResult = await (0, diamondAbiGenerator_1.previewDiamondAbi)(diamond, plannedCuts, {
            verbose: options.verbose,
            includeSourceInfo: false
        });
        console.log(chalk_1.default.green('\n✅ ABI preview completed!'));
        console.log(chalk_1.default.blue('\n📊 Preview Results:'));
        console.log(chalk_1.default.cyan(`  Functions after cuts: ${previewResult.stats.totalFunctions}`));
        console.log(chalk_1.default.cyan(`  Events after cuts: ${previewResult.stats.totalEvents}`));
        console.log(chalk_1.default.cyan(`  Facets after cuts: ${previewResult.stats.facetCount}`));
        // Show differences
        const functionDiff = previewResult.stats.totalFunctions - currentResult.stats.totalFunctions;
        const facetDiff = previewResult.stats.facetCount - currentResult.stats.facetCount;
        if (functionDiff !== 0) {
            const color = functionDiff > 0 ? chalk_1.default.green : chalk_1.default.red;
            console.log(color(`  Function change: ${functionDiff > 0 ? '+' : ''}${functionDiff}`));
        }
        if (facetDiff !== 0) {
            const color = facetDiff > 0 ? chalk_1.default.green : chalk_1.default.red;
            console.log(color(`  Facet change: ${facetDiff > 0 ? '+' : ''}${facetDiff}`));
        }
        if (options.verbose) {
            console.log(chalk_1.default.blue('\n🎯 Planned Function Changes:'));
            displaySelectorChanges(currentResult.selectorMap, previewResult.selectorMap);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error previewing Diamond ABI:'), error);
        process.exit(1);
    }
});
// Compare command
program
    .command('compare')
    .description('Compare two diamond ABI files')
    .argument('<file1>', 'First ABI file path')
    .argument('<file2>', 'Second ABI file path')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (file1, file2, options) => {
    try {
        console.log(chalk_1.default.blue('🔍 Comparing Diamond ABI files...'));
        if (!(0, fs_1.existsSync)(file1)) {
            throw new Error(`File not found: ${file1}`);
        }
        if (!(0, fs_1.existsSync)(file2)) {
            throw new Error(`File not found: ${file2}`);
        }
        const abi1 = JSON.parse(require('fs').readFileSync(file1, 'utf8'));
        const abi2 = JSON.parse(require('fs').readFileSync(file2, 'utf8'));
        console.log(chalk_1.default.cyan(`\n📋 Comparing:`));
        console.log(chalk_1.default.gray(`  File 1: ${file1}`));
        console.log(chalk_1.default.gray(`  File 2: ${file2}`));
        const result1 = analyzeAbi(abi1);
        const result2 = analyzeAbi(abi2);
        console.log(chalk_1.default.blue('\n📊 Comparison Results:'));
        // Function comparison
        const funcDiff = result2.functions - result1.functions;
        console.log(chalk_1.default.cyan(`Functions: ${result1.functions} → ${result2.functions} `), funcDiff === 0 ? chalk_1.default.gray('(no change)') :
            funcDiff > 0 ? chalk_1.default.green(`(+${funcDiff})`) : chalk_1.default.red(`(${funcDiff})`));
        // Event comparison
        const eventDiff = result2.events - result1.events;
        console.log(chalk_1.default.cyan(`Events: ${result1.events} → ${result2.events} `), eventDiff === 0 ? chalk_1.default.gray('(no change)') :
            eventDiff > 0 ? chalk_1.default.green(`(+${eventDiff})`) : chalk_1.default.red(`(${eventDiff})`));
        // Error comparison
        const errorDiff = result2.errors - result1.errors;
        console.log(chalk_1.default.cyan(`Errors: ${result1.errors} → ${result2.errors} `), errorDiff === 0 ? chalk_1.default.gray('(no change)') :
            errorDiff > 0 ? chalk_1.default.green(`(+${errorDiff})`) : chalk_1.default.red(`(${errorDiff})`));
        if (options.verbose && abi1._diamondMetadata && abi2._diamondMetadata) {
            console.log(chalk_1.default.blue('\n🔍 Detailed Selector Comparison:'));
            displaySelectorChanges(abi1._diamondMetadata.selectorMap || {}, abi2._diamondMetadata.selectorMap || {});
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error comparing ABI files:'), error);
        process.exit(1);
    }
});
// Validate command
program
    .command('validate')
    .description('Validate a diamond ABI file')
    .argument('<file>', 'ABI file path')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (file, options) => {
    try {
        console.log(chalk_1.default.blue('🔍 Validating Diamond ABI...'));
        if (!(0, fs_1.existsSync)(file)) {
            throw new Error(`File not found: ${file}`);
        }
        const artifact = JSON.parse(require('fs').readFileSync(file, 'utf8'));
        // Basic structure validation
        const hasRequiredFields = artifact.abi && artifact.contractName;
        if (!hasRequiredFields) {
            throw new Error('Invalid artifact: missing required fields (abi, contractName)');
        }
        // ABI validation with ethers
        const { Interface } = await Promise.resolve().then(() => __importStar(require('ethers')));
        let ethersInterface;
        try {
            ethersInterface = new Interface(artifact.abi);
        }
        catch (error) {
            throw new Error(`Invalid ABI: ${error}`);
        }
        const analysis = analyzeAbi(artifact);
        console.log(chalk_1.default.green('✅ ABI validation passed!'));
        console.log(chalk_1.default.blue('\n📊 ABI Analysis:'));
        console.log(chalk_1.default.cyan(`  Functions: ${analysis.functions}`));
        console.log(chalk_1.default.cyan(`  Events: ${analysis.events}`));
        console.log(chalk_1.default.cyan(`  Errors: ${analysis.errors}`));
        console.log(chalk_1.default.cyan(`  Total fragments: ${ethersInterface.fragments.length}`));
        if (artifact._diamondMetadata) {
            const metadata = artifact._diamondMetadata;
            console.log(chalk_1.default.blue('\n💎 Diamond Metadata:'));
            console.log(chalk_1.default.cyan(`  Diamond: ${metadata.diamondName}`));
            console.log(chalk_1.default.cyan(`  Network: ${metadata.networkName}`));
            console.log(chalk_1.default.cyan(`  Chain ID: ${metadata.chainId}`));
            console.log(chalk_1.default.cyan(`  Generated: ${metadata.generatedAt}`));
            if (metadata.selectorMap) {
                const selectorCount = Object.keys(metadata.selectorMap).length;
                const facetCount = new Set(Object.values(metadata.selectorMap)).size;
                console.log(chalk_1.default.cyan(`  Function selectors: ${selectorCount}`));
                console.log(chalk_1.default.cyan(`  Facets: ${facetCount}`));
            }
        }
        if (options.verbose) {
            console.log(chalk_1.default.blue('\n🔍 Function Signatures:'));
            ethersInterface.fragments
                .filter((f) => f.type === 'function')
                .slice(0, 10) // Show first 10
                .forEach((f) => {
                console.log(chalk_1.default.gray(`  ${f.format()}`));
            });
            if (ethersInterface.fragments.filter((f) => f.type === 'function').length > 10) {
                console.log(chalk_1.default.gray(`  ... and ${ethersInterface.fragments.filter((f) => f.type === 'function').length - 10} more`));
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ ABI validation failed:'), error);
        process.exit(1);
    }
});
// Helper functions
async function setupDiamondConnection(diamond, verbose) {
    try {
        diamond.setProvider(hardhat_1.default.ethers.provider);
        const signers = await hardhat_1.default.ethers.getSigners();
        if (signers.length > 0) {
            diamond.setSigner(signers[0]);
        }
        if (verbose) {
            console.log(chalk_1.default.gray('✅ Connected to Hardhat provider'));
        }
    }
    catch (error) {
        if (verbose) {
            console.log(chalk_1.default.yellow('⚠️  Could not connect to provider (running in standalone mode)'));
        }
    }
}
function displayResults(result, verbose) {
    console.log(chalk_1.default.blue('\n📊 Generation Results:'));
    console.log(chalk_1.default.cyan(`  Functions: ${result.stats.totalFunctions}`));
    console.log(chalk_1.default.cyan(`  Events: ${result.stats.totalEvents}`));
    console.log(chalk_1.default.cyan(`  Errors: ${result.stats.totalErrors}`));
    console.log(chalk_1.default.cyan(`  Facets: ${result.stats.facetCount}`));
    if (result.outputPath) {
        console.log(chalk_1.default.cyan(`  Output: ${result.outputPath}`));
    }
    if (result.stats.duplicateSelectorsSkipped > 0) {
        console.log(chalk_1.default.yellow(`  Duplicates skipped: ${result.stats.duplicateSelectorsSkipped}`));
    }
    if (verbose && result.selectorMap) {
        console.log(chalk_1.default.blue('\n🎯 Function Selector Mapping:'));
        const sortedSelectors = Object.entries(result.selectorMap).sort(([, a], [, b]) => a.localeCompare(b));
        sortedSelectors.slice(0, 20).forEach(([selector, facet]) => {
            console.log(chalk_1.default.gray(`  ${selector} → ${facet}`));
        });
        if (sortedSelectors.length > 20) {
            console.log(chalk_1.default.gray(`  ... and ${sortedSelectors.length - 20} more`));
        }
    }
}
function displaySelectorChanges(oldMap, newMap) {
    const oldSelectors = new Set(Object.keys(oldMap));
    const newSelectors = new Set(Object.keys(newMap));
    const added = Array.from(newSelectors).filter(s => !oldSelectors.has(s));
    const removed = Array.from(oldSelectors).filter(s => !newSelectors.has(s));
    const changed = Array.from(oldSelectors).filter(s => newSelectors.has(s) && oldMap[s] !== newMap[s]);
    if (added.length > 0) {
        console.log(chalk_1.default.green(`\n  ➕ Added (${added.length}):`));
        added.slice(0, 10).forEach(selector => {
            console.log(chalk_1.default.gray(`    ${selector} → ${newMap[selector]}`));
        });
        if (added.length > 10) {
            console.log(chalk_1.default.gray(`    ... and ${added.length - 10} more`));
        }
    }
    if (removed.length > 0) {
        console.log(chalk_1.default.red(`\n  ➖ Removed (${removed.length}):`));
        removed.slice(0, 10).forEach(selector => {
            console.log(chalk_1.default.gray(`    ${selector} → ${oldMap[selector]}`));
        });
        if (removed.length > 10) {
            console.log(chalk_1.default.gray(`    ... and ${removed.length - 10} more`));
        }
    }
    if (changed.length > 0) {
        console.log(chalk_1.default.yellow(`\n  🔄 Changed (${changed.length}):`));
        changed.slice(0, 10).forEach(selector => {
            console.log(chalk_1.default.gray(`    ${selector}: ${oldMap[selector]} → ${newMap[selector]}`));
        });
        if (changed.length > 10) {
            console.log(chalk_1.default.gray(`    ... and ${changed.length - 10} more`));
        }
    }
    if (added.length === 0 && removed.length === 0 && changed.length === 0) {
        console.log(chalk_1.default.gray('  No selector changes detected'));
    }
}
function analyzeAbi(artifact) {
    const abi = artifact.abi || [];
    return {
        functions: abi.filter((item) => item.type === 'function').length,
        events: abi.filter((item) => item.type === 'event').length,
        errors: abi.filter((item) => item.type === 'error').length
    };
}
// Parse command line arguments
program.parse();
//# sourceMappingURL=diamond-abi-cli.js.map