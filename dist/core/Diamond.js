"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diamond = void 0;
const path_1 = require("path");
const CallbackManager_1 = require("./CallbackManager");
const types_1 = require("../types");
class Diamond {
    static instances = new Map();
    diamondName;
    networkName;
    chainId;
    deploymentsPath;
    contractsPath;
    diamondAbiPath;
    diamondAbiFileName;
    deploymentId;
    facetSelectors = [];
    callbackManager;
    deployedDiamondData;
    config;
    facetsConfig;
    repository;
    signer;
    provider;
    deployConfig;
    newDeployment = true;
    initAddress;
    constructor(config, repository) {
        this.config = config;
        this.diamondName = config.diamondName;
        this.networkName = config.networkName || "hardhat";
        this.chainId = config.chainId || 31337;
        this.deploymentsPath = config.deploymentsPath || "diamonds";
        this.contractsPath = config.contractsPath || "contracts";
        this.diamondAbiFileName = config.diamondAbiFileName || config.diamondName;
        // Set diamond ABI path - default to diamond-abi subdirectory of configFilePath directory
        if (config.diamondAbiPath) {
            this.diamondAbiPath = config.diamondAbiPath;
        }
        else {
            const configDir = config.configFilePath
                ? config.configFilePath.replace(/\/[^\/]*$/, '') // Remove filename from path
                : (0, path_1.join)(this.deploymentsPath, config.diamondName);
            this.diamondAbiPath = (0, path_1.join)(configDir, 'diamond-abi');
        }
        this.repository = repository;
        this.deploymentId = repository.getDeploymentId();
        // Load existing deployment info
        this.deployedDiamondData = this.repository.loadDeployedDiamondData();
        this.deployConfig = this.repository.loadDeployConfig();
        this.facetsConfig = this.deployConfig.facets;
        this.callbackManager = CallbackManager_1.CallbackManager.getInstance(this.diamondName, this.deploymentsPath);
        this._initializeFunctionSelectorRegistry(this);
    }
    functionSelectorRegistry = new Map();
    _initializeFunctionSelectorRegistry(diamond) {
        const diamondConfig = diamond.getDiamondConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const deployedFacets = deployedDiamondData.DeployedFacets || {};
        for (const [facetName, { address: contractAddress, funcSelectors: selectors }] of Object.entries(deployedFacets)) {
            console.log(facetName);
            for (const selector of selectors) {
                this.functionSelectorRegistry.set(selector, {
                    facetName,
                    priority: this.facetsConfig[facetName]?.priority || 1000,
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
    newDeployedFacets = {};
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
        this.deployedDiamondData = data;
        this.repository.saveDeployedDiamondData(data);
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
    initializerRegistry = new Map();
    registerInitializers(facetName, initFunction) {
        this.initializerRegistry.set(facetName, initFunction);
    }
    setInitAddress(initAddress) {
        this.initAddress = initAddress;
    }
    getInitAddress() {
        return this.initAddress;
    }
    getDiamondAbiPath() {
        return this.diamondAbiPath;
    }
    getDiamondAbiFileName() {
        return this.diamondAbiFileName;
    }
    getDiamondAbiFilePath() {
        return (0, path_1.join)(this.diamondAbiPath, `${this.diamondAbiFileName}.json`);
    }
}
exports.Diamond = Diamond;
exports.default = Diamond;
//# sourceMappingURL=Diamond.js.map