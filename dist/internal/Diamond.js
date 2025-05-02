"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diamond = void 0;
const CallbackManager_1 = require("./CallbackManager");
const types_1 = require("../types");
class Diamond {
    constructor(config, repository) {
        this.facetSelectors = [];
        this.functionSelectorRegistry = new Map();
        this.newDeployedFacets = {};
        // public selectorRegistry: Set<string> = new Set();
        // public registerSelectors(selectors: string[]): void {
        //   selectors.forEach(selector => this.selectorRegistry.add(selector));
        // }
        // public isSelectorRegistered(selector: string): boolean {
        //   return this.selectorRegistry.has(selector);
        // }
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
    _initializeFunctionSelectorRegistry(diamond) {
        const diamondConfig = diamond.getDiamondConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const deployedFacets = deployedDiamondData.DeployedFacets || {};
        // Build the deployed function selectors based on the current state of the diamond
        const deployedFuncSelectors = Object.entries(diamondConfig)
            .flatMap(([facetName, facetConfig]) => {
            var _a;
            const deployedFacetFunctionSelectors = ((_a = deployedFacets[facetName]) === null || _a === void 0 ? void 0 : _a.funcSelectors) || [];
            const priority = facetConfig.priority || 1000;
            return deployedFacetFunctionSelectors.map(selector => ({
                selector,
                priority,
            }));
        })
            .sort((a, b) => a.priority - b.priority)
            .reduce((acc, { selector, priority }) => {
            acc[selector] = priority;
            return acc;
        }, {});
        for (const [facetName, { address: contractAddress, funcSelectors: selectors }] of Object.entries(deployedFacets)) {
            for (const selector of selectors) {
                this.functionSelectorRegistry.set(selector, {
                    facetName,
                    priority: deployedFuncSelectors[selector] || 1000,
                    address: contractAddress,
                    action: types_1.RegistryFacetCutAction.Deployed,
                });
            }
        }
    }
    registerFunctionSelectors(selectors) {
        Object.entries(selectors).forEach(([selector, entry]) => {
            this.functionSelectorRegistry.set(selector, entry);
        });
    }
    updateFunctionSelectorRegistry(selector, entry) {
        this.functionSelectorRegistry.set(selector, entry);
    }
    isFunctionSelectorRegistered(selector) {
        return this.functionSelectorRegistry.has(selector);
    }
    getNewDeployedFacets() {
        return this.newDeployedFacets || {};
    }
    updateNewDeployedFacets(facetName, facet) {
        this.newDeployedFacets[facetName] = facet;
    }
    getDeployedDiamondData() {
        return this.deployedDiamondData;
    }
    setDeployedDiamondData(data) {
        this.deployedDiamondData = data;
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
    getProvider() {
        return this.provider;
    }
    setSigner(signer) {
        this.signer = signer;
    }
    getSigner() {
        return this.signer;
    }
    isUpgradeDeployment() {
        return !!this.deployedDiamondData.DiamondAddress;
    }
    registerInitializers(facetName, initFunction) {
        this.initializerRegistry.set(facetName, initFunction);
    }
}
exports.Diamond = Diamond;
Diamond.instances = new Map();
exports.default = Diamond;
//# sourceMappingURL=Diamond.js.map