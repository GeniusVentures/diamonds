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
    // Pre-hook for deploying the diamond (can be overridden by subclasses)
    async preDeployDiamond(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-deploy logic for diamond ${diamond.diamondName}`));
        }
        await this._preDeployDiamond(diamond);
    }
    async _preDeployDiamond(diamond) { }
    async deployDiamond(diamond) {
        await this.preDeployDiamond(diamond); // Pre-hook
        await this._deployDiamond(diamond); // Core logic
        await this.postDeployDiamond(diamond); // Post-hook
    }
    // Core logic for deploying the diamond
    async _deployDiamond(diamond) {
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
        diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
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
    // Post-hook for deploying the diamond (can be overridden by subclasses)
    async postDeployDiamond(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-deploy logic for diamond ${diamond.diamondName}`));
        }
        await this.postDeployDiamondTasks(diamond);
    }
    // Core logic for post-deploying the diamond (can be overridden by subclasses)
    async postDeployDiamondTasks(diamond) { }
    // Pre-hook for deploying facets
    async preDeployFacets(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-deploy logic for facets of diamond ${diamond.diamondName}`));
        }
        await this._preDeployFacets(diamond);
    }
    // Core logic for deploying facets (can be overridden by subclasses)
    async _preDeployFacets(diamond) { }
    // Base logic for Facet deployment
    async deployFacets(diamond) {
        await this.deployFacets(diamond);
    }
    // Post-hook for deploying facets (can be overridden by subclasses)
    async postDeployFacets(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-deploy logic for facets of diamond ${diamond.diamondName}`));
        }
    }
    // Core logic for deploying facets
    async _deployFacets(diamond) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
                const signer = diamond.getSigner();
                // const signerAddress = await signer.getAddress();
                const facetFactory = await hardhat_1.ethers.getContractFactory(facetName, { signer });
                const facetContract = await facetFactory.deploy();
                await facetContract.deployed();
                const deployedFacets = new Map();
                const availableVersions = Object.keys((_d = facetConfig.versions) !== null && _d !== void 0 ? _d : {}).map(Number);
                const facetSelectors = Object.keys(facetContract.interface.functions)
                    .map(fn => facetContract.interface.getSighash(fn));
                // Initializer function Registry
                const deployInit = ((_f = (_e = facetConfig.versions) === null || _e === void 0 ? void 0 : _e[upgradeVersion]) === null || _f === void 0 ? void 0 : _f.deployInit) || "";
                const upgradeInit = ((_h = (_g = facetConfig.versions) === null || _g === void 0 ? void 0 : _g[upgradeVersion]) === null || _h === void 0 ? void 0 : _h.upgradeInit) || "";
                const initFn = diamond.newDeployment ? deployInit : upgradeInit;
                if (initFn && facetName !== deployConfig.protocolInitFacet) {
                    diamond.initializerRegistry.set(facetName, initFn);
                }
                const newFacetData = {
                    priority: facetConfig.priority || 1000,
                    address: facetContract.address,
                    tx_hash: facetContract.deployTransaction.hash,
                    version: upgradeVersion,
                    funcSelectors: facetSelectors,
                    deployInclude: ((_k = (_j = facetConfig.versions) === null || _j === void 0 ? void 0 : _j[upgradeVersion]) === null || _k === void 0 ? void 0 : _k.deployInclude) || [],
                    deployExclude: ((_m = (_l = facetConfig.versions) === null || _l === void 0 ? void 0 : _l[upgradeVersion]) === null || _m === void 0 ? void 0 : _m.deployExclude) || [],
                    initFunction: initFn,
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
    // Pre-hook for updating function selector registry (can be overridden by subclasses)
    async preUpdateFunctionSelectorRegistry(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-update logic for function selector registry of diamond ${diamond.diamondName}`));
        }
    }
    // Post-hook for updating function selector registry (can be overridden by subclasses)
    async postUpdateFunctionSelectorRegistry(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-update logic for function selector registry of diamond ${diamond.diamondName}`));
        }
    }
    // 
    async _updateFunctionSelectorRegistry(diamond) {
        var _a;
        const registry = diamond.functionSelectorRegistry;
        const zeroAddress = hardhat_1.ethers.constants.AddressZero;
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
            /* ---------------- 4. Remove Old Function Selectors from facets -------------- */
            // Set functionselectors with the newFacetName and still different address to Remove
            for (const [selector, entry] of registry.entries()) {
                if (entry.facetName === newFacetName && entry.address !== currentFacetAddress) {
                    registry.set(selector, {
                        priority: entry.priority,
                        address: zeroAddress,
                        action: types_1.RegistryFacetCutAction.Remove,
                        facetName: newFacetName,
                    });
                }
            }
        }
        // `Remove` function selectors for facets no longer in config (deleted facets)
        const facetsConfig = diamond.getDeployConfig().facets;
        const facetNames = Object.keys(facetsConfig);
        for (const [selector, entry] of registry.entries()) {
            if (!facetNames.includes(entry.facetName)) {
                registry.set(selector, {
                    priority: entry.priority,
                    address: zeroAddress,
                    action: types_1.RegistryFacetCutAction.Remove,
                    facetName: entry.facetName,
                });
            }
        }
    }
    async performDiamondCut(diamond) {
        await this._performDiamondCut(diamond);
    }
    // Pre-hook for performing diamond cut (can be overridden by subclasses)
    async prePerformDiamondCut(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-diamond cut logic for diamond ${diamond.diamondName}`));
        }
    }
    // Post-hook for performing diamond cut (can be overridden by subclasses)
    async postPerformDiamondCut(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-diamond cut logic for diamond ${diamond.diamondName}`));
        }
    }
    // Core logic for performing diamond cut
    async _performDiamondCut(diamond) {
        var _a;
        const diamondSignerAddress = await ((_a = diamond.getSigner()) === null || _a === void 0 ? void 0 : _a.getAddress());
        hardhat_1.ethers.provider = diamond.getProvider();
        const signer = await hardhat_1.ethers.getSigner(diamondSignerAddress);
        const diamondContract = await hardhat_1.ethers.getContractAt("IDiamondCut", diamond.getDeployedDiamondData().DiamondAddress);
        const signerDiamondContract = diamondContract.connect(signer);
        const deployConfig = diamond.getDeployConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        // Setup initCallData with Atomic Protocol Intializer
        const [initCalldata, initAddress] = await this.getInitCalldata(diamond);
        // extract facet cuts from the selector registry 
        const facetCuts = await this.getFacetCuts(diamond);
        // Vaidate no orphaned selectors, i.e. 'Add', 'Replace' or 'Deployed' selectors with the same facetNames but different addresses
        await this.validateNoOrphanedSelectors(facetCuts);
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
            for (const cut of facetCuts) {
                console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
            }
            if (initAddress !== hardhat_1.ethers.constants.AddressZero) {
                console.log(chalk_1.default.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
            }
        }
        /* -------------------------- Perform the diamond cut -----------------------*/
        const chainId = await hardhat_1.ethers.provider.getNetwork();
        const facetSelectorCutMap = facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors }));
        const tx = await signerDiamondContract.diamondCut(facetSelectorCutMap, initAddress, initCalldata);
        const ifaceList = (0, utils_1.getDeployedFacetInterfaces)(deployedDiamondData);
        // Log the transaction
        if (this.verbose) {
            await (0, utils_1.logTx)(tx, "DiamondCut", ifaceList);
        }
        else {
            console.log(chalk_1.default.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
            await tx.wait();
        }
        /* --------------------- Update the deployed diamond data ------------------ */
        const txHash = tx.hash;
        await this.postDiamondCutDeployedDataUpdate(diamond, txHash);
        console.log(chalk_1.default.green(`✅ DiamondCut executed: ${tx.hash}`));
        for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
            console.log(chalk_1.default.blueBright(`▶ Running ${initFunction} from the ${facetName} facet`));
            const contract = await hardhat_1.ethers.getContractAt(facetName, diamondSignerAddress);
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
    async getInitCalldata(diamond) {
        var _a, _b;
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const deployConfig = diamond.getDeployConfig();
        let initAddress = hardhat_1.ethers.constants.AddressZero;
        let initCalldata = "0x";
        const protocolInitFacet = deployConfig.protocolInitFacet || "";
        const protocolVersion = deployConfig.protocolVersion;
        const protocolFacetInfo = diamond.getNewDeployedFacets()[protocolInitFacet];
        if (protocolInitFacet && protocolFacetInfo) {
            const versionCfg = (_b = (_a = deployConfig.facets[protocolInitFacet]) === null || _a === void 0 ? void 0 : _a.versions) === null || _b === void 0 ? void 0 : _b[protocolVersion];
            const initFn = diamond.newDeployment ? versionCfg === null || versionCfg === void 0 ? void 0 : versionCfg.deployInit : versionCfg === null || versionCfg === void 0 ? void 0 : versionCfg.upgradeInit;
            if (initFn) {
                const iface = new hardhat_1.ethers.utils.Interface([`function ${initFn}`]);
                initAddress = protocolFacetInfo.address;
                initCalldata = iface.encodeFunctionData(initFn);
                if (this.verbose) {
                    console.log(chalk_1.default.cyan(`🔧 Using protocol-wide initializer: ${protocolInitFacet}.${initFn}()`));
                }
            }
        }
        if (initAddress === hardhat_1.ethers.constants.AddressZero) {
            console.log(chalk_1.default.yellow(`⚠️ No protocol-wide initializer found. Using zero address.`));
        }
        await diamond.setInitAddress(protocolFacetInfo.address);
        return [initCalldata, initAddress];
    }
    async getFacetCuts(diamond) {
        const deployConfig = diamond.getDeployConfig();
        const selectorRegistry = diamond.functionSelectorRegistry;
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
        return facetCuts;
    }
    async validateNoOrphanedSelectors(facetCuts) {
        // Vaidate no orphaned selectors, i.e. 'Add', 'Replace' or 'Deployed' selectors with the same facetNames but different addresses
        const orphanedSelectors = facetCuts.filter(facetCut => {
            return facetCuts.some(otherFacetCut => {
                return (otherFacetCut.facetAddress !== facetCut.facetAddress &&
                    otherFacetCut.name === facetCut.name &&
                    (otherFacetCut.action === types_1.RegistryFacetCutAction.Add ||
                        otherFacetCut.action === types_1.RegistryFacetCutAction.Replace ||
                        otherFacetCut.action === types_1.RegistryFacetCutAction.Deployed));
            });
        });
        if (orphanedSelectors.length > 0) {
            console.error(chalk_1.default.redBright(`❌ Orphaned selectors found for facet ${orphanedSelectors[0].name} at address ${orphanedSelectors[0].facetAddress}`));
            console.error(chalk_1.default.redBright(`  - ${orphanedSelectors[0].functionSelectors}`));
            throw new Error(`Orphaned selectors found for facet ${orphanedSelectors[0].name} at address ${orphanedSelectors[0].facetAddress}`);
        }
    }
    async postDiamondCutDeployedDataUpdate(diamond, txHash) {
        var _a, _b, _c, _d;
        const deployConfig = diamond.getDeployConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const selectorRegistry = diamond.functionSelectorRegistry;
        const currentVersion = (_a = deployedDiamondData.protocolVersion) !== null && _a !== void 0 ? _a : 0;
        deployedDiamondData.protocolVersion = deployConfig.protocolVersion;
        // Update the deployed diamond data with the new facet addresses and the function selectors from the registry
        for (const [selector, entry] of selectorRegistry.entries()) {
            const facetName = entry.facetName;
            const facetAddress = entry.address;
            const action = entry.action;
            if (action === types_1.RegistryFacetCutAction.Add || action === types_1.RegistryFacetCutAction.Replace) {
                const funcSelector = ((_b = deployedDiamondData.DeployedFacets[facetName]) === null || _b === void 0 ? void 0 : _b.funcSelectors) || [];
                if (!funcSelector.includes(selector)) {
                    funcSelector.push(selector);
                }
                deployedDiamondData.DeployedFacets[facetName] = {
                    address: facetAddress,
                    tx_hash: txHash,
                    version: currentVersion,
                    funcSelectors: [selector],
                };
            }
            else if (action === types_1.RegistryFacetCutAction.Remove) {
                // Remove the function selector from the facet
                const funcSelector = ((_c = deployedDiamondData.DeployedFacets[facetName]) === null || _c === void 0 ? void 0 : _c.funcSelectors) || [];
                if (funcSelector.includes(selector)) {
                    funcSelector.splice(funcSelector.indexOf(selector), 1);
                }
            }
        }
        // If a facet has no function selectors, remove it from the deployed facets
        for (const [facetName, facetData] of Object.entries(deployedDiamondData.DeployedFacets)) {
            if (!facetData.funcSelectors || ((_d = facetData.funcSelectors) === null || _d === void 0 ? void 0 : _d.length) === 0) {
                delete deployedDiamondData.DeployedFacets[facetName];
            }
        }
        diamond.updateDeployedDiamondData(deployedDiamondData);
    }
    async runPostDeployCallbacks(diamond) {
        await this._runPostDeployCallbacks(diamond);
    }
    // Pre-hook for running post-deployment callbacks (can be overridden by subclasses)
    async preRunPostDeployCallbacks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-post-deploy logic for diamond ${diamond.diamondName}`));
        }
    }
    // Post-hook for running post-deployment callbacks (can be overridden by subclasses)
    async postRunPostDeployCallbacks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-post-deploy logic for diamond ${diamond.diamondName}`));
        }
    }
    // Core logic for running post-deployment callbacks
    async _runPostDeployCallbacks(diamond) {
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