"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetCutAction = exports.FacetsDeploymentSchema = exports.FacetInfoSchema = exports.FacetVersionSchema = void 0;
const zod_1 = require("zod");
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
 * Type for the diamond cut “action”.
 */
var FacetCutAction;
(function (FacetCutAction) {
    FacetCutAction[FacetCutAction["Add"] = 0] = "Add";
    FacetCutAction[FacetCutAction["Replace"] = 1] = "Replace";
    FacetCutAction[FacetCutAction["Remove"] = 2] = "Remove";
})(FacetCutAction || (exports.FacetCutAction = FacetCutAction = {}));
//# sourceMappingURL=deployments.js.map