"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDeploymentStrategy = void 0;
const types_1 = require("../types");
const chalk_1 = __importDefault(require("chalk"));
const hardhat_1 = __importDefault(require("hardhat"));
require("@nomicfoundation/hardhat-ethers");
const ethers_1 = require("ethers");
const utils_1 = require("../utils");
class BaseDeploymentStrategy {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async preDeployDiamond(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-deploy logic for diamond ${diamond.diamondName}`));
        }
        await this.preDeployDiamondTasks(diamond);
    }
    async preDeployDiamondTasks(diamond) { }
    async deployDiamond(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Deploying diamond ${diamond.diamondName} with DiamondCutFacet...`));
        }
        await this.deployDiamondTasks(diamond);
    }
    async deployDiamondTasks(diamond) {
        console.log(chalk_1.default.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`));
        // Deploy the DiamondCutFacet - use contract mapping to get correct name
        const diamondCutContractName = await (0, utils_1.getContractName)("DiamondCutFacet", diamond);
        const diamondCutFactory = await hardhat_1.default.ethers.getContractFactory(diamondCutContractName, diamond.getSigner());
        const diamondCutFacet = await diamondCutFactory.deploy();
        await diamondCutFacet.waitForDeployment();
        // Deploy the Diamond - use contract mapping to get correct name
        const diamondContractName = await (0, utils_1.getDiamondContractName)(diamond.diamondName, diamond);
        const diamondFactory = await hardhat_1.default.ethers.getContractFactory(diamondContractName, diamond.getSigner());
        const diamondContract = await diamondFactory.deploy(await diamond.getSigner().getAddress(), await diamondCutFacet.getAddress());
        await diamondContract.waitForDeployment();
        // Get function selectors for DiamondCutFacet
        const diamondCutFacetFunctionSelectors = [];
        diamondCutFacet.interface.forEachFunction((func) => {
            diamondCutFacetFunctionSelectors.push(func.selector);
        });
        // Get addresses for later use
        const diamondCutFacetAddress = await diamondCutFacet.getAddress();
        const diamondContractAddress = await diamondContract.getAddress();
        // Register the DiamondCutFacet function selectors
        const diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce((acc, selector) => {
            acc[selector] = {
                facetName: "DiamondCutFacet",
                priority: diamond.getFacetsConfig()?.DiamondCutFacet?.priority || 1000, // Default priority if not set
                address: diamondCutFacetAddress,
                action: types_1.RegistryFacetCutAction.Deployed,
            };
            return acc;
        }, {});
        diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
        // Update deployed diamond data
        const deployedDiamondData = diamond.getDeployedDiamondData();
        deployedDiamondData.DeployerAddress = await diamond.getSigner().getAddress();
        deployedDiamondData.DiamondAddress = diamondContractAddress;
        deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
        deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
            address: diamondCutFacetAddress,
            tx_hash: diamondCutFacet.deploymentTransaction()?.hash || "",
            version: 0,
            funcSelectors: diamondCutFacetFunctionSelectors,
        };
        diamond.updateDeployedDiamondData(deployedDiamondData);
        console.log(chalk_1.default.green(`✅ Diamond deployed at ${await diamondContract.getAddress()}, DiamondCutFacet at ${await diamondCutFacet.getAddress()}`));
    }
    async postDeployDiamond(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-deploy logic for diamond ${diamond.diamondName}`));
        }
        await this.postDeployDiamondTasks(diamond);
    }
    async postDeployDiamondTasks(diamond) { }
    async preDeployFacets(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-deploy logic for facets of diamond ${diamond.diamondName}`));
        }
        await this.preDeployFacetsTasks(diamond);
    }
    async preDeployFacetsTasks(diamond) {
        // This can be overridden by subclasses for custom pre-deploy logic
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 No pre-deploy tasks defined for facets of diamond ${diamond.diamondName}`));
        }
    }
    async deployFacets(diamond) {
        await this.deployFacetsTasks(diamond);
    }
    async deployFacetsTasks(diamond) {
        const deployConfig = diamond.getDeployConfig();
        const facetsConfig = diamond.getDeployConfig().facets;
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const deployedFacets = deployedDiamondData.DeployedFacets || {};
        const facetCuts = [];
        const sortedFacetNames = Object.keys(deployConfig.facets)
            .sort((a, b) => {
            return (deployConfig.facets[a].priority || 1000) - (deployConfig.facets[b].priority || 1000);
        });
        // Save the facet deployment info
        for (const facetName of sortedFacetNames) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = deployedDiamondData.DeployedFacets?.[facetName]?.version ?? -1;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const upgradeVersion = Math.max(...availableVersions);
            if (upgradeVersion > deployedVersion || deployedVersion === -1) {
                if (this.verbose) {
                    console.log(chalk_1.default.blueBright(`🚀 Deploying facet: ${facetName} to version ${upgradeVersion}`));
                }
                // Deploy the facet contract - use contract mapping to get correct name
                const signer = diamond.getSigner();
                const facetContractName = await (0, utils_1.getContractName)(facetName, diamond);
                const facetFactory = await hardhat_1.default.ethers.getContractFactory(facetContractName, { signer });
                const facetContract = await facetFactory.deploy();
                await facetContract.waitForDeployment();
                const deployedFacets = new Map();
                const availableVersions = Object.keys(facetConfig.versions ?? {}).map(Number);
                const facetSelectors = [];
                facetContract.interface.forEachFunction((func) => {
                    facetSelectors.push(func.selector);
                });
                // Initializer function Registry
                const deployInit = facetConfig.versions?.[upgradeVersion]?.deployInit || "";
                const upgradeInit = facetConfig.versions?.[upgradeVersion]?.upgradeInit || "";
                const initFn = diamond.newDeployment ? deployInit : upgradeInit;
                if (initFn && facetName !== deployConfig.protocolInitFacet) {
                    diamond.initializerRegistry.set(facetName, initFn);
                }
                const newFacetData = {
                    priority: facetConfig.priority || 1000,
                    address: await facetContract.getAddress(),
                    tx_hash: facetContract.deploymentTransaction()?.hash || "",
                    version: upgradeVersion,
                    funcSelectors: facetSelectors,
                    deployInclude: facetConfig.versions?.[upgradeVersion]?.deployInclude || [],
                    deployExclude: facetConfig.versions?.[upgradeVersion]?.deployExclude || [],
                    initFunction: initFn,
                    verified: false,
                };
                diamond.updateNewDeployedFacets(facetName, newFacetData);
                console.log(chalk_1.default.cyan(`⛵ ${facetName} deployed at ${await facetContract.getAddress()} with ${facetSelectors.length} selectors.`));
                // Log the deployment transaction and selectors
                if (this.verbose) {
                    console.log(chalk_1.default.gray(`  Selectors:`), facetSelectors);
                }
            }
        }
    }
    async postDeployFacets(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-deploy logic for facets of diamond ${diamond.diamondName}`));
        }
        await this.postDeployFacetsTasks(diamond);
    }
    // Used by subclasses for facet post-deployment tasks
    async postDeployFacetsTasks(diamond) { }
    // Pre-hook for updating function selector registry (can be overridden by subclasses)
    async preUpdateFunctionSelectorRegistry(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-update logic for function selector registry of diamond ${diamond.diamondName}`));
        }
    }
    async preUpdateFunctionSelectorRegistryTasks(diamond) { }
    async updateFunctionSelectorRegistry(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Updating function selector registry for diamond ${diamond.diamondName}...`));
        }
        this.updateFunctionSelectorRegistryTasks(diamond);
    }
    async updateFunctionSelectorRegistryTasks(diamond) {
        const registry = diamond.functionSelectorRegistry;
        const zeroAddress = ethers_1.ethers.ZeroAddress;
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
                if (excludeFuncSelector in registry && registry.get(excludeFuncSelector)?.facetName === newFacetName) {
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
            /* ------------------ Replace Facet and Priority Resolution Pass ------------- */
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
            /* ---------------- Remove Old Function Selectors from facets -------------- */
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
    async postUpdateFunctionSelectorRegistry(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-update logic for function selector registry of diamond ${diamond.diamondName}`));
        }
    }
    async prePerformDiamondCut(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-diamond cut logic for diamond ${diamond.diamondName}`));
        }
        await this.prePerformDiamondCutTasks(diamond);
    }
    async prePerformDiamondCutTasks(diamond) {
        // This can be overridden by subclasses for custom pre-diamond cut logic
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 No pre-diamond cut tasks defined for diamond ${diamond.diamondName}`));
        }
    }
    async performDiamondCut(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing diamond cut for diamond ${diamond.diamondName}...`));
        }
        await this.performDiamondCutTasks(diamond);
    }
    async performDiamondCutTasks(diamond) {
        const diamondSignerAddress = await diamond.getSigner()?.getAddress();
        const signer = await hardhat_1.default.ethers.getSigner(diamondSignerAddress);
        const diamondContract = await hardhat_1.default.ethers.getContractAt("IDiamondCut", diamond.getDeployedDiamondData().DiamondAddress);
        const signerDiamondContract = diamondContract.connect(signer);
        const deployConfig = diamond.getDeployConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        // Setup initCallData with Atomic Protocol Initializer
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
            if (initAddress !== ethers_1.ethers.ZeroAddress) {
                console.log(chalk_1.default.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
            }
        }
        /* -------------------------- Perform the diamond cut -----------------------*/
        const facetSelectorCutMap = facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors }));
        const tx = await signerDiamondContract.diamondCut(facetSelectorCutMap, initAddress, initCalldata);
        /* --------------------- Update the deployed diamond data ------------------ */
        const txHash = tx.hash;
        await this.postDiamondCutDeployedDataUpdate(diamond, txHash);
        const ifaceList = (0, utils_1.getDeployedFacetInterfaces)(deployedDiamondData);
        // Log the transaction
        if (this.verbose) {
            await (0, utils_1.logTx)(tx, "DiamondCut", ifaceList);
        }
        else {
            console.log(chalk_1.default.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
            await tx.wait();
        }
        console.log(chalk_1.default.green(`✅ DiamondCut executed: ${tx.hash}`));
        for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
            console.log(chalk_1.default.blueBright(`▶ Running ${initFunction} from the ${facetName} facet`));
            // const contract = await ethers.getContractAt(facetName, diamondSignerAddress!);
            const facetContractName = await (0, utils_1.getContractName)(facetName, diamond);
            const initContract = await hardhat_1.default.ethers.getContractAt(facetContractName, diamond.getDeployedDiamondData().DiamondAddress);
            const signerDiamondContract = initContract.connect(signer);
            const tx = await initContract[initFunction]();
            // const tx = await signerDiamondContract.initFunction;
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
    async postPerformDiamondCut(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-diamond cut logic for diamond ${diamond.diamondName}`));
        }
        await this.postPerformDiamondCutTasks(diamond);
    }
    async postPerformDiamondCutTasks(diamond) { }
    async getInitCalldata(diamond) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const deployConfig = diamond.getDeployConfig();
        let initAddress = ethers_1.ethers.ZeroAddress;
        let initCalldata = "0x";
        const protocolInitFacet = deployConfig.protocolInitFacet || "";
        const protocolVersion = deployConfig.protocolVersion;
        const protocolFacetInfo = diamond.getNewDeployedFacets()[protocolInitFacet];
        if (protocolInitFacet && protocolFacetInfo) {
            const versionCfg = deployConfig.facets[protocolInitFacet]?.versions?.[protocolVersion];
            const initFn = diamond.newDeployment ? versionCfg?.deployInit : versionCfg?.upgradeInit;
            if (initFn) {
                const iface = new ethers_1.ethers.Interface([`function ${initFn}`]);
                initAddress = protocolFacetInfo.address;
                initCalldata = iface.encodeFunctionData(initFn);
                if (this.verbose) {
                    console.log(chalk_1.default.cyan(`🔧 Using protocol-wide initializer: ${protocolInitFacet}.${initFn}()`));
                }
            }
        }
        if (initAddress === ethers_1.ethers.ZeroAddress) {
            console.log(chalk_1.default.yellow(`⚠️ No protocol-wide initializer found. Using zero address.`));
        }
        diamond.setInitAddress(initAddress);
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
        const deployConfig = diamond.getDeployConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const selectorRegistry = diamond.functionSelectorRegistry;
        const newDeployedFacets = diamond.getNewDeployedFacets();
        deployedDiamondData.protocolVersion = deployConfig.protocolVersion;
        // Aggregate selectors for each facet
        const facetSelectorsMap = {};
        for (const [selector, entry] of selectorRegistry.entries()) {
            const facetName = entry.facetName;
            if (!facetSelectorsMap[facetName]) {
                facetSelectorsMap[facetName] = { address: entry.address, selectors: [] };
            }
            if (entry.action === types_1.RegistryFacetCutAction.Add || entry.action === types_1.RegistryFacetCutAction.Replace || entry.action === types_1.RegistryFacetCutAction.Deployed) {
                facetSelectorsMap[facetName].selectors.push(selector);
            }
        }
        // Update deployed facets with aggregated selectors
        deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
        for (const [facetName, { address, selectors }] of Object.entries(facetSelectorsMap)) {
            if (selectors.length > 0) {
                let facetVersion;
                if (newDeployedFacets[facetName]) {
                    // Use the version from newly deployed facet
                    facetVersion = newDeployedFacets[facetName].version;
                }
                else {
                    // For facets not in newDeployedFacets (like existing deployed facets),
                    // preserve their existing version or use 0 as default
                    facetVersion = deployedDiamondData.DeployedFacets[facetName]?.version ?? 0;
                }
                deployedDiamondData.DeployedFacets[facetName] = {
                    address,
                    tx_hash: txHash,
                    version: facetVersion,
                    funcSelectors: selectors,
                };
            }
        }
        // Remove facets with no selectors
        for (const facetName of Object.keys(deployedDiamondData.DeployedFacets)) {
            if (!facetSelectorsMap[facetName] || facetSelectorsMap[facetName].selectors.length === 0) {
                delete deployedDiamondData.DeployedFacets[facetName];
            }
        }
        diamond.updateDeployedDiamondData(deployedDiamondData);
    }
    async preRunPostDeployCallbacks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`🔧 Running pre-post-deploy logic for diamond ${diamond.diamondName}`));
        }
    }
    async runPostDeployCallbacks(diamond) {
        await this.runPostDeployCallbacksTasks(diamond);
    }
    async runPostDeployCallbacksTasks(diamond) {
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
    async postRunPostDeployCallbacks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-post-deploy logic for diamond ${diamond.diamondName}`));
        }
    }
    async postRunPostDeployCallbacksTasks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.gray(`✅ Running post-post-deploy logic for diamond ${diamond.diamondName}`));
        }
    }
}
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
//# sourceMappingURL=BaseDeploymentStrategy.js.map