import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DeployedDiamondData } from "../schemas";
import Diamond from "../core/Diamond";
export interface IDeployConfig {
    diamondName: string;
    deploymentsPath: string;
    contractsPath: string;
    provider: JsonRpcProvider;
    networkName: string;
    chainId: number;
    deployer?: Signer;
}
export interface CallbackArgs {
    diamond: Diamond;
}
/**
 * Interface for post deployment initialization callbacks.
 */
export type FacetCallback = (networkDeployInfo: DeployedDiamondData) => Promise<void | boolean>;
/**
 * Type for capturing the needed data to perform a diamond upgrade.
 */
export interface FacetDeploymentInfo {
    facetAddress: string;
    action: FacetCutAction;
    functionSelectors: string[];
    name: string;
    initFunc?: string;
    version?: number;
}
export type NewDeployedFacet = {
    priority: number;
    address: string;
    tx_hash: string;
    version: number;
    initFunction: string;
    funcSelectors: string[];
    deployInclude: string[];
    deployExclude: string[];
    verified: boolean;
};
export type NewDeployedFacets = Record<string, NewDeployedFacet>;
/**
 * Type for the diamond cut “action”.
 */
export declare enum FacetCutAction {
    Add = 0,
    Replace = 1,
    Remove = 2
}
export declare enum RegistryFacetCutAction {
    Add = 0,
    Replace = 1,
    Remove = 2,
    Deployed = 3
}
export type FunctionSelectorRegistryEntry = {
    facetName: string;
    priority: number;
    address: string;
    action: RegistryFacetCutAction;
};
export type FacetCut = {
    facetAddress: string;
    action: RegistryFacetCutAction;
    functionSelectors: string[];
    name: string;
};
export type FacetCuts = FacetCut[];
//# sourceMappingURL=deployments.d.ts.map