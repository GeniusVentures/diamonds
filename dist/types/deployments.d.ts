import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DeployedDiamondData } from "../schemas";
import Diamond from "../internal/Diamond";
export interface IDeployConfig {
    diamondName: string;
    deploymentsPath: string;
    contractsPath: string;
    provider: JsonRpcProvider;
    networkName: string;
    chainId: number;
    deployer?: Signer;
}
/**
 * Type for the diamond cut “action”.
 */
export declare enum FacetCutAction {
    Add = 0,
    Replace = 1,
    Remove = 2
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
//# sourceMappingURL=deployments.d.ts.map