"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeployedFacetInterfaces = exports.cutKey = exports.getSighash = exports.toWei = exports.XMPL_TOKEN_ID = exports.GNUS_TOKEN_ID = exports.toBN = exports.debuglog = void 0;
const hardhat_1 = require("hardhat");
const debug_1 = require("debug");
const abi_1 = require("@ethersproject/abi");
const abi_2 = require("@ethersproject/abi");
const ethers_1 = require("ethers");
const hardhat_2 = require("hardhat");
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
    return hardhat_1.ethers.utils.Interface.getSighash(abi_2.Fragment.fromString(funcSig));
}
exports.getSighash = getSighash;
function cutKey(diamondName, networkName, chainId) {
    const key = `${diamondName.toLowerCase()}-${networkName}-${chainId}`;
    return key;
}
exports.cutKey = cutKey;
function getDeployedFacetInterfaces(deployedInfo) {
    const interfaces = [];
    for (const facetName of Object.keys(deployedInfo.FacetDeployedInfo || {})) {
        try {
            const artifact = hardhat_2.artifacts.readArtifactSync(facetName);
            interfaces.push(new abi_1.Interface(artifact.abi));
        }
        catch (err) {
            console.warn(`⚠️ Could not load artifact for facet ${facetName}:`, err.message);
        }
    }
    return interfaces;
}
exports.getDeployedFacetInterfaces = getDeployedFacetInterfaces;
//# sourceMappingURL=common.js.map