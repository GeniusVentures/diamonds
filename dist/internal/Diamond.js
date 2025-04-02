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
        this.deploymentsPath = config.deploymentsPath;
        this.contractsPath = config.contractsPath;
        this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;
        this.repository = repository;
        const deployInfoPath = path_1.default.join(config.deploymentsPath, config.diamondName, `${this.deploymentId}.json`);
        // Load facets to deploy
        const facetsConfigPath = path_1.default.join(config.deploymentsPath, config.diamondName, "facets.json" // TODO change to diamond.config.json?
        );
        // Load existing deployment info
        this.deployInfo = this.repository.loadDeployInfo(deployInfoPath);
        this.facetsConfig = this.repository.loadFacetsConfig(facetsConfigPath);
        // Initialize the callback manager
        this.callbackManager = FacetCallbackManager_1.FacetCallbackManager.getInstance(this.diamondName, path_1.default.join(this.deploymentsPath, this.diamondName, "callbacks"));
    }
    getDeployInfo() {
        return this.deployInfo;
    }
    updateDeployInfo(info) {
        this.deployInfo = info;
        const deployInfoPath = path_1.default.join(this.deploymentsPath, this.diamondName, `${this.networkName}.json`);
        this.repository.saveDeployInfo(deployInfoPath, info);
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