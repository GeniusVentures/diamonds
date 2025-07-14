import { Artifact } from 'hardhat/types';
import { Diamond } from '../core/Diamond';
/**
 * Maps logical facet names to actual contract names available in artifacts.
 * This handles both production contracts and mock contracts for testing.
 */
export declare function getContractName(logicalName: string, diamond?: Diamond): Promise<string>;
/**
 * Maps logical diamond name to actual contract name available in artifacts.
 */
export declare function getDiamondContractName(diamondName: string, diamond?: Diamond): Promise<string>;
/**
 * Gets the contract artifact for a logical name, trying both production and mock versions
 */
export declare function getContractArtifact(logicalName: string, diamond?: Diamond): Promise<Artifact>;
/**
 * Standard mapping for common facet types
 */
export declare const FACET_TYPE_MAPPING: {
    readonly DiamondCutFacet: "DiamondCutFacet";
    readonly DiamondLoupeFacet: "DiamondLoupeFacet";
    readonly TestFacet: "TestFacet";
    readonly OwnershipFacet: "OwnershipFacet";
};
/**
 * Get all available contract names from artifacts
 */
export declare function getAvailableContracts(): Promise<string[]>;
//# sourceMappingURL=contractMapping.d.ts.map