"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diamond = void 0;
const CallbackManager_1 = require("./CallbackManager");
class Diamond {
    constructor(config, repository) {
        this.facetSelectors = [];
        this.selectorRegistry = new Set();
        this.initializerRegistry = new Map();
        this.config = config;
        this.diamondName = config.diamondName;
        this.networkName = config.networkName;
        this.chainId = config.chainId;
        this.deploymentsPath = config.deploymentsPath || "diamonds";
        this.contractsPath = config.contractsPath || "contracts";
        this.repository = repository;
        this.deploymentId = repository.getDeploymentId();
        // Load existing deployment info
        this.deployedDiamondData = this.repository.loadDeployedDiamondData();
        this.deployConfig = this.repository.loadDeployConfig();
        this.facetsConfig = this.deployConfig.facets;
        this.callbackManager = CallbackManager_1.CallbackManager.getInstance(this.diamondName, this.deploymentsPath);
    }
    getDeployedDiamondData() {
        return this.deployedDiamondData;
    }
    updateDeployedDiamondData(data) {
        this.repository.saveDeployedDiamondData(data);
        this.deployedDiamondData = data;
    }
    getDiamondConfig() {
        return this.config;
    }
    getDeployConfig() {
        return this.deployConfig;
    }
    getFacetsConfig() {
        return this.facetsConfig;
    }
    setProvider(provider) {
        this.provider = provider;
    }
    setSigner(signer) {
        this.signer = signer;
    }
    isUpgradeDeployment() {
        return !!this.deployedDiamondData.DiamondAddress;
    }
    registerSelectors(selectors) {
        selectors.forEach(selector => this.selectorRegistry.add(selector));
    }
    isSelectorRegistered(selector) {
        return this.selectorRegistry.has(selector);
    }
    registerInitializers(facetName, initFunction) {
        this.initializerRegistry.set(facetName, initFunction);
    }
}
exports.Diamond = Diamond;
Diamond.instances = new Map();
exports.default = Diamond;
//# sourceMappingURL=Diamond.js.map