"use strict";
exports.__esModule = true;
exports.Diamond = void 0;
var CallbackManager_1 = require("./CallbackManager");
var types_1 = require("../types");
var Diamond = /** @class */ (function () {
    function Diamond(config, repository) {
        this.facetSelectors = [];
        this.newDeployment = true;
        this.functionSelectorRegistry = new Map();
        this.newDeployedFacets = {};
        this.initializerRegistry = new Map();
        this.config = config;
        this.diamondName = config.diamondName;
        this.networkName = config.networkName || "hardhat";
        this.chainId = config.chainId || 31337;
        this.deploymentsPath = config.deploymentsPath || "diamonds";
        this.contractsPath = config.contractsPath || "contracts";
        this.repository = repository;
        this.deploymentId = repository.getDeploymentId();
        // Load existing deployment info
        this.deployedDiamondData = this.repository.loadDeployedDiamondData();
        this.deployConfig = this.repository.loadDeployConfig();
        this.facetsConfig = this.deployConfig.facets;
        this.callbackManager = CallbackManager_1.CallbackManager.getInstance(this.diamondName, this.deploymentsPath);
        this._initializeFunctionSelectorRegistry(this);
    }
    Diamond.prototype._initializeFunctionSelectorRegistry = function (diamond) {
        var _a;
        var diamondConfig = diamond.getDiamondConfig();
        var deployedDiamondData = diamond.getDeployedDiamondData();
        var deployedFacets = deployedDiamondData.DeployedFacets || {};
        for (var _i = 0, _b = Object.entries(deployedFacets); _i < _b.length; _i++) {
            var _c = _b[_i], facetName = _c[0], _d = _c[1], contractAddress = _d.address, selectors = _d.funcSelectors;
            console.log(facetName);
            for (var _e = 0, _f = selectors; _e < _f.length; _e++) {
                var selector = _f[_e];
                this.functionSelectorRegistry.set(selector, {
                    facetName: facetName,
                    priority: ((_a = this.facetsConfig[facetName]) === null || _a === void 0 ? void 0 : _a.priority) || 1000,
                    address: contractAddress,
                    action: types_1.RegistryFacetCutAction.Deployed
                });
            }
        }
    };
    Diamond.prototype.registerFunctionSelectors = function (selectors) {
        var _this = this;
        Object.entries(selectors).forEach(function (_a) {
            var selector = _a[0], entry = _a[1];
            _this.functionSelectorRegistry.set(selector, entry);
        });
    };
    Diamond.prototype.updateFunctionSelectorRegistry = function (selector, entry) {
        this.functionSelectorRegistry.set(selector, entry);
    };
    Diamond.prototype.isFunctionSelectorRegistered = function (selector) {
        return this.functionSelectorRegistry.has(selector);
    };
    Diamond.prototype.getNewDeployedFacets = function () {
        return this.newDeployedFacets || {};
    };
    Diamond.prototype.updateNewDeployedFacets = function (facetName, facet) {
        this.newDeployedFacets[facetName] = facet;
    };
    Diamond.prototype.getDeployedDiamondData = function () {
        return this.deployedDiamondData;
    };
    Diamond.prototype.setDeployedDiamondData = function (data) {
        this.deployedDiamondData = data;
    };
    Diamond.prototype.updateDeployedDiamondData = function (data) {
        this.deployedDiamondData = data;
        this.repository.saveDeployedDiamondData(data);
    };
    Diamond.prototype.getDiamondConfig = function () {
        return this.config;
    };
    Diamond.prototype.getDeployConfig = function () {
        return this.deployConfig;
    };
    Diamond.prototype.getFacetsConfig = function () {
        return this.facetsConfig;
    };
    Diamond.prototype.setProvider = function (provider) {
        this.provider = provider;
    };
    Diamond.prototype.getProvider = function () {
        return this.provider;
    };
    Diamond.prototype.setSigner = function (signer) {
        this.signer = signer;
    };
    Diamond.prototype.getSigner = function () {
        return this.signer;
    };
    Diamond.prototype.isUpgradeDeployment = function () {
        return !!this.deployedDiamondData.DiamondAddress;
    };
    Diamond.prototype.registerInitializers = function (facetName, initFunction) {
        this.initializerRegistry.set(facetName, initFunction);
    };
    Diamond.prototype.setInitAddress = function (initAddress) {
        this.initAddress = initAddress;
    };
    Diamond.prototype.getInitAddress = function () {
        return this.initAddress;
    };
    Diamond.instances = new Map();
    return Diamond;
}());
exports.Diamond = Diamond;
exports["default"] = Diamond;
