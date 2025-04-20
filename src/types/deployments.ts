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
export enum FacetCutAction {
  Add,
  Replace,
  Remove
}

export interface CallbackArgs {
  diamond: Diamond;
  // initConfig: IDeployConfig;
  // deployInfo: DeployedDiamondData;
}

/**
 * Interface for post deployment initialization callbacks.
 */
export type FacetCallback = (
  networkDeployInfo: DeployedDiamondData,
) => Promise<void | boolean>;


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
