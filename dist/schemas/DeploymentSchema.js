"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployConfigSchema = exports.FacetsConfigSchema = exports.FacetConfigSchema = exports.FacetVersionConfigSchema = exports.DeployedDiamondDataSchema = exports.ExternalLibrariesSchema = exports.DeployedFacetsSchema = exports.DeployedFacetSchema = void 0;
const zod_1 = require("zod");
// Schema for a single facet's deployment information
exports.DeployedFacetSchema = zod_1.z.object({
    address: zod_1.z.string().optional(),
    tx_hash: zod_1.z.string().optional(),
    version: zod_1.z.number().optional(),
    funcSelectors: zod_1.z.array(zod_1.z.string()).optional(),
    verified: zod_1.z.boolean().optional(), // Whether the facet is verified
});
// Schema for all deployed facets
exports.DeployedFacetsSchema = zod_1.z.record(exports.DeployedFacetSchema);
// Schema for external libraries
exports.ExternalLibrariesSchema = zod_1.z.record(zod_1.z.string());
// Schema for the network deployment information
exports.DeployedDiamondDataSchema = zod_1.z.object({
    DiamondAddress: zod_1.z.string().optional(),
    DeployerAddress: zod_1.z.string(),
    // FacetDeployedInfo: FacetDeployedInfoRecordSchema.optional(), // Information about deployed facets
    DeployedFacets: exports.DeployedFacetsSchema.optional(),
    ExternalLibraries: exports.ExternalLibrariesSchema.optional(),
    protocolVersion: zod_1.z.number().optional(), // Protocol version
});
/**
 * Schema for the version information of a facet configuration to be deployed
 */
exports.FacetVersionConfigSchema = zod_1.z.object({
    deployInit: zod_1.z.string().optional(),
    upgradeInit: zod_1.z.string().optional(),
    fromVersions: zod_1.z.array(zod_1.z.number()).optional(),
    callbacks: zod_1.z.array(zod_1.z.string()).optional(),
    deployInclude: zod_1.z.array(zod_1.z.string()).optional(),
    deployExclude: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * Schema for the deployment information of a single facet
*/
exports.FacetConfigSchema = zod_1.z.object({
    // Infer TypeScript types from schemas
    priority: zod_1.z.number(),
    libraries: zod_1.z.array(zod_1.z.string()).optional(),
    versions: zod_1.z.record(zod_1.z.coerce.number(), exports.FacetVersionConfigSchema).optional()
});
/**
 * Schema for the deployment configuration information of ALL facets to be deployed
 */
exports.FacetsConfigSchema = zod_1.z.record(exports.FacetConfigSchema);
exports.DeployConfigSchema = zod_1.z.object({
    protocolVersion: zod_1.z.number(),
    protocolInitFacet: zod_1.z.string().optional(),
    protocolCallback: zod_1.z.string().optional(),
    facets: zod_1.z.record(exports.FacetConfigSchema)
});
//# sourceMappingURL=DeploymentSchema.js.map