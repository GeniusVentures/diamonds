import { DeployedDiamondData } from "../schemas";
import { providers } from "ethers";
import { Signer } from "@ethersproject/abstract-signer";
export declare function diffDeployedFacets(diamondAddress: string, signerOrProvider: Signer | providers.Provider, deployedFacetData: DeployedDiamondData, verboseGetDeployedFacets?: boolean): Promise<boolean>;
export declare function printFacetSelectorFunctions(abi: any, selectors: string[]): void;
export declare function isProtocolInitRegistered(deployedDiamondData: DeployedDiamondData, protocolInitFacet: string, initializerSig: string): Promise<boolean>;
/**
 * Compares facet selectors from on-chain DiamondLoupe with local DeployedDiamondData
 *
 * @param deployedFacetData - local metadata (facetName -> { address, funcSelectors[] })
 * @param onChainFacets - list of { facetAddress, functionSelectors[] } from DiamondLoupe
 * @returns map of facetName -> { extraOnChain[], missingOnChain[], matched[] }
 */
export declare function compareFacetSelectors(deployedFacetData: Record<string, {
    address?: string;
    funcSelectors?: string[];
}>, onChainFacets: {
    facetAddress: string;
    functionSelectors: string[];
}[]): Record<string, {
    extraOnChain: string[];
    missingOnChain: string[];
    matched: string[];
}>;
//# sourceMappingURL=diffDeployedFacets.d.ts.map