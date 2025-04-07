"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetCutAction = void 0;
// /**
// * Interface describing the structure of facets to deploy and their metadata.
// */
// export interface IFacetsDeployConfig {
//   [facetName: string]: {
//     priority: number;
//     libraries?: string[];
//     versions?: {
//       [versionNumber: number]: {
//         deployInit?: string;
//         upgradeInit?: string;
//         fromVersions?: number[];
//         callback?: (info: INetworkDeployInfo) => Promise<boolean>;
//         deployInclude?: string[];
//       };
//     };
//   };
// }
// // map Facet Selectors to contract address string
// export interface IDeployedFacetSelectors {
//   facets: Record<string, string>;
// }
// // map contract name to array of FacetSignature strings
// export interface IDeployedContractFacetSelectors {
//   contractFacets: Record<string, string[]>;
// }
// // map Facet Selectors to contract address string
// export interface IDeployedFacetSelectors {
//   facets: Record<string, string>;
// }
// // map contract name to array of FacetSignature strings
// export interface IDeployedContractFacetSelectors {
//   contractFacets: Record<string, string[]>;
// }
// export type FacetSelectorsDeployed = IDeployedFacetSelectors &
//   IDeployedContractFacetSelectors;
// export type AfterDeployInit = (
//   networkDeployInfo: INetworkDeployInfo,
// ) => Promise<void | boolean>;
// export interface IVersionInfo {
//   fromVersions?: number[];
//   deployInit?: string;          // init for when not upgrading and first deployment
//   upgradeInit?: string;   // upgradeInit if version is upgrading from previous version
//   deployInclude?: string[];
//   callback?: AfterDeployInit;
// }
// export type VersionRecord = Record<number, IVersionInfo>;
// export interface IFacetToDeployInfo {
//   priority: number;
//   versions?: VersionRecord;
//   libraries?: string[];
// }
// export type FacetToDeployInfo = Record<string, IFacetToDeployInfo>;
// export interface IFacetCallback {
//   (networkDeployInfo: INetworkDeployInfo): Promise<boolean>;
// }
/**
 * Type for the diamond cut “action”.
 */
var FacetCutAction;
(function (FacetCutAction) {
    FacetCutAction[FacetCutAction["Add"] = 0] = "Add";
    FacetCutAction[FacetCutAction["Replace"] = 1] = "Replace";
    FacetCutAction[FacetCutAction["Remove"] = 2] = "Remove";
})(FacetCutAction = exports.FacetCutAction || (exports.FacetCutAction = {}));
//# sourceMappingURL=deployments.js.map