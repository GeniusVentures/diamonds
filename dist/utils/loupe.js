"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.getDeployedFacets = exports.logDiamondLoupe = void 0;
var ethers_1 = require("ethers");
var chalk_1 = require("chalk");
var hardhat_1 = require("hardhat");
var txlogging_1 = require("./txlogging");
/** ----------------------------------------------------------------
 *  Minimal ABI for DiamondLoupeFacet.facets()
 *  (tuple[] is encoded exactly the same as the struct array returned
 *   by the real contract, so we can decode it safely.)
 *  ----------------------------------------------------------------
 */
var DIAMOND_LOUPE_ABI = [
    "function facets() view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])"
];
// -----------------------------------------------------------------------------
// logDiamondLoupe ­– decodes *events* that were emitted during a diamondCut()
// -----------------------------------------------------------------------------
/**
 * logDiamondLoupe
 * • pretty‑prints the transaction receipt
 * • decodes the logs emitted by the DiamondLoupeFacet
 * • decodes the logs emitted by the facets that were passed in
 *  (e.g. the facets that were added/removed)
 * • prints the decoded events to the console
 * • returns the transaction receipt
 * @param tx               The awaited transaction object (e.g. from `contract.fn()`)
 * @param diamondLoupe     Address of the diamond proxy
 * @param facetABIs        One or more `ethers.Interface` (or plain ABIs) used to decode
 *                         the `receipt.logs`.  Pass the primary contract interface first;
 *                         additional ABIs (e.g. library or facet events) can follow.
 *                         Pass an empty array if you don’t want to decode any facet events.
 *                         (e.g. `[]`)
 *                        (NB: this is not the same as the diamondLoupe address)
 * @returns              The transaction receipt
 */
function logDiamondLoupe(tx, diamondLoupe, facetABIs) {
    if (facetABIs === void 0) { facetABIs = []; }
    return __awaiter(this, void 0, void 0, function () {
        var receipt, iface;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, txlogging_1.logTx)(tx, "DiamondLoupe (".concat(diamondLoupe, ")"), __spreadArray([], facetABIs, true))];
                case 1:
                    receipt = _a.sent();
                    iface = Array.isArray(facetABIs) && facetABIs.length
                        ? new ethers_1.utils.Interface(facetABIs.map(function (i) { return (ethers_1.utils.Interface.isInterface(i) ? i.fragments : i); }).reduce(function (acc, val) { return acc.concat(val); }, []))
                        : undefined;
                    console.log(chalk_1["default"].cyan("\n📜 Decoded Loupe logs:"));
                    receipt.logs.forEach(function (log, idx) {
                        if (!iface) {
                            console.log(chalk_1["default"].dim("  Event[".concat(idx, "] \u2013 no ABI supplied")));
                            return;
                        }
                        var parsed;
                        try {
                            parsed = iface.parseLog(log);
                        }
                        catch (_a) {
                            /* swallow – this log wasn’t emitted by any of the supplied facets */
                        }
                        if (parsed) {
                            var argsPretty = parsed.args
                                .map(function (arg, i) { return "".concat(parsed === null || parsed === void 0 ? void 0 : parsed.eventFragment.inputs[i].name, ": ").concat(arg); })
                                .join(", ");
                            console.log(chalk_1["default"].yellowBright("  Event[".concat(idx, "]")) +
                                chalk_1["default"].bold(" ".concat(parsed.name)) +
                                "  \u2192  ".concat(argsPretty));
                        }
                        else {
                            console.log(chalk_1["default"].dim("  Event[".concat(idx, "]")) + " \u2013 unable to decode (topic0 = ".concat(log.topics[0], ")"));
                        }
                    });
                    return [2 /*return*/, receipt];
            }
        });
    });
}
exports.logDiamondLoupe = logDiamondLoupe;
/**
 * Fetch the list of deployed facets from a diamond without relying on
 * TypeChain’s IDiamondLoupe typings.
 * getDeployedFacets – convenience wrapper around DiamondLoupe.facets()
 * • fetches the facet list
 * • pretty‑prints it
 * • (optionally) calls logDiamondLoupe if you pass a receipt
 *
 * @param diamondAddress   Address of the diamond proxy
 * @param signerOrProvider Signer (for tx) or provider (for read‑only)
 * @param receiptToDecode  Optional transaction receipt to decode
 *                         (e.g. from a diamondCut() transaction)
 * @returns              Array of FacetStruct objects
 *                       (address + functionSelectors)
 *                       (see DiamondLoupeFacet.sol)
 */
function getDeployedFacets(diamondAddress, signerOrProvider, receiptToDecode, logDeployedFacets) {
    if (signerOrProvider === void 0) { signerOrProvider = hardhat_1.ethers.provider; }
    return __awaiter(this, void 0, void 0, function () {
        var loupe, facets;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loupe = new ethers_1.Contract(diamondAddress, DIAMOND_LOUPE_ABI, signerOrProvider);
                    return [4 /*yield*/, loupe.facets()];
                case 1:
                    facets = (_a.sent());
                    if (logDeployedFacets === true) {
                        console.log(chalk_1["default"].magentaBright("\n🔍 Currently deployed facets (via DiamondLoupe):"));
                        facets.forEach(function (f, i) {
                            console.log(chalk_1["default"].blueBright("  [".concat(i.toString().padStart(2, "0"), "]  ").concat(chalk_1["default"].bold(f.facetAddress), "  \u2013  ").concat(f.functionSelectors.length, " selector").concat(f.functionSelectors.length === 1 ? "" : "s")));
                            f.functionSelectors.forEach(function (s, j) {
                                console.log("    ".concat(j.toString().padStart(2, "0"), ":  ").concat(s));
                            });
                            console.log();
                        });
                    }
                    if (!receiptToDecode) return [3 /*break*/, 3];
                    return [4 /*yield*/, logDiamondLoupe(
                        // fabricate a ContractTransaction‑like object so logDiamondLoupe
                        // can stay reception‑agnostic
                        __assign(__assign({}, receiptToDecode), { wait: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, receiptToDecode];
                            }); }); } }), diamondAddress, [loupe.interface])];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, facets];
            }
        });
    });
}
exports.getDeployedFacets = getDeployedFacets;
