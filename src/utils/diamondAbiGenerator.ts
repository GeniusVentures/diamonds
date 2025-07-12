import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { Interface } from 'ethers';
import { Diamond } from '../core/Diamond';
import { DeployedDiamondData } from '../schemas';
import { FacetCuts, RegistryFacetCutAction } from '../types';
import { getContractArtifact, getContractName } from '../utils/contractMapping';
import chalk from 'chalk';

/**
 * Interface for ABI generation options
 */
export interface DiamondAbiGenerationOptions {
  /** Diamond instance to generate ABI for */
  diamond: Diamond;
  /** Output directory for generated ABI files */
  outputDir?: string;
  /** Whether to include source information in ABI */
  includeSourceInfo?: boolean;
  /** Whether to validate function selector uniqueness */
  validateSelectors?: boolean;
  /** Whether to log verbose output */
  verbose?: boolean;
  /** Custom facet cuts to include (for preview/planning) */
  customFacetCuts?: FacetCuts;
}

/**
 * Result of ABI generation
 */
export interface DiamondAbiGenerationResult {
  /** Generated combined ABI */
  abi: any[];
  /** Function selector to facet mapping */
  selectorMap: Record<string, string>;
  /** Facet addresses included in the ABI */
  facetAddresses: string[];
  /** Output file path */
  outputPath?: string;
  /** Statistics about the generation */
  stats: {
    totalFunctions: number;
    totalEvents: number;
    totalErrors: number;
    facetCount: number;
    duplicateSelectorsSkipped: number;
  };
}

/**
 * Comprehensive Diamond ABI Generator
 * 
 * This class generates a complete ABI for a diamond contract based on:
 * - Current deployment state (deployed facets)
 * - Planned diamond cuts (upgrades, additions, removals)
 * - Function selector registry
 * - Deployment configuration
 */
export class DiamondAbiGenerator {
  private diamond: Diamond;
  private options: DiamondAbiGenerationOptions;
  private seenSelectors: Set<string> = new Set();
  private selectorToFacet: Record<string, string> = {};
  private combinedAbi: any[] = [];
  private stats = {
    totalFunctions: 0,
    totalEvents: 0,
    totalErrors: 0,
    facetCount: 0,
    duplicateSelectorsSkipped: 0
  };

  constructor(options: DiamondAbiGenerationOptions) {
    this.diamond = options.diamond;
    this.options = {
      outputDir: 'artifacts/diamond-abi',
      includeSourceInfo: true,
      validateSelectors: true,
      verbose: false,
      ...options
    };
  }

