"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.OZDefenderDeploymentStrategy = void 0;
var BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
var types_1 = require("../types");
var chalk_1 = require("chalk");
var hardhat_1 = require("hardhat");
var defender_sdk_1 = require("@openzeppelin/defender-sdk");
var defenderStore_1 = require("../utils/defenderStore");
var OZDefenderDeploymentStrategy = /** @class */ (function (_super) {
    __extends(OZDefenderDeploymentStrategy, _super);
    function OZDefenderDeploymentStrategy(apiKey, apiSecret, relayerAddress, autoApprove, via, viaType, verbose, customClient // Optional for testing
    ) {
        if (autoApprove === void 0) { autoApprove = false; }
        if (verbose === void 0) { verbose = true; }
        var _this = _super.call(this, verbose) || this;
        _this.client = customClient || new defender_sdk_1.Defender({ apiKey: apiKey, apiSecret: apiSecret });
        // this.proposalClient = new ProposalClient({ apiKey, apiSecret });
        _this.relayerAddress = relayerAddress;
        _this.via = via;
        _this.viaType = viaType;
        _this.autoApprove = autoApprove;
        return _this;
    }
    OZDefenderDeploymentStrategy.prototype.checkAndUpdateDeployStep = function (stepName, diamond) {
        return __awaiter(this, void 0, void 0, function () {
            var config, network, deploymentId, store, step, deployment, status_1, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = diamond.getDiamondConfig();
                        network = config.networkName;
                        deploymentId = "".concat(diamond.diamondName, "-").concat(network, "-").concat(config.chainId);
                        store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId);
                        step = store.getStep(stepName);
                        if (!step || !step.proposalId)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.deploy.getDeployedContract(step.proposalId)];
                    case 2:
                        deployment = _a.sent();
                        status_1 = deployment.status;
                        if (status_1 === 'completed') {
                            console.log(chalk_1["default"].green("\u2705 Defender deployment for ".concat(stepName, " completed.")));
                            store.updateStatus(stepName, 'executed');
                        }
                        else if (status_1 === 'failed') {
                            console.error(chalk_1["default"].red("\u274C Defender deployment for ".concat(stepName, " failed.")));
                            store.updateStatus(stepName, 'failed');
                            throw new Error("Defender deployment ".concat(step.proposalId, " failed for step ").concat(stepName));
                        }
                        else {
                            console.log(chalk_1["default"].yellow("\u23F3 Defender deployment for ".concat(stepName, " is still ").concat(status_1, ".")));
                            // Optionally you can wait/poll here
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.error(chalk_1["default"].red("\u26A0\uFE0F Error while querying Defender deploy status for ".concat(stepName, ":")), err_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Polls the Defender API until the deployment is complete or fails.
     * @param stepName The name of the step to poll.
     * @param diamond The diamond instance.
     * @param options Polling options.
     * @returns The deployment response or null if not found.
     */
    OZDefenderDeploymentStrategy.prototype.pollUntilComplete = function (stepName, diamond, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, maxAttempts, _b, initialDelayMs, _c, maxDelayMs, _d, jitter, config, network, deploymentId, store, step, attempt, delay, _loop_1, this_1, state_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = options.maxAttempts, maxAttempts = _a === void 0 ? 10 : _a, _b = options.initialDelayMs, initialDelayMs = _b === void 0 ? 8000 : _b, _c = options.maxDelayMs, maxDelayMs = _c === void 0 ? 60000 : _c, _d = options.jitter, jitter = _d === void 0 ? true : _d;
                        config = diamond.getDiamondConfig();
                        network = config.networkName;
                        deploymentId = "".concat(diamond.diamondName, "-").concat(network, "-").concat(config.chainId);
                        store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId);
                        step = store.getStep(stepName);
                        if (!(step === null || step === void 0 ? void 0 : step.proposalId)) {
                            console.warn("\u26A0\uFE0F No Defender deployment ID found for step ".concat(stepName));
                            return [2 /*return*/, null];
                        }
                        attempt = 0;
                        delay = initialDelayMs;
                        _loop_1 = function () {
                            var deployment, status_2, errorMsg, err_2, sleep;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        _f.trys.push([0, 4, , 5]);
                                        return [4 /*yield*/, this_1.client.deploy.getDeployedContract(step.proposalId)];
                                    case 1:
                                        deployment = _f.sent();
                                        status_2 = deployment.status;
                                        if (!(status_2 === 'completed')) return [3 /*break*/, 3];
                                        console.log(chalk_1["default"].green("\u2705 Deployment succeeded for ".concat(stepName, ".")));
                                        store.updateStatus(stepName, 'executed');
                                        // Update diamond data with deployed contract information
                                        return [4 /*yield*/, this_1.updateDiamondWithDeployment(diamond, stepName, deployment)];
                                    case 2:
                                        // Update diamond data with deployed contract information
                                        _f.sent();
                                        return [2 /*return*/, { value: deployment }];
                                    case 3:
                                        if (status_2 === 'failed') {
                                            console.error(chalk_1["default"].red("\u274C Deployment failed for ".concat(stepName, ".")));
                                            store.updateStatus(stepName, 'failed');
                                            errorMsg = deployment.error || 'Unknown deployment error';
                                            throw new Error("Deployment failed for ".concat(stepName, ": ").concat(errorMsg));
                                        }
                                        console.log(chalk_1["default"].yellow("\u23F3 Deployment ".concat(stepName, " still ").concat(status_2, ". Retrying in ").concat(delay, "ms...")));
                                        return [3 /*break*/, 5];
                                    case 4:
                                        err_2 = _f.sent();
                                        console.error(chalk_1["default"].red("\u26A0\uFE0F Error polling Defender for ".concat(stepName, ":")), err_2);
                                        if (attempt >= maxAttempts - 1) {
                                            throw err_2;
                                        }
                                        return [3 /*break*/, 5];
                                    case 5:
                                        attempt++;
                                        sleep = jitter
                                            ? delay + Math.floor(Math.random() * (delay / 2))
                                            : delay;
                                        return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, sleep); })];
                                    case 6:
                                        _f.sent();
                                        // Exponential backoff
                                        delay = Math.min(delay * 2, maxDelayMs);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _e.label = 1;
                    case 1:
                        if (!(attempt < maxAttempts)) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        state_1 = _e.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        return [3 /*break*/, 1];
                    case 3:
                        console.warn(chalk_1["default"].red("\u26A0\uFE0F Deployment for ".concat(stepName, " did not complete after ").concat(maxAttempts, " attempts.")));
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Updates the diamond data with deployment information from Defender
     */
    OZDefenderDeploymentStrategy.prototype.updateDiamondWithDeployment = function (diamond, stepName, deployment) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function () {
            var deployedDiamondData, contractAddress, diamondCutFactory_1, diamondCutFacetFunctionSelectors, diamondCutFacetSelectorsRegistry, facetName, facetFactory_1, facetSelectors, deployConfig, facetConfig, availableVersions, targetVersion, initFn, newFacetData, err_3;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        deployedDiamondData = diamond.getDeployedDiamondData();
                        contractAddress = deployment.contractAddress;
                        if (!contractAddress) {
                            console.warn(chalk_1["default"].yellow("\u26A0\uFE0F No contract address found in deployment response for ".concat(stepName)));
                            return [2 /*return*/];
                        }
                        if (!(stepName === 'deploy-diamondcutfacet')) return [3 /*break*/, 2];
                        return [4 /*yield*/, hardhat_1.ethers.getContractFactory("DiamondCutFacet", diamond.getSigner())];
                    case 1:
                        diamondCutFactory_1 = _k.sent();
                        diamondCutFacetFunctionSelectors = Object.keys(diamondCutFactory_1.interface.functions).map(function (fn) {
                            return diamondCutFactory_1.interface.getSighash(fn);
                        });
                        deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
                        deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
                            address: contractAddress,
                            tx_hash: deployment.txHash || 'defender-deployment',
                            version: 0,
                            funcSelectors: diamondCutFacetFunctionSelectors
                        };
                        diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce(function (acc, selector) {
                            var _a, _b;
                            acc[selector] = {
                                facetName: "DiamondCutFacet",
                                priority: ((_b = (_a = diamond.getFacetsConfig()) === null || _a === void 0 ? void 0 : _a.DiamondCutFacet) === null || _b === void 0 ? void 0 : _b.priority) || 1000,
                                address: contractAddress,
                                action: 0
                            };
                            return acc;
                        }, {});
                        diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
                        return [3 /*break*/, 7];
                    case 2:
                        if (!(stepName === 'deploy-diamond')) return [3 /*break*/, 3];
                        deployedDiamondData.DiamondAddress = contractAddress;
                        return [3 /*break*/, 7];
                    case 3:
                        if (!stepName.startsWith('deploy-')) return [3 /*break*/, 7];
                        facetName = stepName.replace('deploy-', '');
                        _k.label = 4;
                    case 4:
                        _k.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, hardhat_1.ethers.getContractFactory(facetName, diamond.getSigner())];
                    case 5:
                        facetFactory_1 = _k.sent();
                        facetSelectors = Object.keys(facetFactory_1.interface.functions).map(function (fn) {
                            return facetFactory_1.interface.getSighash(fn);
                        });
                        deployConfig = diamond.getDeployConfig();
                        facetConfig = deployConfig.facets[facetName];
                        availableVersions = Object.keys((_a = facetConfig.versions) !== null && _a !== void 0 ? _a : {}).map(Number);
                        targetVersion = Math.max.apply(Math, availableVersions);
                        deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
                        deployedDiamondData.DeployedFacets[facetName] = {
                            address: contractAddress,
                            tx_hash: deployment.txHash || 'defender-deployment',
                            version: targetVersion,
                            funcSelectors: facetSelectors
                        };
                        initFn = diamond.newDeployment
                            ? ((_c = (_b = facetConfig.versions) === null || _b === void 0 ? void 0 : _b[targetVersion]) === null || _c === void 0 ? void 0 : _c.deployInit) || ""
                            : ((_e = (_d = facetConfig.versions) === null || _d === void 0 ? void 0 : _d[targetVersion]) === null || _e === void 0 ? void 0 : _e.upgradeInit) || "";
                        if (initFn && facetName !== deployConfig.protocolInitFacet) {
                            diamond.initializerRegistry.set(facetName, initFn);
                        }
                        newFacetData = {
                            priority: facetConfig.priority || 1000,
                            address: contractAddress,
                            tx_hash: deployment.txHash || 'defender-deployment',
                            version: targetVersion,
                            funcSelectors: facetSelectors,
                            deployInclude: ((_g = (_f = facetConfig.versions) === null || _f === void 0 ? void 0 : _f[targetVersion]) === null || _g === void 0 ? void 0 : _g.deployInclude) || [],
                            deployExclude: ((_j = (_h = facetConfig.versions) === null || _h === void 0 ? void 0 : _h[targetVersion]) === null || _j === void 0 ? void 0 : _j.deployExclude) || [],
                            initFunction: initFn,
                            verified: false
                        };
                        diamond.updateNewDeployedFacets(facetName, newFacetData);
                        return [3 /*break*/, 7];
                    case 6:
                        err_3 = _k.sent();
                        console.warn(chalk_1["default"].yellow("\u26A0\uFE0F Could not get interface for facet ".concat(facetName, ": ").concat(err_3)));
                        return [3 /*break*/, 7];
                    case 7:
                        diamond.updateDeployedDiamondData(deployedDiamondData);
                        return [2 /*return*/];
                }
            });
        });
    };
    OZDefenderDeploymentStrategy.prototype.preDeployDiamondTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.verbose) {
                            console.log(chalk_1["default"].yellowBright("\n\uD83E\uDE93 Pre-deploy diamond tasks for ".concat(diamond.diamondName, " from ").concat(this.constructor.name, "...")));
                        }
                        return [4 /*yield*/, this.checkAndUpdateDeployStep('deploy-diamondcutfacet', diamond)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.checkAndUpdateDeployStep('deploy-diamond', diamond)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OZDefenderDeploymentStrategy.prototype.deployDiamondTasks = function (diamond) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var diamondConfig, network, deploymentId, store, signer, deployerAddress, stepNameCut, cutRequest, cutDeployment, stepNameDiamond, diamondRequest, diamondDeployment;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        diamondConfig = diamond.getDiamondConfig();
                        network = diamondConfig.networkName;
                        deploymentId = "".concat(diamond.diamondName, "-").concat(network, "-").concat(diamondConfig.chainId);
                        store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId);
                        signer = diamond.getSigner();
                        return [4 /*yield*/, signer.getAddress()];
                    case 1:
                        deployerAddress = _c.sent();
                        stepNameCut = 'deploy-diamondcutfacet';
                        if (!(((_a = store.getStep(stepNameCut)) === null || _a === void 0 ? void 0 : _a.status) !== 'executed')) return [3 /*break*/, 4];
                        cutRequest = {
                            network: network,
                            contractName: 'DiamondCutFacet',
                            contractPath: "".concat(diamond.contractsPath, "/DiamondCutFacet.sol"),
                            constructorInputs: [],
                            verifySourceCode: true
                        };
                        return [4 /*yield*/, this.client.deploy.deployContract(cutRequest)];
                    case 2:
                        cutDeployment = _c.sent();
                        store.saveStep({
                            stepName: stepNameCut,
                            proposalId: cutDeployment.deploymentId,
                            status: 'pending',
                            description: 'DiamondCutFacet deployed via Defender DeployClient',
                            timestamp: Date.now()
                        });
                        return [4 /*yield*/, this.pollUntilComplete(stepNameCut, diamond)];
                    case 3:
                        _c.sent();
                        console.log(chalk_1["default"].blue("\uD83D\uDCE1 Submitted DiamondCutFacet deploy to Defender: ".concat(cutDeployment.deploymentId)));
                        _c.label = 4;
                    case 4:
                        stepNameDiamond = 'deploy-diamond';
                        if (!(((_b = store.getStep(stepNameDiamond)) === null || _b === void 0 ? void 0 : _b.status) !== 'executed')) return [3 /*break*/, 7];
                        diamondRequest = {
                            network: network,
                            contractName: diamond.diamondName,
                            contractPath: "".concat(diamond.contractsPath, "/").concat(diamond.diamondName, ".sol"),
                            constructorInputs: [deployerAddress, hardhat_1.ethers.constants.AddressZero],
                            verifySourceCode: true
                        };
                        return [4 /*yield*/, this.client.deploy.deployContract(diamondRequest)];
                    case 5:
                        diamondDeployment = _c.sent();
                        store.saveStep({
                            stepName: stepNameDiamond,
                            proposalId: diamondDeployment.deploymentId,
                            status: 'pending',
                            description: 'Diamond deployed via Defender DeployClient',
                            timestamp: Date.now()
                        });
                        return [4 /*yield*/, this.pollUntilComplete(stepNameDiamond, diamond)];
                    case 6:
                        _c.sent();
                        console.log(chalk_1["default"].blue("\uD83D\uDCE1 Submitted Diamond deploy to Defender: ".concat(diamondDeployment.deploymentId)));
                        _c.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    OZDefenderDeploymentStrategy.prototype.preDeployFacetsTasks = function (diamond) {
        return __awaiter(this, void 0, void 0, function () {
            var facets, _i, facets_1, facet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        facets = Object.keys(diamond.getDeployConfig().facets);
                        _i = 0, facets_1 = facets;
                        _a.label = 1;
                    case 1:
                        if (!(_i < facets_1.length)) return [3 /*break*/, 4];
                        facet = facets_1[_i];
                        return [4 /*yield*/, this.checkAndUpdateDeployStep("deploy-".concat(facet), diamond)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * deployFacetsTasks
     *
     * Deploys the facets of the diamond using OpenZeppelin Defender.
     *
     * @param diamond
     */
    OZDefenderDeploymentStrategy.prototype.deployFacetsTasks = function (diamond) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var deployConfig, facetsConfig, diamondConfig, network, deploymentId, store, signer, facetNamesSorted, _i, facetNamesSorted_1, facetName, stepKey, step, facetConfig, deployedVersion, availableVersions, targetVersion, deployRequest, deployResult;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        deployConfig = diamond.getDeployConfig();
                        facetsConfig = deployConfig.facets;
                        diamondConfig = diamond.getDiamondConfig();
                        network = diamondConfig.networkName;
                        deploymentId = "".concat(diamond.diamondName, "-").concat(network, "-").concat(diamondConfig.chainId);
                        store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId);
                        signer = diamond.getSigner();
                        facetNamesSorted = Object.keys(facetsConfig).sort(function (a, b) {
                            var _a, _b;
                            return ((_a = facetsConfig[a].priority) !== null && _a !== void 0 ? _a : 1000) - ((_b = facetsConfig[b].priority) !== null && _b !== void 0 ? _b : 1000);
                        });
                        _i = 0, facetNamesSorted_1 = facetNamesSorted;
                        _e.label = 1;
                    case 1:
                        if (!(_i < facetNamesSorted_1.length)) return [3 /*break*/, 5];
                        facetName = facetNamesSorted_1[_i];
                        stepKey = "deploy-".concat(facetName);
                        step = store.getStep(stepKey);
                        if ((step === null || step === void 0 ? void 0 : step.status) === 'executed') {
                            console.log(chalk_1["default"].gray("\u23E9 Skipping already-deployed facet: ".concat(facetName)));
                            return [3 /*break*/, 4];
                        }
                        facetConfig = facetsConfig[facetName];
                        deployedVersion = (_c = (_b = (_a = diamond.getDeployedDiamondData().DeployedFacets) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) !== null && _c !== void 0 ? _c : -1;
                        availableVersions = Object.keys((_d = facetConfig.versions) !== null && _d !== void 0 ? _d : {}).map(Number);
                        targetVersion = Math.max.apply(Math, availableVersions);
                        if (targetVersion <= deployedVersion && deployedVersion !== -1) {
                            console.log(chalk_1["default"].gray("\u23E9 Skipping facet ".concat(facetName, ", already at version ").concat(deployedVersion)));
                            return [3 /*break*/, 4];
                        }
                        console.log(chalk_1["default"].cyan("\uD83D\uDD27 Deploying facet ".concat(facetName, " to version ").concat(targetVersion, "...")));
                        deployRequest = {
                            network: network,
                            contractName: facetName,
                            contractPath: "".concat(diamond.contractsPath, "/").concat(facetName, ".sol"),
                            constructorInputs: [],
                            verifySourceCode: true
                        };
                        return [4 /*yield*/, this.client.deploy.deployContract(deployRequest)];
                    case 2:
                        deployResult = _e.sent();
                        store.saveStep({
                            stepName: stepKey,
                            proposalId: deployResult.deploymentId,
                            status: 'pending',
                            description: "Facet ".concat(facetName, " deployment submitted"),
                            timestamp: Date.now()
                        });
                        return [4 /*yield*/, this.pollUntilComplete(stepKey, diamond)];
                    case 3:
                        _e.sent();
                        console.log(chalk_1["default"].blue("\uD83D\uDCE1 Submitted deployment for facet ".concat(facetName, ": ").concat(deployResult.deploymentId)));
                        _e.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Performs the diamond cut tasks using OpenZeppelin Defender.
     * @param diamond The diamond instance.
     */
    OZDefenderDeploymentStrategy.prototype.performDiamondCutTasks = function (diamond) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var deployedDiamondData, diamondAddress, deployConfig, diamondConfig, network, _e, initCalldata, initAddress, facetCuts, _i, facetCuts_1, cut, proposal, _f, proposalId, url, store, attempts, maxAttempts, delayMs_1, proposalData, isExecuted, isReverted, err_4;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        deployedDiamondData = diamond.getDeployedDiamondData();
                        diamondAddress = deployedDiamondData.DiamondAddress;
                        deployConfig = diamond.getDeployConfig();
                        diamondConfig = diamond.getDiamondConfig();
                        network = diamondConfig.networkName;
                        return [4 /*yield*/, this.getInitCalldata(diamond)];
                    case 1:
                        _e = _g.sent(), initCalldata = _e[0], initAddress = _e[1];
                        return [4 /*yield*/, this.getFacetCuts(diamond)];
                    case 2:
                        facetCuts = _g.sent();
                        return [4 /*yield*/, this.validateNoOrphanedSelectors(facetCuts)];
                    case 3:
                        _g.sent();
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
                        proposal = {
                            contract: {
                                address: diamondAddress,
                                network: network
                            },
                            title: "DiamondCut ".concat(facetCuts.length, " facets"),
                            description: 'Perform diamondCut via Defender',
                            type: 'custom',
                            functionInterface: {
                                name: 'diamondCut',
                                inputs: [
                                    {
                                        name: 'facetCuts',
                                        type: 'tuple[]',
                                        components: [
                                            { name: 'facetAddress', type: 'address' },
                                            { name: 'action', type: 'uint8' },
                                            { name: 'functionSelectors', type: 'bytes4[]' }
                                        ]
                                    },
                                    { name: 'initAddress', type: 'address' },
                                    { name: 'initCalldata', type: 'bytes' },
                                ]
                            },
                            functionInputs: [
                                JSON.stringify(facetCuts.map(function (cut) { return ({
                                    facetAddress: cut.facetAddress,
                                    action: cut.action,
                                    functionSelectors: cut.functionSelectors
                                }); })),
                                initAddress,
                                initCalldata
                            ],
                            via: this.via,
                            viaType: this.viaType
                        };
                        return [4 /*yield*/, this.client.proposal.create({ proposal: proposal })];
                    case 4:
                        _f = _g.sent(), proposalId = _f.proposalId, url = _f.url;
                        console.log(chalk_1["default"].blue("\uD83D\uDCE1 Defender Proposal created: ".concat(url)));
                        store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, "".concat(diamond.diamondName, "-").concat(network, "-").concat(diamondConfig.chainId));
                        store.saveStep({
                            stepName: 'diamond-cut',
                            proposalId: proposalId,
                            status: 'pending',
                            description: "DiamondCut proposal with ".concat(facetCuts.length, " facets"),
                            timestamp: Date.now()
                        });
                        if (!this.autoApprove) return [3 /*break*/, 12];
                        console.log(chalk_1["default"].yellow("\u23F3 Auto-approval enabled. Waiting for proposal to be ready for execution..."));
                        attempts = 0;
                        maxAttempts = 20;
                        delayMs_1 = 15000;
                        _g.label = 5;
                    case 5:
                        if (!(attempts < maxAttempts)) return [3 /*break*/, 11];
                        _g.label = 6;
                    case 6:
                        _g.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.client.proposal.get(proposalId)];
                    case 7:
                        proposalData = _g.sent();
                        isExecuted = (_b = (_a = proposalData === null || proposalData === void 0 ? void 0 : proposalData.transaction) === null || _a === void 0 ? void 0 : _a.isExecuted) !== null && _b !== void 0 ? _b : false;
                        isReverted = (_d = (_c = proposalData === null || proposalData === void 0 ? void 0 : proposalData.transaction) === null || _c === void 0 ? void 0 : _c.isReverted) !== null && _d !== void 0 ? _d : false;
                        if (isExecuted && !isReverted) {
                            console.log(chalk_1["default"].green("\u2705 Proposal executed successfully."));
                            store.updateStatus('diamond-cut', 'executed');
                            return [2 /*return*/];
                        }
                        if (isExecuted && isReverted) {
                            console.error(chalk_1["default"].red("\u274C Proposal execution reverted."));
                            store.updateStatus('diamond-cut', 'failed');
                            throw new Error("Proposal execution reverted: ".concat(proposalId));
                        }
                        // For auto-approval, we'll just log the status
                        // Note: The actual execution method may vary by Defender API version
                        console.log(chalk_1["default"].gray("\u231B Proposal status check ".concat(attempts + 1, "/").concat(maxAttempts, ". Manual execution may be required.")));
                        return [3 /*break*/, 9];
                    case 8:
                        err_4 = _g.sent();
                        console.error(chalk_1["default"].red("\u26A0\uFE0F Error checking proposal status:"), err_4);
                        if (attempts >= maxAttempts - 1) {
                            throw err_4;
                        }
                        return [3 /*break*/, 9];
                    case 9: return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, delayMs_1); })];
                    case 10:
                        _g.sent();
                        attempts++;
                        return [3 /*break*/, 5];
                    case 11:
                        if (attempts >= maxAttempts) {
                            console.warn(chalk_1["default"].red("\u26A0\uFE0F Proposal polling completed after ".concat(maxAttempts, " attempts.")));
                            console.log(chalk_1["default"].blue("\uD83D\uDD17 Manual execution may be required: ".concat(url)));
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        console.log(chalk_1["default"].blue("\uD83D\uDD17 Manual approval required: ".concat(url)));
                        _g.label = 13;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    return OZDefenderDeploymentStrategy;
}(BaseDeploymentStrategy_1.BaseDeploymentStrategy));
exports.OZDefenderDeploymentStrategy = OZDefenderDeploymentStrategy;
