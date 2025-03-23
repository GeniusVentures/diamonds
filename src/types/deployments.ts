import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

export interface IDeployments {
    [networkName: string]: INetworkDeployInfo;
  }
  
/**
 * Interface for the deployments on various blockchain networks info.
 */
export interface INetworkDeployInfo {
DiamondAddress?: string;
DeployerAddress: string;
FacetDeployedInfo: {
    [facetName: string]: {
    address: string;
    tx_hash: string;
    version?: number;
    funcSelectors?: string[];
    };
};
ExternalLibraries?: { [key: string]: string };
protocolVersion?: number;
}

export interface DeploymentInfo {
diamondName: string;
deploymentsPath: string;
facetsPath: string;
contractsPath: string;
provider: JsonRpcProvider;
networkName: string;
chainId: number;
deployer?: Signer;
}

  /**
 * Interface describing the structure of facets to deploy and their metadata.
 */
export interface IFacetsToDeploy {
  [facetName: string]: {
    priority: number;
    libraries?: string[];
    versions?: {
      [versionNumber: number]: {
        deployInit?: string;
        upgradeInit?: string;
        fromVersions?: number[];
        callback?: (info: INetworkDeployInfo) => Promise<boolean>;
        deployInclude?: string[];
      };
    };
  };
}
  
/**
 * Original Interface for the deployment information of a facet.
 */
// export interface FacetInfo {
//   facetAddress: string;
//   action: FacetCutAction;
//   functionSelectors: string[];
//   name: string;
//   initFunc?: string | null;
// }

// map Facet Selectors to contract address string
export interface IDeployedFacetSelectors {
  facets: Record<string, string>;
}

// map contract name to array of FacetSignature strings
export interface IDeployedContractFacetSelectors {
  contractFacets: Record<string, string[]>;
}

export type FacetSelectorsDeployed = IDeployedFacetSelectors &
  IDeployedContractFacetSelectors;
  
export interface FacetVersion {
deployInit?: string;
upgradeInit?: string;
fromVersions?: number[];
}

export interface FacetInfo {
priority: number;
versions?: Record<string, FacetVersion>;  // Versions can have dynamic keys
}

export type FacetsDeployment = Record<string, FacetInfo>;  // Object with facet names as keys

/**
 * Type for the diamond cut “action”.
 */
export enum FacetCutAction {
  Add,
  Replace,
  Remove
}

/**
 * Type for capturing the needed data to perform a diamond upgrade.
 */
export interface FacetDeploymentInfo {
  facetAddress: string;
  action: FacetCutAction;
  functionSelectors: string[];
  name: string;
  initFunc?: string | null;
}

export interface IAfterDeployInit {
  (networkDeployInfo: INetworkDeployInfo): Promise<boolean>;
}

/**
 * Interface for globally tracking function selectors that have already been deployed.
 */
export interface IDeployedFuncSelectors {
  facets: { [selector: string]: string };
  contractFacets: { [facetName: string]: string[] };
}

/**
 * Interface for the deployments on various blockchain networks info.
 */
export interface INetworkDeployInfo {
    DiamondAddress?: string;
    DeployerAddress: string;
    FacetDeployedInfo: {
        [facetName: string]: {
        address: string;
        tx_hash: string;
        version?: number;
        funcSelectors?: string[];
        };
    };
    ExternalLibraries?: { [key: string]: string };
    protocolVersion?: number;
    }