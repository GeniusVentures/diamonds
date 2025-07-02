"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.__esModule = true;
exports.BaseDeploymentStrategy = void 0;
var types_1 = require("../types");
var hardhat_1 = require("hardhat");
var path_1 = require("path");
var chalk_1 = require("chalk");
var utils_1 = require("../utils");
var BaseDeploymentStrategy = /** @class */ (function () {
    function BaseDeploymentStrategy(verbose) {
        if (verbose === void 0) { verbose = false; }
        this.verbose = verbose;
    }
    BaseDeploymentStrategy.prototype.preDeployDiamond = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].gray("\uD83D\uDD27 Running pre-deploy logic for diamond ".concat(diamond.diamondName)));
                        }
                        return [4 /*yield*/, this.preDeployDiamondTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.preDeployDiamondTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseDeploymentStrategy.prototype.deployDiamond = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].yellowBright("\n\uD83E\uDE93 Deploying diamond ".concat(diamond.diamondName, " with DiamondCutFacet...")));
                        }
                        return [4 /*yield*/, this.deployDiamondTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.deployDiamondTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            var diamondCutFactory, diamondCutFacet, diamondArtifactName, diamondArtifactPath, diamondFactory, diamondContract, diamondCutFacetFunctionSelectors, diamondCutFacetSelectorsRegistry, deployedDiamondData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log(chalk_1["default"].blueBright("\uD83D\uDE80 Explicitly deploying DiamondCutFacet and Diamond for ".concat(diamond.diamondName)));
                        return [4 /*yield*/, hardhat_1.ethers.getContractFactory("DiamondCutFacet", diamond.getSigner())];
                    case 1:
                        diamondCutFactory = _b.sent();
                        return [4 /*yield*/, diamondCutFactory.deploy()];
                    case 2:
                        diamondCutFacet = _b.sent();
                        return [4 /*yield*/, diamondCutFacet.deployed()];
                    case 3:
                        _b.sent();
                        diamondArtifactName = "".concat(diamond.diamondName, ".sol:").concat(diamond.diamondName);
                        diamondArtifactPath = (0, path_1.join)(diamond.contractsPath, diamondArtifactName);
                        return [4 /*yield*/, hardhat_1.ethers.getContractFactory(diamondArtifactPath, diamond.getSigner())];
                    case 4:
                        diamondFactory = _b.sent();
                        return [4 /*yield*/, diamondFactory.deploy(diamond.getSigner().getAddress(), diamondCutFacet.address)];
                    case 5:
                        diamondContract = _b.sent();
                        return [4 /*yield*/, diamondContract.deployed()];
                    case 6:
                        _b.sent();
                        diamondCutFacetFunctionSelectors = Object.keys(diamondCutFacet.interface.functions).map(function (fn) {
                            return diamondCutFacet.interface.getSighash(fn);
                        });
                        diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce(function (acc, selector) {
                            var _a, _b;
                            acc[selector] = {
                                facetName: "DiamondCutFacet",
                                priority: ((_b = (_a = diamond.getFacetsConfig()) === null || _a === void 0 ? void 0 : _a.DiamondCutFacet) === null || _b === void 0 ? void 0 : _b.priority) || 1000,
                                address: diamondCutFacet.address,
                                action: types_1.RegistryFacetCutAction.Deployed
                            };
                            return acc;
                        }, {});
                        diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
                        deployedDiamondData = diamond.getDeployedDiamondData();
                        _a = deployedDiamondData;
                        return [4 /*yield*/, diamond.getSigner().getAddress()];
                    case 7:
                        _a.DeployerAddress = _b.sent();
                        deployedDiamondData.DiamondAddress = diamondContract.address;
                        deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
                        deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
                            address: diamondCutFacet.address,
                            tx_hash: diamondCutFacet.deployTransaction.hash,
                            version: 0,
                            funcSelectors: diamondCutFacetFunctionSelectors
                        };
                        diamond.updateDeployedDiamondData(deployedDiamondData);
                        console.log(chalk_1["default"].green("\u2705 Diamond deployed at ".concat(diamondContract.address, ", DiamondCutFacet at ").concat(diamondCutFacet.address)));
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.postDeployDiamond = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].gray("\u2705 Running post-deploy logic for diamond ".concat(diamond.diamondName)));
                        }
                        return [4 /*yield*/, this.postDeployDiamondTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.postDeployDiamondTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseDeploymentStrategy.prototype.preDeployFacets = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].gray("\uD83D\uDD27 Running pre-deploy logic for facets of diamond ".concat(diamond.diamondName)));
                        }
                        return [4 /*yield*/, this.preDeployFacetsTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.preDeployFacetsTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseDeploymentStrategy.prototype.deployFacets = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.deployFacetsTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.deployFacetsTasks = function (diamond) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __awaiter(this, void 0, void 0, function () {
            var deployConfig, facetsConfig, deployedDiamondData, deployedFacets, facetCuts, sortedFacetNames, _loop_1, this_1, _i, sortedFacetNames_1, facetName;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        deployConfig = diamond.getDeployConfig();
                        facetsConfig = diamond.getDeployConfig().facets;
                        deployedDiamondData = diamond.getDeployedDiamondData();
                        deployedFacets = deployedDiamondData.DeployedFacets || {};
                        facetCuts = [];
                        sortedFacetNames = Object.keys(deployConfig.facets)
                            .sort(function (a, b) {
                            return (deployConfig.facets[a].priority || 1000) - (deployConfig.facets[b].priority || 1000);
                        });
                        _loop_1 = function (facetName) {
                            var facetConfig, deployedVersion, availableVersions, upgradeVersion, signer, facetFactory, facetContract_1, deployedFacets_1, availableVersions_1, facetSelectors, deployInit, upgradeInit, initFn, newFacetData;
                            return __generator(this, function (_p) {
                                switch (_p.label) {
                                    case 0:
                                        facetConfig = facetsConfig[facetName];
                                        deployedVersion = (_c = (_b = (_a = deployedDiamondData.DeployedFacets) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) !== null && _c !== void 0 ? _c : -1;
                                        availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
                                        upgradeVersion = Math.max.apply(Math, availableVersions);
                                        if (!(upgradeVersion > deployedVersion || deployedVersion === -1)) return [3 /*break*/, 4];
                                        if (this_1.verbose) {
                                            console.log(chalk_1["default"].blueBright("\uD83D\uDE80 Deploying facet: ".concat(facetName, " to version ").concat(upgradeVersion)));
                                        }
                                        signer = diamond.getSigner();
                                        return [4 /*yield*/, hardhat_1.ethers.getContractFactory(facetName, { signer: signer })];
                                    case 1:
                                        facetFactory = _p.sent();
                                        return [4 /*yield*/, facetFactory.deploy()];
                                    case 2:
                                        facetContract_1 = _p.sent();
                                        return [4 /*yield*/, facetContract_1.deployed()];
                                    case 3:
                                        _p.sent();
                                        deployedFacets_1 = new Map();
                                        availableVersions_1 = Object.keys((_d = facetConfig.versions) !== null && _d !== void 0 ? _d : {}).map(Number);
                                        facetSelectors = Object.keys(facetContract_1.interface.functions)
                                            .map(function (fn) { return facetContract_1.interface.getSighash(fn); });
                                        deployInit = ((_f = (_e = facetConfig.versions) === null || _e === void 0 ? void 0 : _e[upgradeVersion]) === null || _f === void 0 ? void 0 : _f.deployInit) || "";
                                        upgradeInit = ((_h = (_g = facetConfig.versions) === null || _g === void 0 ? void 0 : _g[upgradeVersion]) === null || _h === void 0 ? void 0 : _h.upgradeInit) || "";
                                        initFn = diamond.newDeployment ? deployInit : upgradeInit;
                                        if (initFn && facetName !== deployConfig.protocolInitFacet) {
                                            diamond.initializerRegistry.set(facetName, initFn);
                                        }
                                        newFacetData = {
                                            priority: facetConfig.priority || 1000,
                                            address: facetContract_1.address,
                                            tx_hash: facetContract_1.deployTransaction.hash,
                                            version: upgradeVersion,
                                            funcSelectors: facetSelectors,
                                            deployInclude: ((_k = (_j = facetConfig.versions) === null || _j === void 0 ? void 0 : _j[upgradeVersion]) === null || _k === void 0 ? void 0 : _k.deployInclude) || [],
                                            deployExclude: ((_m = (_l = facetConfig.versions) === null || _l === void 0 ? void 0 : _l[upgradeVersion]) === null || _m === void 0 ? void 0 : _m.deployExclude) || [],
                                            initFunction: initFn,
                                            verified: false
                                        };
                                        diamond.updateNewDeployedFacets(facetName, newFacetData);
                                        console.log(chalk_1["default"].cyan("\u26F5 Deployed at ".concat(facetContract_1.address, " with ").concat(facetSelectors.length, " selectors.")));
                                        // Log the deployment transaction and selectors
                                        if (this_1.verbose) {
                                            console.log(chalk_1["default"].gray("  Selectors:"), facetSelectors);
                                        }
                                        _p.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, sortedFacetNames_1 = sortedFacetNames;
                        _o.label = 1;
                    case 1:
                        if (!(_i < sortedFacetNames_1.length)) return [3 /*break*/, 4];
                        facetName = sortedFacetNames_1[_i];
                        return [5 /*yield**/, _loop_1(facetName)];
                    case 2:
                        _o.sent();
                        _o.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.postDeployFacets = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].gray("\u2705 Running post-deploy logic for facets of diamond ".concat(diamond.diamondName)));
                        }
                        return [4 /*yield*/, this.postDeployFacetsTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Used by subclasses for facet post-deployment tasks
    BaseDeploymentStrategy.prototype.postDeployFacetsTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    // Pre-hook for updating function selector registry (can be overridden by subclasses)
    BaseDeploymentStrategy.prototype.preUpdateFunctionSelectorRegistry = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.verbose) {
                    console.log(chalk_1["default"].gray("\uD83D\uDD27 Running pre-update logic for function selector registry of diamond ".concat(diamond.diamondName)));
                }
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.preUpdateFunctionSelectorRegistryTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseDeploymentStrategy.prototype.updateFunctionSelectorRegistry = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.verbose) {
                    console.log(chalk_1["default"].yellowBright("\n\uD83E\uDE93 Updating function selector registry for diamond ".concat(diamond.diamondName, "...")));
                }
                this.updateFunctionSelectorRegistryTasks(diamond);
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.updateFunctionSelectorRegistryTasks = function (diamond) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var registry, zeroAddress, newDeployedFacets, newDeployedFacetsByPriority, _loop_2, _i, newDeployedFacetsByPriority_1, _b, newFacetName, newFacetData, facetsConfig, facetNames, _c, _d, _e, selector, entry;
            return __generator(this, function (_f) {
                registry = diamond.functionSelectorRegistry;
                zeroAddress = hardhat_1.ethers.constants.AddressZero;
                newDeployedFacets = diamond.getNewDeployedFacets();
                newDeployedFacetsByPriority = Object.entries(newDeployedFacets).sort(function (_a, _b) {
                    var a = _a[1];
                    var b = _b[1];
                    return (a.priority || 1000) - (b.priority || 1000);
                });
                _loop_2 = function (newFacetName, newFacetData) {
                    var currentFacetAddress = newFacetData.address;
                    var priority = newFacetData.priority;
                    var functionSelectors = newFacetData.funcSelectors || [];
                    var includeFuncSelectors = newFacetData.deployInclude || [];
                    var excludeFuncSelectors = newFacetData.deployExclude || [];
                    /* ------------------ Exclusion Filter ------------------ */
                    for (var _g = 0, excludeFuncSelectors_1 = excludeFuncSelectors; _g < excludeFuncSelectors_1.length; _g++) {
                        var excludeFuncSelector = excludeFuncSelectors_1[_g];
                        // remove from the facets functionSelectors
                        if (excludeFuncSelector in functionSelectors) {
                            functionSelectors.splice(functionSelectors.indexOf(excludeFuncSelector), 1);
                        }
                        // update action to remove if excluded from registry where a previous deployment associated with facetname
                        if (excludeFuncSelector in registry && ((_a = registry.get(excludeFuncSelector)) === null || _a === void 0 ? void 0 : _a.facetName) === newFacetName) {
                            var existing = registry.get(excludeFuncSelector);
                            if (existing && existing.facetName === newFacetName) {
                                registry.set(excludeFuncSelector, {
                                    priority: priority,
                                    address: currentFacetAddress,
                                    action: types_1.RegistryFacetCutAction.Remove,
                                    facetName: newFacetName
                                });
                            }
                        }
                    }
                    /* ------------ Higher Priority Split of Registry ------------------ */
                    var registryHigherPrioritySplit = Array.from(registry.entries())
                        .filter(function (_a) {
                        var _ = _a[0], entry = _a[1];
                        return entry.priority > priority;
                    })
                        .reduce(function (acc, _a) {
                        var selector = _a[0], entry = _a[1];
                        if (!acc[entry.facetName]) {
                            acc[entry.facetName] = [];
                        }
                        acc[entry.facetName].push(selector);
                        return acc;
                    }, {});
                    var _loop_3 = function (includeFuncSelector) {
                        // Force Replace if already registered by higher priority facet
                        if (includeFuncSelector in registryHigherPrioritySplit) {
                            var higherPriorityFacet = Object.keys(registryHigherPrioritySplit).find(function (facetName) {
                                return registryHigherPrioritySplit[facetName].includes(includeFuncSelector);
                            });
                            if (higherPriorityFacet) {
                                registry.set(includeFuncSelector, {
                                    priority: priority,
                                    address: currentFacetAddress,
                                    action: types_1.RegistryFacetCutAction.Replace,
                                    facetName: newFacetName
                                });
                            }
                        }
                        else {
                            // Add to the registry
                            registry.set(includeFuncSelector, {
                                priority: priority,
                                address: currentFacetAddress,
                                action: types_1.RegistryFacetCutAction.Add,
                                facetName: newFacetName
                            });
                        }
                        // remove from the funcSels so it is not modified in Priority Resolution Pass
                        if (includeFuncSelector in newDeployedFacets) {
                            var existing = newDeployedFacets[newFacetName];
                            if (existing && existing.funcSelectors) {
                                existing.funcSelectors.splice(existing.funcSelectors.indexOf(includeFuncSelector), 1);
                            }
                        }
                    };
                    /* ------------------ Inclusion Override Filter ------------------ */
                    for (var _h = 0, includeFuncSelectors_1 = includeFuncSelectors; _h < includeFuncSelectors_1.length; _h++) {
                        var includeFuncSelector = includeFuncSelectors_1[_h];
                        _loop_3(includeFuncSelector);
                    }
                    /* ------------------ Replace Facet and Priority Resolution Pass ------------- */
                    for (var _j = 0, functionSelectors_1 = functionSelectors; _j < functionSelectors_1.length; _j++) {
                        var selector = functionSelectors_1[_j];
                        var existing = registry.get(selector);
                        if (existing) {
                            var existingPriority = existing.priority;
                            if (existing.facetName === newFacetName) {
                                // Same facet, update the address
                                registry.set(selector, {
                                    priority: priority,
                                    address: currentFacetAddress,
                                    action: types_1.RegistryFacetCutAction.Replace,
                                    facetName: newFacetName
                                });
                            }
                            else if (priority < existingPriority) {
                                // Current facet has higher priority, Replace it
                                registry.set(selector, {
                                    priority: priority,
                                    address: currentFacetAddress,
                                    action: types_1.RegistryFacetCutAction.Replace,
                                    facetName: newFacetName
                                });
                            }
                        }
                        else {
                            // New selector, simply add
                            registry.set(selector, {
                                priority: priority,
                                address: currentFacetAddress,
                                action: types_1.RegistryFacetCutAction.Add,
                                facetName: newFacetName
                            });
                        }
                    }
                    /* ---------------- Remove Old Function Selectors from facets -------------- */
                    // Set functionselectors with the newFacetName and still different address to Remove
                    for (var _k = 0, _l = registry.entries(); _k < _l.length; _k++) {
                        var _m = _l[_k], selector = _m[0], entry = _m[1];
                        if (entry.facetName === newFacetName && entry.address !== currentFacetAddress) {
                            registry.set(selector, {
                                priority: entry.priority,
                                address: zeroAddress,
                                action: types_1.RegistryFacetCutAction.Remove,
                                facetName: newFacetName
                            });
                        }
                    }
                };
                for (_i = 0, newDeployedFacetsByPriority_1 = newDeployedFacetsByPriority; _i < newDeployedFacetsByPriority_1.length; _i++) {
                    _b = newDeployedFacetsByPriority_1[_i], newFacetName = _b[0], newFacetData = _b[1];
                    _loop_2(newFacetName, newFacetData);
                }
                facetsConfig = diamond.getDeployConfig().facets;
                facetNames = Object.keys(facetsConfig);
                for (_c = 0, _d = registry.entries(); _c < _d.length; _c++) {
                    _e = _d[_c], selector = _e[0], entry = _e[1];
                    if (!facetNames.includes(entry.facetName)) {
                        registry.set(selector, {
                            priority: entry.priority,
                            address: zeroAddress,
                            action: types_1.RegistryFacetCutAction.Remove,
                            facetName: entry.facetName
                        });
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.postUpdateFunctionSelectorRegistry = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.verbose) {
                    console.log(chalk_1["default"].gray("\u2705 Running post-update logic for function selector registry of diamond ".concat(diamond.diamondName)));
                }
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.prePerformDiamondCut = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].gray("\uD83D\uDD27 Running pre-diamond cut logic for diamond ".concat(diamond.diamondName)));
                        }
                        return [4 /*yield*/, this.prePerformDiamondCutTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.prePerformDiamondCutTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseDeploymentStrategy.prototype.performDiamondCut = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].yellowBright("\n\uD83E\uDE93 Performing diamond cut for diamond ".concat(diamond.diamondName, "...")));
                        }
                        return [4 /*yield*/, this.performDiamondCutTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.performDiamondCutTasks = function (diamond) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var diamondSignerAddress, signer, diamondContract, signerDiamondContract, deployConfig, deployedDiamondData, _b, initCalldata, initAddress, facetCuts, _i, facetCuts_1, cut, chainId, facetSelectorCutMap, tx, txHash, ifaceList, _c, _d, _e, facetName, initFunction, initContract, signerDiamondContract_1, tx_1;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, ((_a = diamond.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress())];
                    case 1:
                        diamondSignerAddress = _f.sent();
                        hardhat_1.ethers.provider = diamond.getProvider();
                        return [4 /*yield*/, hardhat_1.ethers.getSigner(diamondSignerAddress)];
                    case 2:
                        signer = _f.sent();
                        return [4 /*yield*/, hardhat_1.ethers.getContractAt("IDiamondCut", diamond.getDeployedDiamondData().DiamondAddress)];
                    case 3:
                        diamondContract = _f.sent();
                        signerDiamondContract = diamondContract.connect(signer);
                        deployConfig = diamond.getDeployConfig();
                        deployedDiamondData = diamond.getDeployedDiamondData();
                        return [4 /*yield*/, this.getInitCalldata(diamond)];
                    case 4:
                        _b = _f.sent(), initCalldata = _b[0], initAddress = _b[1];
                        return [4 /*yield*/, this.getFacetCuts(diamond)];
                    case 5:
                        facetCuts = _f.sent();
                        // Vaidate no orphaned selectors, i.e. 'Add', 'Replace' or 'Deployed' selectors with the same facetNames but different addresses
                        return [4 /*yield*/, this.validateNoOrphanedSelectors(facetCuts)];
                    case 6:
                        // Vaidate no orphaned selectors, i.e. 'Add', 'Replace' or 'Deployed' selectors with the same facetNames but different addresses
                        _f.sent();
                        if (this.verbose) {
                            console.log(chalk_1["default"].yellowBright("\n\uD83E\uDE93 Performing DiamondCut with ".concat(facetCuts.length, " cut(s):")));
                            for (_i = 0, facetCuts_1 = facetCuts; _i < facetCuts_1.length; _i++) {
                                cut = facetCuts_1[_i];
                                console.log(chalk_1["default"].bold("- ".concat(types_1.FacetCutAction[cut.action], " for facet ").concat(cut.name, " at ").concat(cut.facetAddress)));
                                console.log(chalk_1["default"].gray("  Selectors:"), cut.functionSelectors);
                            }
                            if (initAddress !== hardhat_1.ethers.constants.AddressZero) {
                                console.log(chalk_1["default"].cyan("Initializing with functionSelector ".concat(initCalldata, " on ProtocolInitFacet ").concat(deployConfig.protocolInitFacet, " @ ").concat(initAddress)));
                            }
                        }
                        return [4 /*yield*/, hardhat_1.ethers.provider.getNetwork()];
                    case 7:
                        chainId = _f.sent();
                        facetSelectorCutMap = facetCuts.map(function (fc) { return ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors }); });
                        return [4 /*yield*/, signerDiamondContract.diamondCut(facetSelectorCutMap, initAddress, initCalldata)];
                    case 8:
                        tx = _f.sent();
                        txHash = tx.hash;
                        return [4 /*yield*/, this.postDiamondCutDeployedDataUpdate(diamond, txHash)];
                    case 9:
                        _f.sent();
                        ifaceList = (0, utils_1.getDeployedFacetInterfaces)(deployedDiamondData);
                        if (!this.verbose) return [3 /*break*/, 11];
                        return [4 /*yield*/, (0, utils_1.logTx)(tx, "DiamondCut", ifaceList)];
                    case 10:
                        _f.sent();
                        return [3 /*break*/, 13];
                    case 11:
                        console.log(chalk_1["default"].blueBright("\uD83D\uDD04 Waiting for DiamondCut transaction to be mined..."));
                        return [4 /*yield*/, tx.wait()];
                    case 12:
                        _f.sent();
                        _f.label = 13;
                    case 13:
                        console.log(chalk_1["default"].green("\u2705 DiamondCut executed: ".concat(tx.hash)));
                        _c = 0, _d = diamond.initializerRegistry.entries();
                        _f.label = 14;
                    case 14:
                        if (!(_c < _d.length)) return [3 /*break*/, 21];
                        _e = _d[_c], facetName = _e[0], initFunction = _e[1];
                        console.log(chalk_1["default"].blueBright("\u25B6 Running ".concat(initFunction, " from the ").concat(facetName, " facet")));
                        return [4 /*yield*/, hardhat_1.ethers.getContractAt(facetName, diamond.getDeployedDiamondData().DiamondAddress)];
                    case 15:
                        initContract = _f.sent();
                        signerDiamondContract_1 = initContract.connect(signer);
                        return [4 /*yield*/, initContract[initFunction]()];
                    case 16:
                        tx_1 = _f.sent();
                        if (!this.verbose) return [3 /*break*/, 17];
                        (0, utils_1.logTx)(tx_1, "".concat(facetName, ".").concat(initFunction), ifaceList);
                        return [3 /*break*/, 19];
                    case 17:
                        console.log(chalk_1["default"].blueBright("\uD83D\uDD04 Waiting for ".concat(facetName, ".").concat(initFunction, "} mined...")));
                        return [4 /*yield*/, tx_1.wait()];
                    case 18:
                        _f.sent();
                        _f.label = 19;
                    case 19:
                        console.log(chalk_1["default"].green("\u2705 ".concat(facetName, ".").concat(initFunction, " executed")));
                        _f.label = 20;
                    case 20:
                        _c++;
                        return [3 /*break*/, 14];
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.postPerformDiamondCut = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].gray("\u2705 Running post-diamond cut logic for diamond ".concat(diamond.diamondName)));
                        }
                        return [4 /*yield*/, this.postPerformDiamondCutTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.postPerformDiamondCutTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    BaseDeploymentStrategy.prototype.getInitCalldata = function (diamond) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var deployedDiamondData, deployConfig, initAddress, initCalldata, protocolInitFacet, protocolVersion, protocolFacetInfo, versionCfg, initFn, iface;
            return __generator(this, function (_c) {
                deployedDiamondData = diamond.getDeployedDiamondData();
                deployConfig = diamond.getDeployConfig();
                initAddress = hardhat_1.ethers.constants.AddressZero;
                initCalldata = "0x";
                protocolInitFacet = deployConfig.protocolInitFacet || "";
                protocolVersion = deployConfig.protocolVersion;
                protocolFacetInfo = diamond.getNewDeployedFacets()[protocolInitFacet];
                if (protocolInitFacet && protocolFacetInfo) {
                    versionCfg = (_b = (_a = deployConfig.facets[protocolInitFacet]) === null || _a === void 0 ? void 0 : _a.versions) === null || _b === void 0 ? void 0 : _b[protocolVersion];
                    initFn = diamond.newDeployment ? versionCfg === null || versionCfg === void 0 ? void 0 : versionCfg.deployInit : versionCfg === null || versionCfg === void 0 ? void 0 : versionCfg.upgradeInit;
                    if (initFn) {
                        iface = new hardhat_1.ethers.utils.Interface(["function ".concat(initFn)]);
                        initAddress = protocolFacetInfo.address;
                        initCalldata = iface.encodeFunctionData(initFn);
                        if (this.verbose) {
                            console.log(chalk_1["default"].cyan("\uD83D\uDD27 Using protocol-wide initializer: ".concat(protocolInitFacet, ".").concat(initFn, "()")));
                        }
                    }
                }
                if (initAddress === hardhat_1.ethers.constants.AddressZero) {
                    console.log(chalk_1["default"].yellow("\u26A0\uFE0F No protocol-wide initializer found. Using zero address."));
                }
                diamond.setInitAddress(initAddress);
                return [2 /*return*/, [initCalldata, initAddress]];
            });
        });
    };
    BaseDeploymentStrategy.prototype.getFacetCuts = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            var deployConfig, selectorRegistry, facetCuts;
            return __generator(this, function (_a) {
                deployConfig = diamond.getDeployConfig();
                selectorRegistry = diamond.functionSelectorRegistry;
                facetCuts = Array.from(selectorRegistry.entries())
                    .filter(function (_a) {
                    var _ = _a[0], entry = _a[1];
                    return entry.action !== types_1.RegistryFacetCutAction.Deployed;
                })
                    .map(function (_a) {
                    var selector = _a[0], entry = _a[1];
                    return {
                        facetAddress: entry.address,
                        action: entry.action,
                        functionSelectors: [selector],
                        name: entry.facetName
                    };
                });
                return [2 /*return*/, facetCuts];
            });
        });
    };
    BaseDeploymentStrategy.prototype.validateNoOrphanedSelectors = function (facetCuts) {
        return __awaiter(this, void 0, void 0, function () {
            var orphanedSelectors;
            return __generator(this, function (_a) {
                orphanedSelectors = facetCuts.filter(function (facetCut) {
                    return facetCuts.some(function (otherFacetCut) {
                        return (otherFacetCut.facetAddress !== facetCut.facetAddress &&
                            otherFacetCut.name === facetCut.name &&
                            (otherFacetCut.action === types_1.RegistryFacetCutAction.Add ||
                                otherFacetCut.action === types_1.RegistryFacetCutAction.Replace ||
                                otherFacetCut.action === types_1.RegistryFacetCutAction.Deployed));
                    });
                });
                if (orphanedSelectors.length > 0) {
                    console.error(chalk_1["default"].redBright("\u274C Orphaned selectors found for facet ".concat(orphanedSelectors[0].name, " at address ").concat(orphanedSelectors[0].facetAddress)));
                    console.error(chalk_1["default"].redBright("  - ".concat(orphanedSelectors[0].functionSelectors)));
                    throw new Error("Orphaned selectors found for facet ".concat(orphanedSelectors[0].name, " at address ").concat(orphanedSelectors[0].facetAddress));
                }
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.postDiamondCutDeployedDataUpdate = function (diamond, txHash) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var deployConfig, deployedDiamondData, selectorRegistry, currentVersion, facetSelectorsMap, _i, _b, _c, selector, entry, facetName, _d, _e, _f, facetName, _g, address, selectors, _h, _j, facetName;
            return __generator(this, function (_k) {
                deployConfig = diamond.getDeployConfig();
                deployedDiamondData = diamond.getDeployedDiamondData();
                selectorRegistry = diamond.functionSelectorRegistry;
                currentVersion = (_a = deployedDiamondData.protocolVersion) !== null && _a !== void 0 ? _a : 0;
                deployedDiamondData.protocolVersion = deployConfig.protocolVersion;
                facetSelectorsMap = {};
                for (_i = 0, _b = selectorRegistry.entries(); _i < _b.length; _i++) {
                    _c = _b[_i], selector = _c[0], entry = _c[1];
                    facetName = entry.facetName;
                    if (!facetSelectorsMap[facetName]) {
                        facetSelectorsMap[facetName] = { address: entry.address, selectors: [] };
                    }
                    if (entry.action === types_1.RegistryFacetCutAction.Add || entry.action === types_1.RegistryFacetCutAction.Replace || entry.action === types_1.RegistryFacetCutAction.Deployed) {
                        facetSelectorsMap[facetName].selectors.push(selector);
                    }
                }
                // Update deployed facets with aggregated selectors
                deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
                for (_d = 0, _e = Object.entries(facetSelectorsMap); _d < _e.length; _d++) {
                    _f = _e[_d], facetName = _f[0], _g = _f[1], address = _g.address, selectors = _g.selectors;
                    if (selectors.length > 0) {
                        deployedDiamondData.DeployedFacets[facetName] = {
                            address: address,
                            tx_hash: txHash,
                            version: currentVersion,
                            funcSelectors: selectors
                        };
                    }
                }
                // Remove facets with no selectors
                for (_h = 0, _j = Object.keys(deployedDiamondData.DeployedFacets); _h < _j.length; _h++) {
                    facetName = _j[_h];
                    if (!facetSelectorsMap[facetName] || facetSelectorsMap[facetName].selectors.length === 0) {
                        delete deployedDiamondData.DeployedFacets[facetName];
                    }
                }
                diamond.updateDeployedDiamondData(deployedDiamondData);
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.preRunPostDeployCallbacks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.verbose) {
                    console.log(chalk_1["default"].gray("\uD83D\uDD27 Running pre-post-deploy logic for diamond ".concat(diamond.diamondName)));
                }
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.runPostDeployCallbacks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runPostDeployCallbacksTasks(diamond)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.runPostDeployCallbacksTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            var deployConfig, _i, _a, _b, facetName, facetConfig, _c, _d, _e, version, config, args;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log("\uD83D\uDD04 Running post-deployment callbacks...");
                        deployConfig = diamond.getDeployConfig();
                        _i = 0, _a = Object.entries(deployConfig.facets);
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], facetName = _b[0], facetConfig = _b[1];
                        if (!facetConfig.versions)
                            return [3 /*break*/, 5];
                        _c = 0, _d = Object.entries(facetConfig.versions);
                        _f.label = 2;
                    case 2:
                        if (!(_c < _d.length)) return [3 /*break*/, 5];
                        _e = _d[_c], version = _e[0], config = _e[1];
                        if (!config.callbacks) return [3 /*break*/, 4];
                        args = {
                            diamond: diamond
                        };
                        console.log(chalk_1["default"].cyanBright("Executing callback ".concat(config.callbacks, " for facet ").concat(facetName, "...")));
                        return [4 /*yield*/, diamond.callbackManager.executeCallback(facetName, config.callbacks, args)];
                    case 3:
                        _f.sent();
                        console.log(chalk_1["default"].magenta("\u2705 Callback ".concat(config.callbacks, " executed for facet ").concat(facetName)));
                        _f.label = 4;
                    case 4:
                        _c++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        console.log(chalk_1["default"].greenBright(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\u2705 All post-deployment callbacks executed."], ["\u2705 All post-deployment callbacks executed."]))));
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseDeploymentStrategy.prototype.postRunPostDeployCallbacks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.verbose) {
                    console.log(chalk_1["default"].gray("\u2705 Running post-post-deploy logic for diamond ".concat(diamond.diamondName)));
                }
                return [2 /*return*/];
            });
        });
    };
    BaseDeploymentStrategy.prototype.postRunPostDeployCallbacksTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.verbose) {
                    console.log(chalk_1["default"].gray("\u2705 Running post-post-deploy logic for diamond ".concat(diamond.diamondName)));
                }
                return [2 /*return*/];
            });
        });
    };
    return BaseDeploymentStrategy;
}());
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
var templateObject_1;
