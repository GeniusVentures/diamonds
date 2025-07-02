"use strict";
exports.__esModule = true;
exports.getDeployedFacetInterfaces = exports.cutKey = exports.getSighash = exports.toWei = exports.XMPL_TOKEN_ID = exports.GNUS_TOKEN_ID = exports.toBN = exports.debuglog = void 0;
var hardhat_1 = require("hardhat");
var debug_1 = require("debug");
var abi_1 = require("@ethersproject/abi");
var abi_2 = require("@ethersproject/abi");
var ethers_1 = require("ethers");
var hardhat_2 = require("hardhat");
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
    var key = "".concat(diamondName.toLowerCase(), "-").concat(networkName, "-").concat(chainId);
    return key;
}
exports.cutKey = cutKey;
function getDeployedFacetInterfaces(deployedInfo) {
    var interfaces = [];
    for (var _i = 0, _a = Object.keys(deployedInfo.DeployedFacets || {}); _i < _a.length; _i++) {
        var facetName = _a[_i];
        try {
            var artifact = hardhat_2.artifacts.readArtifactSync(facetName);
            interfaces.push(new abi_1.Interface(artifact.abi));
        }
        catch (err) {
            console.warn("\u26A0\uFE0F Could not load artifact for facet ".concat(facetName, ":"), err.message);
        }
    }
    return interfaces;
}
exports.getDeployedFacetInterfaces = getDeployedFacetInterfaces;