  /**
   * Generate the complete diamond ABI
   */
  async generateAbi(): Promise<DiamondAbiGenerationResult> {
    if (this.options.verbose) {
      console.log(chalk.blue('🔧 Generating Diamond ABI...'));
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
  private async getFacetsToInclude(): Promise<Record<string, FacetInfo>> {
    const facetsToInclude: Record<string, FacetInfo> = {};
    
    // 1. Get currently deployed facets
    const deployedData = this.diamond.getDeployedDiamondData();
    if (deployedData.DeployedFacets) {
      for (const [facetName, facetData] of Object.entries(deployedData.DeployedFacets)) {
        if (facetData.address && facetData.funcSelectors) {
          facetsToInclude[facetName] = {
            address: facetData.address,
            selectors: facetData.funcSelectors,
            action: RegistryFacetCutAction.Deployed,
            source: 'deployed'
          };
        }
      }
    }

    // 2. Get planned cuts from function selector registry
    const registry = this.diamond.functionSelectorRegistry;
    for (const [selector, entry] of registry.entries()) {
      if (entry.action === RegistryFacetCutAction.Add || entry.action === RegistryFacetCutAction.Replace) {
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
      } else if (entry.action === RegistryFacetCutAction.Remove) {
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
              action: RegistryFacetCutAction.Add,
              source: 'custom'
            };
          }
          facetsToInclude[facetName].selectors.push(...cut.functionSelectors);
        } else if (cut.action === 2) { // Remove
          if (facetsToInclude[facetName]) {
            facetsToInclude[facetName].selectors = facetsToInclude[facetName].selectors.filter(
              s => !cut.functionSelectors.includes(s)
            );
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
  private async processFacet(facetName: string, facetInfo: FacetInfo): Promise<void> {
    try {
      if (this.options.verbose) {
        console.log(chalk.cyan(`📄 Processing ${facetName}...`));
      }

      // Get the contract artifact
      let artifact;
      try {
        artifact = await getContractArtifact(facetName);
      } catch (artifactError) {
        if (this.options.verbose) {
          console.log(chalk.yellow(`⚠️  Artifact loading failed for ${facetName}: ${artifactError}`));
        }
        artifact = null;
      }
      
      if (!artifact || !artifact.abi) {
        if (this.options.verbose) {
          console.log(chalk.yellow(`⚠️  No ABI found for ${facetName}`));
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
      const iface = new Interface(artifact.abi);
      
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
    } catch (error) {
      console.error(chalk.red(`❌ Error processing ${facetName}:`), error);
      
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
  private async processAbiItem(
    abiItem: any,
    facetName: string,
    facetInfo: FacetInfo,
    iface: Interface
  ): Promise<void> {
    // Skip constructors for diamond
    if (abiItem.type === 'constructor') {
      return;
    }

    // Handle functions
    if (abiItem.type === 'function') {
      const selector = iface.getFunction(abiItem.name!)?.selector;
      
      if (!selector) {
        if (this.options.verbose) {
          console.log(chalk.yellow(`⚠️  Could not calculate selector for ${abiItem.name}`));
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
          console.log(chalk.yellow(`⚠️  Skipping duplicate function: ${abiItem.name} (${selector})`));
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
  private async ensureDiamondLoupeFunctions(): Promise<void> {
    const loupeSelectors = ['0xcdffacc6', '0x52ef6b2c', '0xadfca15e', '0x7a0ed627']; // facets(), facetFunctionSelectors(), facetAddresses(), facetAddress()
    
    // Check if any loupe selectors are already included
    for (const selector of loupeSelectors) {
      if (!this.seenSelectors.has(selector)) {
        try {
          await this.processFacet('DiamondLoupeFacet', {
            address: '0x0000000000000000000000000000000000000000',
            selectors: [selector],
            action: RegistryFacetCutAction.Deployed,
            source: 'loupe'
          });
        } catch (error) {
          // DiamondLoupeFacet might not be available, continue
        }
      }
    }
  }

  /**
   * Sort the ABI for consistency
   */
  private sortAbi(): void {
    this.combinedAbi.sort((a, b) => {
      // Sort by type first (functions, events, errors)
      if (a.type !== b.type) {
        const typeOrder = { 'function': 0, 'event': 1, 'error': 2 };
        return (typeOrder[a.type as keyof typeof typeOrder] || 99) - (typeOrder[b.type as keyof typeof typeOrder] || 99);
      }
      
      // Then by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  /**
   * Generate the output files and result
   */
  private async generateOutput(): Promise<DiamondAbiGenerationResult> {
    const result: DiamondAbiGenerationResult = {
      abi: this.combinedAbi,
      selectorMap: this.selectorToFacet,
      facetAddresses: [...new Set(Object.values(this.selectorToFacet))],
      stats: { ...this.stats }
    };

    // Create output directory if specified
    if (this.options.outputDir) {
      mkdirSync(this.options.outputDir, { recursive: true });
      
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
      const outputPath = join(this.options.outputDir, `${this.diamond.diamondName}.json`);
      writeFileSync(outputPath, JSON.stringify(diamondArtifact, null, 2));
      
      // Write a TypeScript interface file
      const interfacePath = join(this.options.outputDir, `${this.diamond.diamondName}.d.ts`);
      this.generateTypeScriptInterface(interfacePath);
      
      result.outputPath = outputPath;
      
      if (this.options.verbose) {
        console.log(chalk.green(`✅ Diamond ABI artifact created at: ${outputPath}`));
      }
    }

    return result;
  }

  /**
   * Generate TypeScript interface for the diamond
   */
  private generateTypeScriptInterface(outputPath: string): void {
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
  readonly abi: any[];
}

export const ${this.diamond.diamondName}ABI: ${this.diamond.diamondName}Interface;
`;

    writeFileSync(outputPath, interfaceContent);
  }

  /**
   * Log generation statistics
   */
  private logStats(): void {
    console.log(chalk.blue('\n📊 Diamond ABI Generation Statistics:'));
    console.log(chalk.cyan(`  Functions: ${this.stats.totalFunctions}`));
    console.log(chalk.cyan(`  Events: ${this.stats.totalEvents}`));
    console.log(chalk.cyan(`  Errors: ${this.stats.totalErrors}`));
    console.log(chalk.cyan(`  Facets: ${this.stats.facetCount}`));
    console.log(chalk.cyan(`  Unique selectors: ${this.seenSelectors.size}`));
    if (this.stats.duplicateSelectorsSkipped > 0) {
      console.log(chalk.yellow(`  Duplicate selectors skipped: ${this.stats.duplicateSelectorsSkipped}`));
    }
  }

  /**
   * Static method to generate ABI for a diamond
   */
  static async generate(options: DiamondAbiGenerationOptions): Promise<DiamondAbiGenerationResult> {
    const generator = new DiamondAbiGenerator(options);
    return generator.generateAbi();
  }
}

/**
 * Interface for facet information used in ABI generation
 */
interface FacetInfo {
  address: string;
  selectors: string[];
  action: RegistryFacetCutAction;
  source: 'deployed' | 'registry' | 'custom' | 'loupe';
}

/**
 * Generate ABI for a diamond (convenience function)
 */
export async function generateDiamondAbi(
  diamond: Diamond,
  options: Partial<DiamondAbiGenerationOptions> = {}
): Promise<DiamondAbiGenerationResult> {
  return DiamondAbiGenerator.generate({ diamond, ...options });
}

/**
 * Preview what the ABI would look like after planned cuts
 */
export async function previewDiamondAbi(
  diamond: Diamond,
  plannedCuts: FacetCuts,
  options: Partial<DiamondAbiGenerationOptions> = {}
): Promise<DiamondAbiGenerationResult> {
  return DiamondAbiGenerator.generate({ 
    diamond, 
    customFacetCuts: plannedCuts,
    ...options 
  });
}
