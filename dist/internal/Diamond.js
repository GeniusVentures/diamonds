"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diamond = void 0;
const path_1 = __importDefault(require("path"));
const CallbackManager_1 = require("./CallbackManager");
class Diamond {
    constructor(config, repository) {
        var _a;
        this.facetSelectors = [];
        this.selectorRegistry = new Set();
        this.config = config;
        this.diamondName = config.diamondName;
        this.networkName = config.networkName;
        this.chainId = config.chainId;
        this.deploymentsPath = config.deploymentsPath || "diamonds";
        this.contractsPath = config.contractsPath || "contracts";
        this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;
        this.createOrUpdateDeploymentFile = (_a = config.createOrUpdateDeployFile) !== null && _a !== void 0 ? _a : true;
        this.repository = repository;
        this.deployInfoFilePath = path_1.default.join(this.deploymentsPath, config.diamondName, `deployments/${this.deploymentId}.json`);
        // Load facets to deploy
        this.configFilePath = path_1.default.join(this.deploymentsPath, config.diamondName, `${config.diamondName.toLowerCase()}.config.json`);
        // Load existing deployment info
        this.deployInfo = this.repository.loadDeployInfo(this.deployInfoFilePath, this.createOrUpdateDeploymentFile);
        this.deployConfig = this.repository.loadDeployConfig(this.configFilePath);
        this.facetsConfig = this.deployConfig.facets;
        // Initialize the callback manager
        this.callbackManager = CallbackManager_1.CallbackManager.getInstance(this.diamondName, this.deploymentsPath);
    }
    getDeployInfo() {
        return this.deployInfo;
    }
    updateDeployInfo(info) {
        if (this.createOrUpdateDeploymentFile == true) {
            this.deployInfo = info;
            this.repository.saveDeployInfo(this.deployInfoFilePath, info);
        }
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
    isUpgradeDeployment() {
        return !!this.deployInfo.DiamondAddress;
    }
    registerSelectors(selectors) {
        selectors.forEach(selector => this.selectorRegistry.add(selector));
    }
    isSelectorRegistered(selector) {
        return this.selectorRegistry.has(selector);
    }
}
exports.Diamond = Diamond;
Diamond.instances = new Map();
exports.default = Diamond;
//# sourceMappingURL=Diamond.js.map