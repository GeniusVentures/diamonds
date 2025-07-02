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
exports.compareFacetSelectors = exports.isProtocolInitRegistered = exports.printFacetSelectorFunctions = exports.diffDeployedFacets = void 0;
var loupe_1 = require("./loupe");
var abi_1 = require("@ethersproject/abi");
var chalk_1 = require("chalk");
function diffDeployedFacets(deployedDiamondData, signerOrProvider, verboseGetDeployedFacets) {
    return __awaiter(this, void 0, void 0, function () {
        var diamondAddress, onChainFacets, localFacets, seen, pass, _loop_1, _i, onChainFacets_1, facet, _a, _b, localFacetName;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    diamondAddress = deployedDiamondData.DiamondAddress;
                    return [4 /*yield*/, (0, loupe_1.getDeployedFacets)(diamondAddress, signerOrProvider, undefined, verboseGetDeployedFacets)];
                case 1:
                    onChainFacets = _c.sent();
                    localFacets = deployedDiamondData.DeployedFacets || {};
                    seen = new Set();
                    pass = true;
                    console.log(chalk_1["default"].magentaBright("\n🔍 Diffing on-chain facets against deployment metadata:\n"));
                    _loop_1 = function (facet) {
                        var match = Object.entries(localFacets).find(function (_a) {
                            var _b;
                            var _ = _a[0], meta = _a[1];
                            return ((_b = meta.address) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === facet.facetAddress.toLowerCase();
                        });
                        if (!match) {
                            console.log(chalk_1["default"].red("  \u274C On-chain facet ".concat(facet.facetAddress, " not found in deployment record.")));
                            return "continue";
                        }
                        var name_1 = match[0], meta = match[1];
                        seen.add(name_1);
                        var expected = meta.funcSelectors || [];
                        var actual = facet.functionSelectors;
                        var added = actual.filter(function (sel) { return !expected.includes(sel); });
                        var removed = expected.filter(function (sel) { return !actual.includes(sel); });
                        if (added.length || removed.length) {
                            console.log(chalk_1["default"].yellow("  \u26A0\uFE0F Mismatch in selectors for facet ".concat(name_1, " (").concat(facet.facetAddress, ")")));
                            if (added.length)
                                console.log(chalk_1["default"].green("    + Added: ".concat(added.join(", "))));
                            if (removed.length)
                                console.log(chalk_1["default"].red("    - Missing: ".concat(removed.join(", "))));
                        }
                        else {
                            console.log(chalk_1["default"].green("  \u2705 ".concat(name_1, " matches.")));
                        }
                    };
                    for (_i = 0, onChainFacets_1 = onChainFacets; _i < onChainFacets_1.length; _i++) {
                        facet = onChainFacets_1[_i];
                        _loop_1(facet);
                    }
                    for (_a = 0, _b = Object.keys(localFacets); _a < _b.length; _a++) {
                        localFacetName = _b[_a];
                        if (pass && !seen.has(localFacetName)) {
                            console.log(chalk_1["default"].red("  \u274C Deployed facet ".concat(localFacetName, " missing from on-chain state.")));
                            pass = false;
                        }
                    }
                    if (pass) {
                        console.log(chalk_1["default"].bgGreenBright("  ✅ All facets exist in deplyoment metadata!"));
                    }
                    else {
                        console.log(chalk_1["default"].bgRed("  ❌ Some facets do not match!"));
                    }
                    return [2 /*return*/, pass];
            }
        });
    });
}
exports.diffDeployedFacets = diffDeployedFacets;
function printFacetSelectorFunctions(abi, selectors) {
    var iface = new abi_1.Interface(abi);
    console.log(chalk_1["default"].cyan("\n🔎 Matching selectors to functions:"));
    var _loop_2 = function (selector) {
        var fragment = Object.values(iface.functions).find(function (fn) {
            return iface.getSighash(fn) === selector;
        });
        console.log("  ".concat(selector, " \u2192 ").concat(fragment ? fragment.format() : chalk_1["default"].gray("unknown")));
    };
    for (var _i = 0, selectors_1 = selectors; _i < selectors_1.length; _i++) {
        var selector = selectors_1[_i];
        _loop_2(selector);
    }
}
exports.printFacetSelectorFunctions = printFacetSelectorFunctions;
function isProtocolInitRegistered(deployedDiamondData, protocolInitFacet, initializerSig) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var facet, iface, selector;
        return __generator(this, function (_b) {
            facet = (_a = deployedDiamondData.DeployedFacets) === null || _a === void 0 ? void 0 : _a[protocolInitFacet];
            console.log("Checking if ".concat(protocolInitFacet, " is registered with ").concat(initializerSig, "..."));
            if (!facet || !facet.funcSelectors)
                return [2 /*return*/, false];
            if (!initializerSig) {
                console.warn(chalk_1["default"].yellow("  \u274C No initializer signature provided for ".concat(protocolInitFacet, ".")));
                return [2 /*return*/, false];
            }
            iface = new abi_1.Interface(["function ".concat(initializerSig)]);
            selector = iface.getSighash(initializerSig);
            console.log("  Found selector: ".concat(selector));
            return [2 /*return*/, facet.funcSelectors.includes(selector)];
        });
    });
}
exports.isProtocolInitRegistered = isProtocolInitRegistered;
/**
 * Compares facet selectors from on-chain DiamondLoupe with local DeployedDiamondData
 *
 * @param deployedFacetData - local metadata (facetName -> { address, funcSelectors[] })
 * @param onChainFacets - list of { facetAddress, functionSelectors[] } from DiamondLoupe
 * @returns map of facetName -> { extraOnChain[], missingOnChain[], matched[] }
 */
function compareFacetSelectors(deployedFacetData, onChainFacets) {
    var _a;
    var result = {};
    var addressToName = Object.entries(deployedFacetData).reduce(function (acc, _a) {
        var name = _a[0], meta = _a[1];
        if (meta.address)
            acc[meta.address.toLowerCase()] = name;
        return acc;
    }, {});
    var _loop_3 = function (facetAddress, functionSelectors) {
        var lowerAddr = facetAddress.toLowerCase();
        var name_2 = addressToName[lowerAddr] || "unknown";
        var expected = new Set(((_a = deployedFacetData[name_2]) === null || _a === void 0 ? void 0 : _a.funcSelectors) || []);
        var actual = new Set(functionSelectors);
        result[name_2] = {
            extraOnChain: __spreadArray([], actual, true).filter(function (sel) { return !expected.has(sel); }).sort(),
            missingOnChain: __spreadArray([], expected, true).filter(function (sel) { return !actual.has(sel); }).sort(),
            matched: __spreadArray([], actual, true).filter(function (sel) { return expected.has(sel); }).sort()
        };
    };
    for (var _i = 0, onChainFacets_2 = onChainFacets; _i < onChainFacets_2.length; _i++) {
        var _b = onChainFacets_2[_i], facetAddress = _b.facetAddress, functionSelectors = _b.functionSelectors;
        _loop_3(facetAddress, functionSelectors);
    }
    return result;
}
exports.compareFacetSelectors = compareFacetSelectors;
