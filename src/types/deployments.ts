import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

export interface IDeployments {
    [networkName: string]: INetworkDeployInfo;
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

import { z } from "zod";

export const FacetVersionSchema = z.object({
  deployInit: z.string().optional(),
  upgradeInit: z.string().optional(),
  callback: z.string().optional(),
  fromVersions: z.array(z.number()).optional(),
});

export const FacetInfoSchema = z.object({
  priority: z.number(),
  versions: z.record(FacetVersionSchema).optional(), // Dynamic keys for versions
});

export const FacetsDeploymentSchema = z.record(FacetInfoSchema); // Dynamic keys for facets

export type FacetVersion = z.infer<typeof FacetVersionSchema>;
export type FacetInfo = z.infer<typeof FacetInfoSchema>;
export type FacetsDeployment = z.infer<typeof FacetsDeploymentSchema>;

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
 * Interface for post deployment initialization callbacks.
 */
export type AfterDeployInit = (
  networkDeployInfo: INetworkDeployInfo,
) => Promise<void | boolean>;

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