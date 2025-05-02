"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDeploymentStrategy = void 0;
const types_1 = require("../types");
const hardhat_1 = require("hardhat");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils");
class BaseDeploymentStrategy {
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async deployDiamond(diamond) {
        console.log(chalk_1.default.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`));
        // Deploy the DiamondCutFacet
        const diamondCutFactory = await hardhat_1.ethers.getContractFactory("DiamondCutFacet", diamond.getSigner());
        const diamondCutFacet = await diamondCutFactory.deploy();
        await diamondCutFacet.deployed();
        // Deploy the Diamond
        const diamondArtifactName = `${diamond.diamondName}.sol:${diamond.diamondName}`;
        const diamondArtifactPath = (0, path_1.join)(diamond.contractsPath, diamondArtifactName);
        const diamondFactory = await hardhat_1.ethers.getContractFactory(diamondArtifactPath, diamond.getSigner());
        const diamondContract = await diamondFactory.deploy(diamond.getSigner().getAddress(), diamondCutFacet.address);
        await diamondContract.deployed();
        // Get function selectors for DiamondCutFacet
        const diamondCutFacetFunctionSelectors = Object.keys(diamondCutFacet.interface.functions).map(fn => diamondCutFacet.interface.getSighash(fn));
        // Register the DiamondCutFacet function selectors
        const diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce((acc, selector) => {
            var _a, _b;
            acc[selector] = {
                facetName: "DiamondCutFacet",
                priority: ((_b = (_a = diamond.getFacetsConfig()) === null || _a === void 0 ? void 0 : _a.DiamondCutFacet) === null || _b === void 0 ? void 0 : _b.priority) || 1000,
                address: diamondCutFacet.address,
                action: types_1.RegistryFacetCutAction.Deployed,
            };
            return acc;
        }, {});
        // TODO This should be moved to deployFacets?
        diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
        // TODO move to NewDeployedFacets
        // Update deployed diamond data
        const deployedDiamondData = diamond.getDeployedDiamondData();
        deployedDiamondData.DeployerAddress = await diamond.getSigner().getAddress();
        deployedDiamondData.DiamondAddress = diamondContract.address;
        deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
        deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
            address: diamondCutFacet.address,
            tx_hash: diamondCutFacet.deployTransaction.hash,
            version: 0,
            funcSelectors: diamondCutFacetFunctionSelectors,
        };
        diamond.updateDeployedDiamondData(deployedDiamondData);
        console.log(chalk_1.default.green(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`));
    }
    async deployFacets(diamond) {
        await this._deployFacets(diamond);
    }
    async _deployFacets(diamond) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const deployConfig = diamond.getDeployConfig();
        const facetsConfig = diamond.getDeployConfig().facets;
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const deployedFacets = deployedDiamondData.DeployedFacets || {};
        const facetCuts = [];
        // const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
        //   return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
        // });
        const sortedFacetNames = Object.keys(deployConfig.facets)
            .sort((a, b) => {
            return (deployConfig.facets[a].priority || 1000) - (deployConfig.facets[b].priority || 1000);
        });
        // Save the facet deployment info
        for (const facetName of sortedFacetNames) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = (_c = (_b = (_a = deployedDiamondData.DeployedFacets) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) !== null && _c !== void 0 ? _c : -1;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const upgradeVersion = Math.max(...availableVersions);
            if (upgradeVersion > deployedVersion || deployedVersion === -1) {
                if (this.verbose) {
                    console.log(chalk_1.default.blueBright(`🚀 Deploying facet: ${facetName} to version ${upgradeVersion}`));
                }
                // Deploy the facet contract
                const facetFactory = await hardhat_1.ethers.getContractFactory(facetName, hardhat_1.ethers.getSigner((_d = diamond.getSigner()) === null || _d === void 0 ? void 0 : _d.getAddress()));
                const facetContract = await facetFactory.deploy();
                await facetContract.deployed();
                const deployedFacets = new Map();
                const availableVersions = Object.keys((_e = facetConfig.versions) !== null && _e !== void 0 ? _e : {}).map(Number);
                const facetSelectors = Object.keys(facetContract.interface.functions)
                    .map(fn => facetContract.interface.getSighash(fn));
                const newFacetData = {
                    priority: facetConfig.priority || 1000,
                    address: facetContract.address,
                    tx_hash: facetContract.deployTransaction.hash,
                    version: upgradeVersion,
                    funcSelectors: facetSelectors,
                    deployInclude: ((_g = (_f = facetConfig.versions) === null || _f === void 0 ? void 0 : _f[upgradeVersion]) === null || _g === void 0 ? void 0 : _g.deployInclude) || [],
                    deployExclude: ((_j = (_h = facetConfig.versions) === null || _h === void 0 ? void 0 : _h[upgradeVersion]) === null || _j === void 0 ? void 0 : _j.deployExclude) || [],
                    initFunction: ((_l = (_k = facetConfig.versions) === null || _k === void 0 ? void 0 : _k[upgradeVersion]) === null || _l === void 0 ? void 0 : _l.deployInit) || "",
                    verified: false,
                };
                diamond.updateNewDeployedFacets(facetName, newFacetData);
                console.log(chalk_1.default.cyan(`⛵ Deployed at ${facetContract.address} with ${facetSelectors.length} selectors.`));
                // Log the deployment transaction and selectors
                if (this.verbose) {
                    console.log(chalk_1.default.gray(`  Selectors:`), facetSelectors);
                }
            }
        }
    }
    async updateFunctionSelectorRegistry(diamond) {
        this._updateFunctionSelectorRegistry(diamond);
    }
    async _updateFunctionSelectorRegistry(diamond) {
        var _a;
        const registry = diamond.functionSelectorRegistry;
        const newDeployedFacets = diamond.getNewDeployedFacets();
        const newDeployedFacetsByPriority = Object.entries(newDeployedFacets).sort(([, a], [, b]) => (a.priority || 1000) - (b.priority || 1000));
        for (const [newFacetName, newFacetData] of newDeployedFacetsByPriority) {
            const currentFacetAddress = newFacetData.address;
            const priority = newFacetData.priority;
            const functionSelectors = newFacetData.funcSelectors || [];
            const includeFuncSelectors = newFacetData.deployInclude || [];
            const excludeFuncSelectors = newFacetData.deployExclude || [];
            /* ------------------ Exclusion Filter ------------------ */
            for (const excludeFuncSelector of excludeFuncSelectors) {
                // remove from the facets functionSelectors
                if (excludeFuncSelector in functionSelectors) {
                    functionSelectors.splice(functionSelectors.indexOf(excludeFuncSelector), 1);
                }
                // update action to remove if excluded from registry where a previous deployment associated with facetname
                if (excludeFuncSelector in registry && ((_a = registry.get(excludeFuncSelector)) === null || _a === void 0 ? void 0 : _a.facetName) === newFacetName) {
                    const existing = registry.get(excludeFuncSelector);
                    if (existing && existing.facetName === newFacetName) {
                        registry.set(excludeFuncSelector, {
                            priority: priority,
                            address: currentFacetAddress,
                            action: types_1.RegistryFacetCutAction.Remove,
                            facetName: newFacetName,
                        });
                    }
                }
            }
            /* ------------ Higher Priority Split of Registry ------------------ */
            const registryHigherPrioritySplit = Array.from(registry.entries())
                .filter(([_, entry]) => entry.priority > priority)
                .reduce((acc, [selector, entry]) => {
                if (!acc[entry.facetName]) {
                    acc[entry.facetName] = [];
                }
                acc[entry.facetName].push(selector);
                return acc;
            }, {});
            /* ------------------ Inclusion Override Filter ------------------ */
            for (const includeFuncSelector of includeFuncSelectors) {
                // Force Replace if already registered by higher priority facet
                if (includeFuncSelector in registryHigherPrioritySplit) {
                    const higherPriorityFacet = Object.keys(registryHigherPrioritySplit).find(facetName => {
                        return registryHigherPrioritySplit[facetName].includes(includeFuncSelector);
                    });
                    if (higherPriorityFacet) {
                        registry.set(includeFuncSelector, {
                            priority: priority,
                            address: currentFacetAddress,
                            action: types_1.RegistryFacetCutAction.Replace,
                            facetName: newFacetName,
                        });
                    }
                }
                else {
                    // Add to the registry
                    registry.set(includeFuncSelector, {
                        priority: priority,
                        address: currentFacetAddress,
                        action: types_1.RegistryFacetCutAction.Add,
                        facetName: newFacetName,
                    });
                }
                // remove from the funcSels so it is not modified in Priority Resolution Pass
                if (includeFuncSelector in newDeployedFacets) {
                    const existing = newDeployedFacets[newFacetName];
                    if (existing && existing.funcSelectors) {
                        existing.funcSelectors.splice(existing.funcSelectors.indexOf(includeFuncSelector), 1);
                    }
                }
            }
            /* ------------------ 3. Replace Facet and Priority Resolution Pass ------------- */
            for (const selector of functionSelectors) {
                const existing = registry.get(selector);
                if (existing) {
                    const existingPriority = existing.priority;
                    if (existing.facetName === newFacetName) {
                        // Same facet, update the address
                        registry.set(selector, {
                            priority: priority,
                            address: currentFacetAddress,
                            action: types_1.RegistryFacetCutAction.Replace,
                            facetName: newFacetName,
                        });
                    }
                    else if (priority < existingPriority) {
                        // Current facet has higher priority, Replace it
                        registry.set(selector, {
                            priority: priority,
                            address: currentFacetAddress,
                            action: types_1.RegistryFacetCutAction.Replace,
                            facetName: newFacetName,
                        });
                    }
                }
                else {
                    // New selector, simply add
                    registry.set(selector, {
                        priority: priority,
                        address: currentFacetAddress,
                        action: types_1.RegistryFacetCutAction.Add,
                        facetName: newFacetName,
                    });
                }
            }
            /* ------------------ 4. Remove Old Function Selectors ------------------ */
            // Set functionselectors with the newFacetName and still different address to Remove
            for (const [selector, entry] of registry.entries()) {
                if (entry.facetName === newFacetName && entry.address !== currentFacetAddress) {
                    registry.set(selector, {
                        priority: entry.priority,
                        address: currentFacetAddress,
                        action: types_1.RegistryFacetCutAction.Remove,
                        facetName: newFacetName,
                    });
                }
            }
        }
    }
    async _runDiamondCut(diamond, registry) {
        // prepare facetCuts array based on selector registry, run diamondCut transaction
    }
    async _runInitializerRegistry(diamond) {
        // run post-deploy per-facet initializers if any registered
    }
    async performDiamondCut(diamond) {
        var _a, _b, _c, _d, _e;
        const diamondSignerwithAddress = await ((_a = diamond.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress());
        hardhat_1.ethers.provider = diamond.getProvider();
        const signer = await hardhat_1.ethers.getSigner(diamondSignerwithAddress);
        const diamondContract = await hardhat_1.ethers.getContractAt("IDiamondCut", diamond.getDeployedDiamondData().DiamondAddress);
        const signerDiamondContract = diamondContract.connect(signer);
        const deployConfig = diamond.getDeployConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const selectorRegistry = diamond.functionSelectorRegistry;
        // Atomic Intializer setup
        let initAddress = hardhat_1.ethers.constants.AddressZero;
        let initCalldata = "0x";
        const currentVersion = (_b = deployedDiamondData.protocolVersion) !== null && _b !== void 0 ? _b : 0;
        const protocolInitFacet = deployConfig.protocolInitFacet;
        // TODO Validate Init Func is being deployed  in registry
        if (protocolInitFacet && deployConfig.protocolVersion > currentVersion) {
            const facetInfo = (_c = deployedDiamondData.DeployedFacets) === null || _c === void 0 ? void 0 : _c[protocolInitFacet];
            const facetConfig = deployConfig.facets[protocolInitFacet];
            const versionConfig = (_d = facetConfig.versions) === null || _d === void 0 ? void 0 : _d[deployConfig.protocolVersion];
            const initFn = (_e = versionConfig === null || versionConfig === void 0 ? void 0 : versionConfig.deployInit) !== null && _e !== void 0 ? _e : versionConfig === null || versionConfig === void 0 ? void 0 : versionConfig.upgradeInit;
            if (initFn && facetInfo) {
                const iface = new hardhat_1.ethers.utils.Interface([`function ${initFn}`]);
                initAddress = facetInfo.address;
                initCalldata = iface.encodeFunctionData(initFn);
            }
        }
        /* -------------------------- Prepare the facet cuts -----------------------*/
        // extract facet cuts from the selector registry 
        const facetCuts = Array.from(selectorRegistry.entries())
            .filter(([_, entry]) => entry.action !== types_1.RegistryFacetCutAction.Deployed)
            .map(([selector, entry]) => {
            return {
                facetAddress: entry.address,
                action: entry.action,
                functionSelectors: [selector],
                name: entry.facetName,
            };
        });
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
            for (const cut of facetCuts) {
                console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
                // TODO add facetcuts
                // if (cut.initFunc) console.log(chalk.cyan(`  Init:`), cut.initFunc);
            }
            if (initAddress !== hardhat_1.ethers.constants.AddressZero) {
                console.log(chalk_1.default.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${protocolInitFacet} @ ${initAddress}`));
            }
        }
        /* -------------------------- Perform the diamond cut -----------------------*/
        const chainId = await hardhat_1.ethers.provider.getNetwork();
        const facetSelectorCutMap = facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors }));
        const tx = await signerDiamondContract.diamondCut(facetSelectorCutMap, initAddress, initCalldata);
        const ifaceList = (0, utils_1.getDeployedFacetInterfaces)(deployedDiamondData);
        if (this.verbose) {
            await (0, utils_1.logTx)(tx, "DiamondCut", ifaceList);
        }
        else {
            console.log(chalk_1.default.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
            await tx.wait();
        }
        deployedDiamondData.protocolVersion = deployConfig.protocolVersion;
        diamond.updateDeployedDiamondData(deployedDiamondData);
        console.log(chalk_1.default.green(`✅ DiamondCut executed: ${tx.hash}`));
        for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
            console.log(chalk_1.default.blueBright(`▶ Running ${initFunction} from the ${facetName} facet`));
            const contract = await hardhat_1.ethers.getContractAt(facetName, deployedDiamondData.DiamondAddress, signer);
            const tx = await contract[initFunction]();
            if (this.verbose) {
                (0, utils_1.logTx)(tx, `${facetName}.${initFunction}`, ifaceList);
            }
            else {
                console.log(chalk_1.default.blueBright(`🔄 Waiting for ${facetName}.${initFunction}} mined...`));
                await tx.wait();
            }
            console.log(chalk_1.default.green(`✅ ${facetName}.${initFunction} executed`));
        }
    }
    async runPostDeployCallbacks(diamond) {
        console.log(`🔄 Running post-deployment callbacks...`);
        const deployConfig = diamond.getDeployConfig();
        for (const [facetName, facetConfig] of Object.entries(deployConfig.facets)) {
            if (!facetConfig.versions)
                continue;
            for (const [version, config] of Object.entries(facetConfig.versions)) {
                if (config.callbacks) {
                    const args = {
                        diamond: diamond,
                    };
                    console.log(chalk_1.default.cyanBright(`Executing callback ${config.callbacks} for facet ${facetName}...`));
                    await diamond.callbackManager.executeCallback(facetName, config.callbacks, args);
                    console.log(chalk_1.default.magenta(`✅ Callback ${config.callbacks} executed for facet ${facetName}`));
                }
            }
        }
        console.log(chalk_1.default.greenBright `✅ All post-deployment callbacks executed.`);
    }
}
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
//# sourceMappingURL=BaseDeploymentStrategy.js.map