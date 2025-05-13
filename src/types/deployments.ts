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

// TODO create or implement function selector type, address type tx_hash type with restrictions

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

export type NewDeployedFacets =
  Record<string, NewDeployedFacet>;

/**
 * Type for the diamond cut “action”.
 */
export enum FacetCutAction {
  Add,
  Replace,
  Remove
}

export enum RegistryFacetCutAction {
  Add = FacetCutAction.Add,
  Replace = FacetCutAction.Replace,
  Remove = FacetCutAction.Remove,
  Deployed
}

export type FunctionSelectorRegistryEntry = {
  facetName: string;
  priority: number;
  address: string;
  action: RegistryFacetCutAction;
};

/**
 * Type for capturing the needed data to perform a diamond cut.
 * 
 * key:
 * @param functionSelectors - The function selectors to be added, replaced, or removed.
 * 
 * values:
 * @param facetName - The name of the facet.
 * @param address - The address of the facet to be added, replaced, or removed.
 * @param action - The action to be performed (add, replace, or remove).
 */
type SelectorRegistry = Map<string, { facetName: string; address: string; priority: number; action: FacetCutAction }>;

export type FacetCut = {
  facetAddress: string;
  action: RegistryFacetCutAction;
  functionSelectors: string[];
  name: string;
};

export type FacetCuts = FacetCut[];
