"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSighash = exports.toWei = exports.XMPL_TOKEN_ID = exports.GNUS_TOKEN_ID = exports.toBN = exports.debuglog = exports.expect = exports.assert = void 0;
const ethers_1 = require("ethers");
const hardhat_1 = require("hardhat");
const debug_1 = require("debug");
const chai = __importStar(require("chai"));
exports.assert = chai.assert;
exports.expect = chai.expect;
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const abi_1 = require("@ethersproject/abi");
chai.use(chai_as_promised_1.default);
global.debuglog = (0, debug_1.debug)('UnitTest:log');
global.debuglog.color = '158';
exports.debuglog = global.debuglog;
exports.toBN = ethers_1.BigNumber.from;
exports.GNUS_TOKEN_ID = (0, exports.toBN)(0);
exports.XMPL_TOKEN_ID = (0, exports.toBN)(1234567890);
function toWei(value) {
    return hardhat_1.ethers.utils.parseEther(value.toString());
}
exports.toWei = toWei;
function getSighash(funcSig) {
    return hardhat_1.ethers.utils.Interface.getSighash(abi_1.Fragment.fromString(funcSig));
}
exports.getSighash = getSighash;
// export function createPreviousVersionRecordWithMap(facetInfo: FacetDeployedInfo): PreviousVersionRecord {
//   const previousVersionRecord: PreviousVersionRecord = {};
//   // Using Object.entries() to get key-value pairs and then mapping over them
//   Object.entries(facetInfo).map(([facetName, info]) => {
//     if (info.version !== undefined) {
//       previousVersionRecord[facetName] = info.version;
//     } else {
//       console.warn(`Facet ${facetName} does not have a version`);
//     }
//   });
//   return previousVersionRecord;
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
//# sourceMappingURL=common.js.map