"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetsConfigSchema = exports.FacetConfigSchema = exports.FacetVersionConfigSchema = exports.NetworkDeployInfoSchema = exports.ExternalLibrariesSchema = exports.FacetDeployedInfoRecordSchema = exports.FacetDeployedInfoSchema = void 0;
const zod_1 = require("zod");
// Schema for a single facet's deployment information
exports.FacetDeployedInfoSchema = zod_1.z.object({
    address: zod_1.z.string().optional(), // Address of the deployed facet
    tx_hash: zod_1.z.string().optional(), // Transaction hash of the deployment
    version: zod_1.z.number().optional(), // Version of the facet
    funcSelectors: zod_1.z.array(zod_1.z.string()).optional(), // Function selectors for the facet
    verified: zod_1.z.boolean().optional(), // Whether the facet is verified
});
// Schema for all deployed facets
exports.FacetDeployedInfoRecordSchema = zod_1.z.record(exports.FacetDeployedInfoSchema);
// Schema for external libraries
exports.ExternalLibrariesSchema = zod_1.z.record(zod_1.z.string());
// Schema for the network deployment information
exports.NetworkDeployInfoSchema = zod_1.z.object({
    DiamondAddress: zod_1.z.string().optional(), // Address of the deployed diamond
    DeployerAddress: zod_1.z.string(), // Address of the deployer
    FacetDeployedInfo: exports.FacetDeployedInfoRecordSchema.optional(), // Information about deployed facets
    ExternalLibraries: exports.ExternalLibrariesSchema.optional(), // External libraries used in the deployment
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
/**
 * Schema for the deployment configuration information of ALL facets to be deployed
 */
exports.FacetsConfigSchema = zod_1.z.record(exports.FacetConfigSchema);
//# sourceMappingURL=DeploymentSchema.js.map