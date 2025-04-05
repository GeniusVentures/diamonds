"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetsConfigSchema = exports.FacetsDeploymentSchema = exports.FacetInfoSchema = exports.FacetVersionSchema = exports.FacetConfigSchema = exports.FacetVersionConfigSchema = exports.NetworkDeployInfoSchema = exports.ExternalLibrariesSchema = exports.FacetDeployedInfoRecordSchema = exports.FacetDeployedInfoSchema = void 0;
const zod_1 = require("zod");
// Schema for a single facet's deployment information
exports.FacetDeployedInfoSchema = zod_1.z.object({
    address: zod_1.z.string().optional(),
    tx_hash: zod_1.z.string().optional(),
    version: zod_1.z.number().optional(),
    funcSelectors: zod_1.z.array(zod_1.z.string()).optional(),
    verified: zod_1.z.boolean().optional(), // Whether the facet is verified
});
// Schema for all deployed facets
exports.FacetDeployedInfoRecordSchema = zod_1.z.record(exports.FacetDeployedInfoSchema);
// Schema for external libraries
exports.ExternalLibrariesSchema = zod_1.z.record(zod_1.z.string());
// Schema for the network deployment information
exports.NetworkDeployInfoSchema = zod_1.z.object({
    DiamondAddress: zod_1.z.string().optional(),
    DeployerAddress: zod_1.z.string(),
    FacetDeployedInfo: exports.FacetDeployedInfoRecordSchema.optional(),
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
    callback: zod_1.z.function()
        .args(zod_1.z.any()) // TODO: for INetworkDeployInfo — can be refined
        .returns(zod_1.z.promise(zod_1.z.boolean()))
        .optional(),
    deployInclude: zod_1.z.array(zod_1.z.string()).optional()
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
exports.FacetVersionSchema = zod_1.z.object({
    deployInit: zod_1.z.string().optional(),
    upgradeInit: zod_1.z.string().optional(),
    callback: zod_1.z.string().optional(),
    fromVersions: zod_1.z.array(zod_1.z.number()).optional(),
});
exports.FacetInfoSchema = zod_1.z.object({
    priority: zod_1.z.number(),
    versions: zod_1.z.record(exports.FacetVersionSchema).optional(), // Dynamic keys for versions
});
exports.FacetsDeploymentSchema = zod_1.z.record(exports.FacetInfoSchema); // Dynamic keys for facets
/**
 * Schema for the deployment configuration information of ALL facets to be deployed
 */
exports.FacetsConfigSchema = zod_1.z.record(exports.FacetConfigSchema);
//# sourceMappingURL=DeploymentSchema.js.map