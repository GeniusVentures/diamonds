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
        var _a, _b, _c, _d, _e, _f, _g;
        const facetsConfig = diamond.getFacetsConfig();
        const deployedInfo = diamond.getDeployInfo();
        const facetCuts = [];
        const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
            return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
        });
        for (const facetName of sortedFacetNames) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = ((_b = (_a = deployedInfo.FacetDeployedInfo) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) || 0;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const upgradeVersion = Math.max(...availableVersions);
            if (upgradeVersion > deployedVersion || !((_c = deployedInfo.FacetDeployedInfo) === null || _c === void 0 ? void 0 : _c[facetName])) {
                console.log(chalk_1.default.blueBright(`🚀 Deploying/upgrading facet: ${facetName} to version ${upgradeVersion}`));
                const facetFactory = await hardhat_1.ethers.getContractFactory(facetName, diamond.deployer);
                const facetContract = await facetFactory.deploy();
                await facetContract.deployed();
                const allSelectors = Object.keys(facetContract.interface.functions).map(fn => facetContract.interface.getSighash(fn));
                const existingSelectors = ((_e = (_d = deployedInfo.FacetDeployedInfo) === null || _d === void 0 ? void 0 : _d[facetName]) === null || _e === void 0 ? void 0 : _e.funcSelectors) || [];
                const newSelectors = allSelectors.filter(sel => !diamond.selectorRegistry.has(sel));
                const removedSelectors = existingSelectors.filter(sel => !newSelectors.includes(sel));
                const replacedSelectors = newSelectors.filter(sel => existingSelectors.includes(sel));
                const addedSelectors = newSelectors.filter(sel => !existingSelectors.includes(sel));
                const facetVersionConfig = (_f = facetConfig.versions) === null || _f === void 0 ? void 0 : _f[upgradeVersion];
                const initFunc = (_g = facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.deployInit) !== null && _g !== void 0 ? _g : facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.upgradeInit;
                const initFuncSelector = initFunc ? (0, common_1.getSighash)(`function ${initFunc}`) : undefined;
                if (this.verbose) {
                    console.log(chalk_1.default.magentaBright(`🧩 Facet: ${facetName}`));
                    console.log(chalk_1.default.gray(`  - Upgrade Version: ${upgradeVersion}`));
                    console.log(chalk_1.default.green(`  - Added Selectors:`), addedSelectors);
                    console.log(chalk_1.default.yellow(`  - Replaced Selectors:`), replacedSelectors);
                    console.log(chalk_1.default.red(`  - Removed Selectors:`), removedSelectors);
                    if (initFuncSelector)
                        console.log(chalk_1.default.cyan(`  - Init Function Selector: ${initFuncSelector}`));
                }
                if (removedSelectors.length > 0) {
                    facetCuts.push({
                        facetAddress: hardhat_1.ethers.constants.AddressZero,
                        action: types_1.FacetCutAction.Remove,
                        functionSelectors: removedSelectors,
                        name: facetName,
                        version: upgradeVersion
                    });
                }
                if (addedSelectors.length) {
                    facetCuts.push({
                        facetAddress: facetContract.address,
                        action: types_1.FacetCutAction.Add,
                        functionSelectors: addedSelectors,
                        name: facetName,
                        initFunc: initFuncSelector,
                        version: upgradeVersion
                    });
                }
                if (replacedSelectors.length) {
                    facetCuts.push({
                        facetAddress: facetContract.address,
                        action: types_1.FacetCutAction.Replace,
                        functionSelectors: replacedSelectors,
                        name: facetName,
                        initFunc: initFuncSelector,
                        version: upgradeVersion
                    });
                }
                deployedInfo.FacetDeployedInfo = deployedInfo.FacetDeployedInfo || {};
                deployedInfo.FacetDeployedInfo[facetName] = {
                    address: facetContract.address,
                    tx_hash: facetContract.deployTransaction.hash,
                    version: upgradeVersion,
                    funcSelectors: newSelectors,
                };
                diamond.registerSelectors(newSelectors);
                console.log(chalk_1.default.green(`✅ Facet ${facetName} deployed at ${facetContract.address}`));
            }
        }
        diamond.updateDeployInfo(deployedInfo);
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
        var _a, _b, _c, _d;
        const diamondContract = await hardhat_1.ethers.getContractAt("IDiamondCut", diamond.getDeployInfo().DiamondAddress, diamond.deployer);
        const deployConfig = diamond.getDeployConfig();
        const deployedInfo = diamond.getDeployInfo();
        let initAddress = hardhat_1.ethers.constants.AddressZero;
        let initCalldata = "0x";
        const protocolInitFacet = deployConfig.protocolInitFacet;
        const currentVersion = (_a = deployedInfo.protocolVersion) !== null && _a !== void 0 ? _a : -1;
        if (protocolInitFacet && deployConfig.protocolVersion > currentVersion) {
            const facetInfo = (_b = deployedInfo.FacetDeployedInfo) === null || _b === void 0 ? void 0 : _b[protocolInitFacet];
            const initFacetConfig = deployConfig.facets[protocolInitFacet];
            const versionConfig = (_c = initFacetConfig.versions) === null || _c === void 0 ? void 0 : _c[deployConfig.protocolVersion];
            const initFn = (_d = versionConfig === null || versionConfig === void 0 ? void 0 : versionConfig.deployInit) !== null && _d !== void 0 ? _d : versionConfig === null || versionConfig === void 0 ? void 0 : versionConfig.upgradeInit;
            if (initFn && facetInfo) {
                const iface = new hardhat_1.ethers.utils.Interface([`function ${initFn}`]);
                initAddress = facetInfo.address;
                initCalldata = iface.encodeFunctionData(initFn);
            }
        }
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
            for (const cut of facetCuts) {
                console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
                if (cut.initFunc)
                    console.log(chalk_1.default.cyan(`  Init:`), cut.initFunc);
            }
            if (initAddress !== hardhat_1.ethers.constants.AddressZero) {
                console.log(chalk_1.default.cyan(`Using ProtocolInitFacet ${protocolInitFacet} @ ${initAddress}`));
            }
        }
        const tx = await diamondContract.diamondCut(facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors })), initAddress, initCalldata);
        await tx.wait();
        deployedInfo.protocolVersion = deployConfig.protocolVersion;
        diamond.updateDeployInfo(deployedInfo);
        console.log(chalk_1.default.green(`✅ DiamondCut executed: ${tx.hash}`));
    }
}
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
//# sourceMappingURL=BaseDeploymentStrategy.js.map