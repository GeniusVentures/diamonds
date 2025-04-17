import { z } from "zod";
export declare const FacetDeployedInfoSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    tx_hash: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    version?: number | undefined;
    address?: string | undefined;
    tx_hash?: string | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}, {
    version?: number | undefined;
    address?: string | undefined;
    tx_hash?: string | undefined;
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
    version?: number | undefined;
    address?: string | undefined;
    tx_hash?: string | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}, {
    version?: number | undefined;
    address?: string | undefined;
    tx_hash?: string | undefined;
    funcSelectors?: string[] | undefined;
    verified?: boolean | undefined;
}>>;
export declare const ExternalLibrariesSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const DeployedDiamondDataSchema: z.ZodObject<{
    DiamondAddress: z.ZodOptional<z.ZodString>;
    DeployerAddress: z.ZodString;
    FacetDeployedInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        tx_hash: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodNumber>;
        funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        version?: number | undefined;
        address?: string | undefined;
        tx_hash?: string | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }, {
        version?: number | undefined;
        address?: string | undefined;
        tx_hash?: string | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }>>>;
    ExternalLibraries: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    protocolVersion: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    DeployerAddress: string;
    DiamondAddress?: string | undefined;
    FacetDeployedInfo?: Record<string, {
        version?: number | undefined;
        address?: string | undefined;
        tx_hash?: string | undefined;
        funcSelectors?: string[] | undefined;
        verified?: boolean | undefined;
    }> | undefined;
    ExternalLibraries?: Record<string, string> | undefined;
    protocolVersion?: number | undefined;
}, {
    DeployerAddress: string;
    DiamondAddress?: string | undefined;
    FacetDeployedInfo?: Record<string, {
        version?: number | undefined;
        address?: string | undefined;
        tx_hash?: string | undefined;
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
    callbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callbacks?: string[] | undefined;
    deployInclude?: string[] | undefined;
}, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callbacks?: string[] | undefined;
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
        callbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}>;
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
        callbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}, {
    priority: number;
    libraries?: string[] | undefined;
    versions?: Record<number, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
    }> | undefined;
}>>;
export declare const DeployConfigSchema: z.ZodObject<{
    protocolVersion: z.ZodNumber;
    protocolInitFacet: z.ZodOptional<z.ZodString>;
    protocolCallback: z.ZodOptional<z.ZodString>;
    facets: z.ZodRecord<z.ZodString, z.ZodObject<{
        priority: z.ZodNumber;
        libraries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        versions: z.ZodOptional<z.ZodRecord<z.ZodNumber, z.ZodObject<{
            deployInit: z.ZodOptional<z.ZodString>;
            upgradeInit: z.ZodOptional<z.ZodString>;
            fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            callbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
        }, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        priority: number;
        libraries?: string[] | undefined;
        versions?: Record<number, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
        }> | undefined;
    }, {
        priority: number;
        libraries?: string[] | undefined;
        versions?: Record<number, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
        }> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    protocolVersion: number;
    facets: Record<string, {
        priority: number;
        libraries?: string[] | undefined;
        versions?: Record<number, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
        }> | undefined;
    }>;
    protocolInitFacet?: string | undefined;
    protocolCallback?: string | undefined;
}, {
    protocolVersion: number;
    facets: Record<string, {
        priority: number;
        libraries?: string[] | undefined;
        versions?: Record<number, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
        }> | undefined;
    }>;
    protocolInitFacet?: string | undefined;
    protocolCallback?: string | undefined;
}>;
export type FacetVersionConfig = z.infer<typeof FacetVersionConfigSchema>;
export type FacetConfig = z.infer<typeof FacetConfigSchema>;
export type FacetsConfig = z.infer<typeof FacetsConfigSchema>;
export type DeployConfig = z.infer<typeof DeployConfigSchema>;
export type FacetDeployedInfo = z.infer<typeof FacetDeployedInfoSchema>;
export type FacetDeployedInfoRecord = z.infer<typeof FacetDeployedInfoRecordSchema>;
export type DeployedDiamondData = z.infer<typeof DeployedDiamondDataSchema>;
//# sourceMappingURL=DeploymentSchema.d.ts.map