"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.logTx = void 0;
// ──────────────────────────────────────────────────────────────────────────────
//  txLogging.ts
//  Extra helpers for inspecting diamond‑cut transactions
// ──────────────────────────────────────────────────────────────────────────────
var chalk_1 = require("chalk");
var ethers_1 = require("ethers");
var hardhat_1 = require("hardhat");
/**
 * Pretty‑prints a transaction receipt **and** decodes its logs.
 *
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param description      Optional label that will be shown in the console header.
 * @param interfaces       One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;
 *                         additional ABIs (e.g. library or facet events) can follow.
 */
function logTx(tx, description, interfaces) {
    var _a, _b, _c;
    if (description === void 0) { description = ""; }
    if (interfaces === void 0) { interfaces = []; }
    return __awaiter(this, void 0, void 0, function () {
        var decoders, receipt, _d, _e, _f, _g, _h;
        var _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    decoders = interfaces.map(function (i) {
                        return i instanceof ethers_1.utils.Interface ? i : new ethers_1.utils.Interface(i);
                    });
                    return [4 /*yield*/, tx.wait()];
                case 1:
                    receipt = _k.sent();
                    /* --------------------------- basic tx statistics -------------------------- */
                    console.log(chalk_1["default"].green("\n\u26D3\uFE0F  Transaction Details".concat(description ? " \u2013 ".concat(description) : "")));
                    _e = (_d = console).table;
                    _j = {
                        Hash: tx.hash,
                        Status: receipt.status === 1 ? "Success" : "Failed",
                        Block: receipt.blockNumber,
                        From: receipt.from,
                        To: receipt.to,
                        "Tx Index": receipt.transactionIndex,
                        "Gas Used": receipt.gasUsed.toString(),
                        "Cumulative Gas": receipt.cumulativeGasUsed.toString(),
                        "Gas Price": (_b = (_a = receipt.effectiveGasPrice) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "N/A",
                        "Block Hash": receipt.blockHash,
                        "Confirmations": receipt.confirmations
                    };
                    _f = "Timestamp";
                    if (!receipt.blockNumber) return [3 /*break*/, 3];
                    _h = Date.bind;
                    return [4 /*yield*/, tx.wait().then(function () { return hardhat_1.ethers.provider.getBlock(receipt.blockNumber); })];
                case 2:
                    _g = new (_h.apply(Date, [void 0, (_k.sent()).timestamp * 1000]))().toLocaleString();
                    return [3 /*break*/, 4];
                case 3:
                    _g = "N/A";
                    _k.label = 4;
                case 4:
                    _e.apply(_d, [(_j[_f] = _g,
                            _j["Created Contract"] = (_c = receipt.contractAddress) !== null && _c !== void 0 ? _c : "N/A",
                            _j["Created By"] = receipt.from,
                            _j.Events = receipt.logs.length,
                            _j)]);
                    /* ----------------------------- decode events ------------------------------ */
                    if (receipt.logs.length === 0)
                        return [2 /*return*/, receipt];
                    console.log(chalk_1["default"].cyan("\n📜 Decoded events:"));
                    receipt.logs.forEach(function (log, idx) {
                        var parsed;
                        for (var _i = 0, decoders_1 = decoders; _i < decoders_1.length; _i++) {
                            var iface = decoders_1[_i];
                            try {
                                parsed = iface.parseLog(log);
                                break; // stop at first successful decoder
                            }
                            catch (_) {
                                /* ignore and try next */
                            }
                        }
                        if (parsed) {
                            var argsPretty = parsed === null || parsed === void 0 ? void 0 : parsed.args.map(function (arg, i) {
                                var key = parsed === null || parsed === void 0 ? void 0 : parsed.eventFragment.inputs[i].name;
                                return "".concat(key, ": ").concat(arg);
                            });
                            console.log(chalk_1["default"].yellowBright("  Event[".concat(idx, "]")) + chalk_1["default"].bold(" ".concat(parsed.name)) + "  \u2192  ".concat(argsPretty.join(", ")));
                        }
                        else {
                            console.log(chalk_1["default"].dim("  Event[".concat(idx, "]")) + " \u2013 unable to decode (topic0 = ".concat(log.topics[0], ")"));
                        }
                    });
                    console.log("\n");
                    return [2 /*return*/, receipt];
            }
        });
    });
}
exports.logTx = logTx;
