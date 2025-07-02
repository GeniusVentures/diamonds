"use strict";
exports.__esModule = true;
exports.RegistryFacetCutAction = exports.FacetCutAction = void 0;
/**
 * Type for the diamond cut “action”.
 */
var FacetCutAction;
(function (FacetCutAction) {
    FacetCutAction[FacetCutAction["Add"] = 0] = "Add";
    FacetCutAction[FacetCutAction["Replace"] = 1] = "Replace";
    FacetCutAction[FacetCutAction["Remove"] = 2] = "Remove";
})(FacetCutAction = exports.FacetCutAction || (exports.FacetCutAction = {}));
var RegistryFacetCutAction;
(function (RegistryFacetCutAction) {
    RegistryFacetCutAction[RegistryFacetCutAction["Add"] = 0] = "Add";
    RegistryFacetCutAction[RegistryFacetCutAction["Replace"] = 1] = "Replace";
    RegistryFacetCutAction[RegistryFacetCutAction["Remove"] = 2] = "Remove";
    RegistryFacetCutAction[RegistryFacetCutAction["Deployed"] = 3] = "Deployed";
})(RegistryFacetCutAction = exports.RegistryFacetCutAction || (exports.RegistryFacetCutAction = {}));
