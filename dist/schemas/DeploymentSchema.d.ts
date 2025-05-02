import { z } from "zod";
export declare const DeployedFacetSchema: z.ZodObject<{
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
export declare const DeployedFacetsSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
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
export declare const DeployedDiamondDataSchema: z.ZodObject<{
    DiamondAddress: z.ZodOptional<z.ZodString>;
    DeployerAddress: z.ZodString;
    DeployedFacets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
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
    DeployedFacets?: Record<string, {
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
    DeployedFacets?: Record<string, {
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
    callbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deployInclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    deployExclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callbacks?: string[] | undefined;
    deployInclude?: string[] | undefined;
    deployExclude?: string[] | undefined;
}, {
    deployInit?: string | undefined;
    upgradeInit?: string | undefined;
    fromVersions?: number[] | undefined;
    callbacks?: string[] | undefined;
    deployInclude?: string[] | undefined;
    deployExclude?: string[] | undefined;
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
        deployExclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
        deployExclude?: string[] | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
        deployExclude?: string[] | undefined;
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
        deployExclude?: string[] | undefined;
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
        deployExclude?: string[] | undefined;
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
        deployExclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
        deployExclude?: string[] | undefined;
    }, {
        deployInit?: string | undefined;
        upgradeInit?: string | undefined;
        fromVersions?: number[] | undefined;
        callbacks?: string[] | undefined;
        deployInclude?: string[] | undefined;
        deployExclude?: string[] | undefined;
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
        deployExclude?: string[] | undefined;
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
        deployExclude?: string[] | undefined;
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
            deployExclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
            deployExclude?: string[] | undefined;
        }, {
            deployInit?: string | undefined;
            upgradeInit?: string | undefined;
            fromVersions?: number[] | undefined;
            callbacks?: string[] | undefined;
            deployInclude?: string[] | undefined;
            deployExclude?: string[] | undefined;
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
            deployExclude?: string[] | undefined;
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
            deployExclude?: string[] | undefined;
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
            deployExclude?: string[] | undefined;
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
            deployExclude?: string[] | undefined;
        }> | undefined;
    }>;
    protocolInitFacet?: string | undefined;
    protocolCallback?: string | undefined;
}>;
export type FacetVersionConfig = z.infer<typeof FacetVersionConfigSchema>;
export type FacetConfig = z.infer<typeof FacetConfigSchema>;
export type FacetsConfig = z.infer<typeof FacetsConfigSchema>;
export type DeployConfig = z.infer<typeof DeployConfigSchema>;
export type DeployedFacet = z.infer<typeof DeployedFacetSchema>;
export type DeployedFacets = z.infer<typeof DeployedFacetsSchema>;
export type DeployedDiamondData = z.infer<typeof DeployedDiamondDataSchema>;
//# sourceMappingURL=DeploymentSchema.d.ts.map