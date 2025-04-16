import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { INetworkDeployInfo } from "../schemas";
import Diamond from "../internal/Diamond";

// export interface IDeployments {
//   [networkName: string]: INetworkDeployInfo;
// }

// /**
//  * Interface for globally tracking function selectors that have already been deployed.
//  */
// export interface IDeployedFuncSelectors {
//   facets: { [selector: string]: string };
//   contractFacets: { [facetName: string]: string[] };
// }

export interface IDeployConfig {
  diamondName: string;
  deploymentsPath: string;
  contractsPath: string;
  provider: JsonRpcProvider;
  networkName: string;
  chainId: number;
  deployer?: Signer;
}

// /**
// * Interface describing the structure of facets to deploy and their metadata.
// */
// export interface IFacetsDeployConfig {
//   [facetName: string]: {
//     priority: number;
//     libraries?: string[];
//     versions?: {
//       [versionNumber: number]: {
//         deployInit?: string;
//         upgradeInit?: string;
//         fromVersions?: number[];
//         callback?: (info: INetworkDeployInfo) => Promise<boolean>;
//         deployInclude?: string[];
//       };
//     };
//   };
// }

// // map Facet Selectors to contract address string
// export interface IDeployedFacetSelectors {
//   facets: Record<string, string>;
// }

// // map contract name to array of FacetSignature strings
// export interface IDeployedContractFacetSelectors {
//   contractFacets: Record<string, string[]>;
// }

// // map Facet Selectors to contract address string
// export interface IDeployedFacetSelectors {
//   facets: Record<string, string>;
// }

// // map contract name to array of FacetSignature strings
// export interface IDeployedContractFacetSelectors {
//   contractFacets: Record<string, string[]>;
// }

// export type FacetSelectorsDeployed = IDeployedFacetSelectors &
//   IDeployedContractFacetSelectors;

// export type AfterDeployInit = (
//   networkDeployInfo: INetworkDeployInfo,
// ) => Promise<void | boolean>;

// export interface IVersionInfo {
//   fromVersions?: number[];
//   deployInit?: string;          // init for when not upgrading and first deployment
//   upgradeInit?: string;   // upgradeInit if version is upgrading from previous version
//   deployInclude?: string[];
//   callback?: AfterDeployInit;
// }

// export type VersionRecord = Record<number, IVersionInfo>;

// export interface IFacetToDeployInfo {
//   priority: number;
//   versions?: VersionRecord;
//   libraries?: string[];
// }

// export type FacetToDeployInfo = Record<string, IFacetToDeployInfo>;


// export interface IFacetCallback {
//   (networkDeployInfo: INetworkDeployInfo): Promise<boolean>;
// }

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
  // deployInfo: INetworkDeployInfo;
}

/**
 * Interface for post deployment initialization callbacks.
 */
export type FacetCallback = (
  networkDeployInfo: INetworkDeployInfo,
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
