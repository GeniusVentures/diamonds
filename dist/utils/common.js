"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSighash = exports.toWei = exports.XMPL_TOKEN_ID = exports.GNUS_TOKEN_ID = exports.toBN = exports.debuglog = void 0;
const ethers_1 = require("ethers");
const hardhat_1 = require("hardhat");
const debug_1 = require("debug");
const abi_1 = require("@ethersproject/abi");
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
//# sourceMappingURL=common.js.map