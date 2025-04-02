import { Signer } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { INetworkDeployInfo } from "../schemas";
export interface IDeployments {
    [networkName: string]: INetworkDeployInfo;
}
/**
 * Interface for globally tracking function selectors that have already been deployed.
 */
export interface IDeployedFuncSelectors {
    facets: {
        [selector: string]: string;
    };
    contractFacets: {
        [facetName: string]: string[];
    };
}
export interface IDeployConfig {
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
export interface IFacetsDeployConfig {
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
export interface IDeployedFacetSelectors {
    facets: Record<string, string>;
}
export interface IDeployedContractFacetSelectors {
    contractFacets: Record<string, string[]>;
}
import { z } from "zod";
export declare const FacetVersionSchema: z.ZodObject<{
    deployInit: z.ZodOptional<z.ZodString>;
    upgradeInit: z.ZodOptional<z.ZodString>;
    callback: z.ZodOptional<z.ZodString>;
    fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callback?: string | undefined;
}, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callback?: string | undefined;
}>;
export declare const FacetInfoSchema: z.ZodObject<{
    priority: z.ZodNumber;
    versions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        deployInit: z.ZodOptional<z.ZodString>;
        upgradeInit: z.ZodOptional<z.ZodString>;
        callback: z.ZodOptional<z.ZodString>;
        fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    versions?: Record<string, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }> | undefined;
}, {
    priority: number;
    versions?: Record<string, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }> | undefined;
}>;
export declare const FacetsDeploymentSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    priority: z.ZodNumber;
    versions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        deployInit: z.ZodOptional<z.ZodString>;
        upgradeInit: z.ZodOptional<z.ZodString>;
        callback: z.ZodOptional<z.ZodString>;
        fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    versions?: Record<string, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }> | undefined;
}, {
    priority: number;
    versions?: Record<string, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: string | undefined;
    }> | undefined;
}>>;
export type FacetVersion = z.infer<typeof FacetVersionSchema>;
export type FacetInfo = z.infer<typeof FacetInfoSchema>;
export type FacetsDeployment = z.infer<typeof FacetsDeploymentSchema>;
/**
 * Type for the diamond cut “action”.
 */
export declare enum FacetCutAction {
    Add = 0,
    Replace = 1,
    Remove = 2
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
 * Interface for post deployment initialization callbacks.
 */
export type AfterDeployInit = (networkDeployInfo: INetworkDeployInfo) => Promise<void | boolean>;
/**
 * Interface for globally tracking function selectors that have already been deployed.
 */
export interface IDeployedFuncSelectors {
    facets: {
        [selector: string]: string;
    };
    contractFacets: {
        [facetName: string]: string[];
    };
}
export interface CallbackArgs {
    initConfig: IDeployConfig;
    deployInfo: INetworkDeployInfo;
}
//# sourceMappingURL=deployments.d.ts.map