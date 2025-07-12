"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XMPL_TOKEN_ID = exports.GNUS_TOKEN_ID = exports.toBN = exports.debuglog = void 0;
exports.toWei = toWei;
exports.getSighash = getSighash;
exports.cutKey = cutKey;
exports.getDeployedFacetInterfaces = getDeployedFacetInterfaces;
const hardhat_1 = __importDefault(require("hardhat"));
const debug_1 = require("debug");
const ethers_1 = require("ethers");
global.debuglog = (0, debug_1.debug)('UnitTest:log');
global.debuglog.color = '158';
exports.debuglog = global.debuglog;
const toBN = (value) => BigInt(value);
exports.toBN = toBN;
exports.GNUS_TOKEN_ID = (0, exports.toBN)(0);
exports.XMPL_TOKEN_ID = (0, exports.toBN)(1234567890);
function toWei(value) {
    return hardhat_1.default.ethers.parseEther(value.toString());
}
function getSighash(funcSig) {
    return new ethers_1.Interface([`function ${funcSig}`]).getFunction(funcSig.split('(')[0])?.selector || '';
}
function cutKey(diamondName, networkName, chainId) {
    const key = `${diamondName.toLowerCase()}-${networkName}-${chainId}`;
    return key;
}
function getDeployedFacetInterfaces(deployedInfo) {
    const interfaces = [];
    for (const facetName of Object.keys(deployedInfo.DeployedFacets || {})) {
        try {
            const artifact = hardhat_1.default.artifacts.readArtifactSync(facetName);
            interfaces.push(new ethers_1.Interface(artifact.abi));
        }
        catch (err) {
            console.warn(`⚠️ Could not load artifact for facet ${facetName}:`, err.message);
        }
    }
    return interfaces;
}
//# sourceMappingURL=common.js.map