import { Diamond } from '../core/Diamond';
import { FacetCuts } from '../types';
type AbiItem = {
    type: string;
    name?: string;
    [key: string]: unknown;
};
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
    abi: AbiItem[];
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
export declare class DiamondAbiGenerator {
    private diamond;
    private options;
    private seenSelectors;
    private selectorToFacet;
    private combinedAbi;
    private stats;
    constructor(options: DiamondAbiGenerationOptions);
    /**
     * Generate the complete diamond ABI
     */
    generateAbi(): Promise<DiamondAbiGenerationResult>;
    /**
     * Get all facets that should be included in the ABI
     */
    private getFacetsToInclude;
    /**
     * Process a single facet and add its ABI items
     */
    private processFacet;
    /**
     * Process a single ABI item
     */
    private processAbiItem;
    /**
     * Ensure DiamondLoupe functions are included
     */
    private ensureDiamondLoupeFunctions;
    /**
     * Sort the ABI for consistency
     */
    private sortAbi;
    /**
     * Generate the output files and result
     */
    private generateOutput;
    /**
     * Generate TypeScript interface for the diamond
     */
    private generateTypeScriptInterface;
    /**
     * Log generation statistics
     */
    private logStats;
    /**
     * Static method to generate ABI for a diamond
     */
    static generate(options: DiamondAbiGenerationOptions): Promise<DiamondAbiGenerationResult>;
}
/**
 * Generate ABI for a diamond (convenience function)
 */
export declare function generateDiamondAbi(diamond: Diamond, options?: Partial<DiamondAbiGenerationOptions>): Promise<DiamondAbiGenerationResult>;
/**
 * Preview what the ABI would look like after planned cuts
 */
export declare function previewDiamondAbi(diamond: Diamond, plannedCuts: FacetCuts, options?: Partial<DiamondAbiGenerationOptions>): Promise<DiamondAbiGenerationResult>;
export {};
//# sourceMappingURL=diamondAbiGenerator.d.ts.map