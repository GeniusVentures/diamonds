import { z } from 'zod';
export declare const DeployedFacetSchema: z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    tx_hash: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString>>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const DeployedFacetsSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    tx_hash: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString>>;
    verified: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>>;
export declare const ExternalLibrariesSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const DeployedDiamondDataSchema: z.ZodObject<{
    DiamondAddress: z.ZodOptional<z.ZodString>;
    DeployerAddress: z.ZodOptional<z.ZodString>;
    DeployedFacets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        tx_hash: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodNumber>;
        funcSelectors: z.ZodOptional<z.ZodArray<z.ZodString>>;
        verified: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
    ExternalLibraries: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    protocolVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
/**
 * Schema for the version information of a facet configuration to be deployed
 */
export declare const FacetVersionConfigSchema: z.ZodObject<{
    deployInit: z.ZodOptional<z.ZodString>;
    upgradeInit: z.ZodOptional<z.ZodString>;
    fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    callbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deployInclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deployExclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
/**
 * Schema for the deployment information of a single facet
*/
export declare const FacetConfigSchema: z.ZodObject<{
    priority: z.ZodNumber;
    libraries: z.ZodOptional<z.ZodArray<z.ZodString>>;
    versions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        deployInit: z.ZodOptional<z.ZodString>;
        upgradeInit: z.ZodOptional<z.ZodString>;
        fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        callbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deployInclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deployExclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
/**
 * Schema for the deployment configuration information of ALL facets to be deployed
 */
export declare const FacetsConfigSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    priority: z.ZodNumber;
    libraries: z.ZodOptional<z.ZodArray<z.ZodString>>;
    versions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        deployInit: z.ZodOptional<z.ZodString>;
        upgradeInit: z.ZodOptional<z.ZodString>;
        fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        callbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deployInclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
        deployExclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
}, z.core.$strip>>;
export declare const DeployConfigSchema: z.ZodObject<{
    protocolVersion: z.ZodNumber;
    protocolInitFacet: z.ZodOptional<z.ZodString>;
    protocolCallback: z.ZodOptional<z.ZodString>;
    facets: z.ZodRecord<z.ZodString, z.ZodObject<{
        priority: z.ZodNumber;
        libraries: z.ZodOptional<z.ZodArray<z.ZodString>>;
        versions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            deployInit: z.ZodOptional<z.ZodString>;
            upgradeInit: z.ZodOptional<z.ZodString>;
            fromVersions: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
            callbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
            deployInclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
            deployExclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type FacetVersionConfig = z.infer<typeof FacetVersionConfigSchema>;
export type FacetConfig = z.infer<typeof FacetConfigSchema>;
export type FacetsConfig = z.infer<typeof FacetsConfigSchema>;
export type DeployConfig = z.infer<typeof DeployConfigSchema>;
export type DeployedFacet = z.infer<typeof DeployedFacetSchema>;
export type DeployedFacets = z.infer<typeof DeployedFacetsSchema>;
export type DeployedDiamondData = z.infer<typeof DeployedDiamondDataSchema>;
//# sourceMappingURL=DeploymentSchema.d.ts.map