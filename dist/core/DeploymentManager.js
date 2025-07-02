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
exports.DeploymentManager = void 0;
var DeploymentManager = /** @class */ (function () {
    function DeploymentManager(diamond, strategy) {
        this.diamond = diamond;
        this.strategy = strategy;
    }
    DeploymentManager.prototype.deploy = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDE80 Starting deployment for Diamond: ".concat(this.diamond.diamondName));
                        this.diamond.newDeployment = true;
                        return [4 /*yield*/, this.strategy.preDeployDiamond(this.diamond)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.deployDiamond(this.diamond)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postDeployDiamond(this.diamond)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.preDeployFacets(this.diamond)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.deployFacets(this.diamond)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postDeployFacets(this.diamond)];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.preUpdateFunctionSelectorRegistry(this.diamond)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.updateFunctionSelectorRegistry(this.diamond)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postUpdateFunctionSelectorRegistry(this.diamond)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.prePerformDiamondCut(this.diamond)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.performDiamondCut(this.diamond)];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postPerformDiamondCut(this.diamond)];
                    case 12:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.preRunPostDeployCallbacks(this.diamond)];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.runPostDeployCallbacks(this.diamond)];
                    case 14:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postRunPostDeployCallbacks(this.diamond)];
                    case 15:
                        _a.sent();
                        console.log("\u2705 Deployment completed successfully.");
                        return [2 /*return*/];
                }
            });
        });
    };
    DeploymentManager.prototype.upgrade = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\u267B\uFE0F Starting upgrade for Diamond: ".concat(this.diamond.diamondName));
                        this.diamond.newDeployment = false;
                        return [4 /*yield*/, this.strategy.preDeployFacets(this.diamond)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.deployFacets(this.diamond)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postDeployFacets(this.diamond)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.preUpdateFunctionSelectorRegistry(this.diamond)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.updateFunctionSelectorRegistry(this.diamond)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postUpdateFunctionSelectorRegistry(this.diamond)];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.prePerformDiamondCut(this.diamond)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.performDiamondCut(this.diamond)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postPerformDiamondCut(this.diamond)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.preRunPostDeployCallbacks(this.diamond)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.runPostDeployCallbacks(this.diamond)];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, this.strategy.postRunPostDeployCallbacks(this.diamond)];
                    case 12:
                        _a.sent();
                        console.log("\u2705 Upgrade completed successfully.");
                        return [2 /*return*/];
                }
            });
        });
    };
    return DeploymentManager;
}());
exports.DeploymentManager = DeploymentManager;
