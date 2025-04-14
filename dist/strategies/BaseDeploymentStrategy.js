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
const common_1 = require("../utils/common");
class BaseDeploymentStrategy {
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    async deployDiamond(diamond) {
        console.log(chalk_1.default.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`));
        const diamondCutFactory = await hardhat_1.ethers.getContractFactory("DiamondCutFacet", diamond.deployer);
        const diamondCutFacet = await diamondCutFactory.deploy();
        await diamondCutFacet.deployed();
        console.log(chalk_1.default.green(`✅ DiamondCutFacet deployed at ${diamondCutFacet.address}`));
        const diamondArtifactName = `${diamond.diamondName}.sol:${diamond.diamondName}`;
        const diamondArtifactPath = (0, path_1.join)(diamond.contractsPath, diamondArtifactName);
        const diamondFactory = await hardhat_1.ethers.getContractFactory(diamondArtifactPath, diamond.deployer);
        const diamondContract = await diamondFactory.deploy(diamond.deployer.getAddress(), diamondCutFacet.address);
        await diamondContract.deployed();
        const diamondFunctionSelectors = Object.keys(diamondContract.interface.functions).map(fn => diamondContract.interface.getSighash(fn));
        diamond.registerSelectors(diamondFunctionSelectors);
        const info = diamond.getDeployInfo();
        info.DeployerAddress = await diamond.deployer.getAddress();
        info.DiamondAddress = diamondContract.address;
        const diamondCutFacetFunctionSelectors = Object.keys(diamondCutFacet.interface.functions).map(fn => diamondCutFacet.interface.getSighash(fn));
        info.FacetDeployedInfo = info.FacetDeployedInfo || {};
        info.FacetDeployedInfo["DiamondCutFacet"] = {
            address: diamondCutFacet.address,
            tx_hash: diamondCutFacet.deployTransaction.hash,
            version: 1,
            funcSelectors: diamondCutFacetFunctionSelectors,
        };
        diamond.updateDeployInfo(info);
        diamond.registerSelectors(diamondCutFacetFunctionSelectors);
        console.log(chalk_1.default.green(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`));
    }
    async deployFacets(diamond) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const facetsConfig = diamond.getFacetsConfig();
        const deployInfo = diamond.getDeployInfo();
        const facetCuts = [];
        const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
            return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
        });
        for (const facetName of sortedFacetNames) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = ((_b = (_a = deployInfo.FacetDeployedInfo) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) || -1;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const upgradeVersion = Math.max(...availableVersions);
            const existingSelectors = ((_d = (_c = deployInfo.FacetDeployedInfo) === null || _c === void 0 ? void 0 : _c[facetName]) === null || _d === void 0 ? void 0 : _d.funcSelectors) || [];
            // check if the facet has never been deployed on this chain and if it possibly has multiple intializers for various upgrades.
            if (upgradeVersion > deployedVersion && !((_e = deployInfo.FacetDeployedInfo) === null || _e === void 0 ? void 0 : _e[facetName])) {
                console.log(chalk_1.default.blueBright(`🚀 Deploying/upgrading facet: ${facetName} to version ${upgradeVersion}`));
                const facetFactory = await hardhat_1.ethers.getContractFactory(facetName, diamond.deployer);
                const facetContract = await facetFactory.deploy();
                await facetContract.deployed();
                const allSelectors = Object.keys(facetContract.interface.functions).map(fn => facetContract.interface.getSighash(fn));
                const newSelectors = allSelectors.filter(sel => !diamond.selectorRegistry.has(sel));
                const removedSelectors = existingSelectors.filter(sel => !newSelectors.includes(sel));
                const replacedSelectors = newSelectors.filter(sel => existingSelectors.includes(sel));
                const addedSelectors = newSelectors.filter(sel => !existingSelectors.includes(sel));
                const facetVersionConfig = (_f = facetConfig.versions) === null || _f === void 0 ? void 0 : _f[upgradeVersion];
                const initFuncSelector = (facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.deployInit)
                    ? (0, common_1.getSighash)(`function ${facetVersionConfig.deployInit}`)
                    : undefined;
                if (this.verbose) {
                    console.log(chalk_1.default.magentaBright(`🧩 Facet: ${facetName}`));
                    console.log(chalk_1.default.gray(`  - Deployed Version: ${upgradeVersion}`));
                    console.log(chalk_1.default.green(`  - Added Selectors:`), addedSelectors);
                    console.log(chalk_1.default.yellow(`  - Replaced Selectors:`), replacedSelectors);
                    console.log(chalk_1.default.red(`  - Removed Selectors:`), removedSelectors);
                    if (initFuncSelector)
                        console.log(chalk_1.default.cyan(`  - Init Function Selector for ${facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.deployInit}: ${initFuncSelector}`));
                }
                if (removedSelectors.length > 0) {
                    facetCuts.push({
                        facetAddress: hardhat_1.ethers.constants.AddressZero,
                        action: types_1.FacetCutAction.Remove,
                        functionSelectors: removedSelectors,
                        name: facetName,
                    });
                }
                if (addedSelectors.length) {
                    facetCuts.push({
                        facetAddress: facetContract.address,
                        action: types_1.FacetCutAction.Add,
                        functionSelectors: addedSelectors,
                        name: facetName,
                        initFunc: initFuncSelector,
                    });
                }
                if (replacedSelectors.length) {
                    facetCuts.push({
                        facetAddress: facetContract.address,
                        action: types_1.FacetCutAction.Replace,
                        functionSelectors: replacedSelectors,
                        name: facetName,
                        initFunc: initFuncSelector,
                    });
                }
                deployInfo.FacetDeployedInfo = deployInfo.FacetDeployedInfo || {};
                deployInfo.FacetDeployedInfo[facetName] = {
                    address: facetContract.address,
                    tx_hash: facetContract.deployTransaction.hash,
                    version: upgradeVersion,
                    funcSelectors: newSelectors,
                };
                diamond.registerSelectors(newSelectors);
                console.log(chalk_1.default.green(`✅ Facet ${facetName} deployed at ${facetContract.address}`));
            }
            else {
                console.log(chalk_1.default.yellowBright(`⚠️ Facet ${facetName} deployed at ${((_h = (_g = deployInfo.FacetDeployedInfo) === null || _g === void 0 ? void 0 : _g[facetName]) === null || _h === void 0 ? void 0 : _h.address) || 'unknown address'}, no upgrade, skipping new deployment.`));
                diamond.registerSelectors(existingSelectors);
            }
        }
        diamond.updateDeployInfo(deployInfo);
        return facetCuts;
    }
    async getFacetsAndSelectorsToRemove(existingFacets, newConfig) {
        const selectorsToRemove = [];
        for (const deployedFacetName in existingFacets) {
            if (!(deployedFacetName in newConfig)) {
                selectorsToRemove.push({
                    facetAddress: hardhat_1.ethers.constants.AddressZero,
                    action: types_1.FacetCutAction.Remove,
                    functionSelectors: existingFacets[deployedFacetName].funcSelectors || [],
                    name: deployedFacetName,
                });
            }
        }
        return selectorsToRemove;
    }
    async performDiamondCut(diamond, facetCuts) {
        const diamondContract = await hardhat_1.ethers.getContractAt("IDiamondCut", diamond.getDeployInfo().DiamondAddress, diamond.deployer);
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
            for (const cut of facetCuts) {
                console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
                if (cut.initFunc)
                    console.log(chalk_1.default.cyan(`  Init:`), cut.initFunc);
            }
        }
        const tx = await diamondContract.diamondCut(facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors })), hardhat_1.ethers.constants.AddressZero, "0x");
        await tx.wait();
        console.log(chalk_1.default.green(`✅ DiamondCut executed: ${tx.hash}`));
    }
}
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
//# sourceMappingURL=BaseDeploymentStrategy.js.map