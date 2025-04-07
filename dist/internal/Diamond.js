"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diamond = void 0;
const path_1 = __importDefault(require("path"));
const FacetCallbackManager_1 = require("./FacetCallbackManager");
class Diamond {
    constructor(config, repository) {
        this.facetSelectors = [];
        this.selectorRegistry = new Set();
        this.diamondName = config.diamondName;
        this.networkName = config.networkName;
        this.chainId = config.chainId;
        this.deploymentsPath = config.deploymentsPath || "diamonds";
        this.contractsPath = config.contractsPath || "contracts";
        this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;
        this.createNewDeploymentFile = config.createNewDeployFile || true;
        this.repository = repository;
        this.deployInfoFilePath = path_1.default.join(this.deploymentsPath, config.diamondName, `deployments/${this.deploymentId}.json`);
        // Load facets to deploy
        this.facetsConfigFilePath = path_1.default.join(this.deploymentsPath, config.diamondName, `${config.diamondName.toLowerCase()}.config.json`);
        // Load existing deployment info
        this.deployInfo = this.repository.loadDeployInfo(this.deployInfoFilePath, this.createNewDeploymentFile);
        this.facetsConfig = this.repository.loadFacetsConfig(this.facetsConfigFilePath);
        // Initialize the callback manager
        this.callbackManager = FacetCallbackManager_1.FacetCallbackManager.getInstance(this.diamondName, this.deploymentsPath);
    }
    getDeployInfo() {
        return this.deployInfo;
    }
    updateDeployInfo(info) {
        this.deployInfo = info;
        this.repository.saveDeployInfo(this.deployInfoFilePath, info);
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