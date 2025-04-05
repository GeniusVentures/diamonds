import { z } from "zod";
export declare const FacetDeployedInfoSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    tx_hash: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    address?: string | undefined;
    tx_hash?: string | undefined;
    version?: number | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}, {
    address?: string | undefined;
    tx_hash?: string | undefined;
    version?: number | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}>;
export declare const FacetDeployedInfoRecordSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    tx_hash: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    address?: string | undefined;
    tx_hash?: string | undefined;
    version?: number | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}, {
    address?: string | undefined;
    tx_hash?: string | undefined;
    version?: number | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}>>;
export declare const ExternalLibrariesSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const NetworkDeployInfoSchema: z.ZodObject<{
    DiamondAddress: z.ZodOptional<z.ZodString>;
    DeployerAddress: z.ZodString;
    FacetDeployedInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        tx_hash: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodNumber>;
        funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        address?: string | undefined;
        tx_hash?: string | undefined;
        version?: number | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }, {
        address?: string | undefined;
        tx_hash?: string | undefined;
        version?: number | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }>>>;
    ExternalLibraries: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    protocolVersion: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    DeployerAddress: string;
    DiamondAddress?: string | undefined;
    FacetDeployedInfo?: Record<string, {
        address?: string | undefined;
        tx_hash?: string | undefined;
        version?: number | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }> | undefined;
    ExternalLibraries?: Record<string, string> | undefined;
    protocolVersion?: number | undefined;
}, {
    DeployerAddress: string;
    DiamondAddress?: string | undefined;
    FacetDeployedInfo?: Record<string, {
        address?: string | undefined;
        tx_hash?: string | undefined;
        version?: number | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }> | undefined;
    ExternalLibraries?: Record<string, string> | undefined;
    protocolVersion?: number | undefined;
}>;
/**
 * Schema for the version information of a facet configuration to be deployed
 */
export declare const FacetVersionConfigSchema: z.ZodObject<{
    deployInit: z.ZodOptional<z.ZodString>;
    upgradeInit: z.ZodOptional<z.ZodString>;
    fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    callback: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodPromise<z.ZodBoolean>>>;
    deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
    deployInclude?: string[] | undefined;
}, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
    deployInclude?: string[] | undefined;
}>;
/**
 * Schema for the deployment information of a single facet
*/
export declare const FacetConfigSchema: z.ZodObject<{
    priority: z.ZodNumber;
    libraries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    versions: z.ZodOptional<z.ZodRecord<z.ZodNumber, z.ZodObject<{
        deployInit: z.ZodOptional<z.ZodString>;
        upgradeInit: z.ZodOptional<z.ZodString>;
        fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        callback: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodPromise<z.ZodBoolean>>>;
        deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}>;
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
/**
 * Schema for the deployment configuration information of ALL facets to be deployed
 */
export declare const FacetsConfigSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    priority: z.ZodNumber;
    libraries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    versions: z.ZodOptional<z.ZodRecord<z.ZodNumber, z.ZodObject<{
        deployInit: z.ZodOptional<z.ZodString>;
        upgradeInit: z.ZodOptional<z.ZodString>;
        fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        callback: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodPromise<z.ZodBoolean>>>;
        deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callback?: ((args_0: any, ...args_1: unknown[]) => Promise<boolean>) | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}>>;
export type FacetVersionConfig = z.infer<typeof FacetVersionConfigSchema>;
export type FacetConfig = z.infer<typeof FacetConfigSchema>;
export type FacetsConfig = z.infer<typeof FacetsConfigSchema>;
export type FacetDeployedInfo = z.infer<typeof FacetDeployedInfoSchema>;
export type INetworkDeployInfo = z.infer<typeof NetworkDeployInfoSchema>;
export type FacetsDeployment = z.infer<typeof FacetsConfigSchema>;
export type FacetDeployedInfoRecord = z.infer<typeof FacetDeployedInfoRecordSchema>;
//# sourceMappingURL=DeploymentSchema.d.ts.map