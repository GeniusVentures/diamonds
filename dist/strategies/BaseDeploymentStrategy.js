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
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const deployConfig = diamond.getDeployConfig();
        const facetsConfig = deployConfig.facets;
        const deployedInfo = diamond.getDeployInfo();
        const facetCuts = [];
        const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
            return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
        });
        for (const facetName of sortedFacetNames) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = (_c = (_b = (_a = deployedInfo.FacetDeployedInfo) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) !== null && _c !== void 0 ? _c : -1;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const latestVersion = Math.max(...availableVersions);
            if (latestVersion > deployedVersion || deployedVersion === -1) {
                console.log(chalk_1.default.blueBright(`🚀 Deploying/upgrading facet: ${facetName} to version ${latestVersion}`));
                const facetFactory = await hardhat_1.ethers.getContractFactory(facetName, diamond.deployer);
                const facetContract = await facetFactory.deploy();
                await facetContract.deployed();
                const allSelectors = Object.keys(facetContract.interface.functions).map(fn => facetContract.interface.getSighash(fn));
                const existingSelectors = ((_e = (_d = deployedInfo.FacetDeployedInfo) === null || _d === void 0 ? void 0 : _d[facetName]) === null || _e === void 0 ? void 0 : _e.funcSelectors) || [];
                const newSelectors = allSelectors.filter(sel => !diamond.selectorRegistry.has(sel));
                const removedSelectors = existingSelectors.filter(sel => !newSelectors.includes(sel));
                const replacedSelectors = newSelectors.filter(sel => existingSelectors.includes(sel));
                const addedSelectors = newSelectors.filter(sel => !existingSelectors.includes(sel));
                if (this.verbose) {
                    console.log(chalk_1.default.magentaBright(`🧩 Facet: ${facetName}`));
                    console.log(chalk_1.default.gray(`  - Upgrade Version: ${latestVersion}`));
                    console.log(chalk_1.default.green(`  - Added Selectors:`), addedSelectors);
                    console.log(chalk_1.default.yellow(`  - Replaced Selectors:`), replacedSelectors);
                    console.log(chalk_1.default.red(`  - Removed Selectors:`), removedSelectors);
                }
                if (removedSelectors.length > 0) {
                    facetCuts.push({
                        facetAddress: hardhat_1.ethers.constants.AddressZero,
                        action: types_1.FacetCutAction.Remove,
                        functionSelectors: removedSelectors,
                        name: facetName,
                        version: latestVersion
                    });
                }
                if (addedSelectors.length) {
                    facetCuts.push({
                        facetAddress: facetContract.address,
                        action: types_1.FacetCutAction.Add,
                        functionSelectors: addedSelectors,
                        name: facetName,
                        version: latestVersion
                    });
                }
                if (replacedSelectors.length) {
                    facetCuts.push({
                        facetAddress: facetContract.address,
                        action: types_1.FacetCutAction.Replace,
                        functionSelectors: replacedSelectors,
                        name: facetName,
                        version: latestVersion
                    });
                }
                deployedInfo.FacetDeployedInfo = deployedInfo.FacetDeployedInfo || {};
                deployedInfo.FacetDeployedInfo[facetName] = {
                    address: facetContract.address,
                    tx_hash: facetContract.deployTransaction.hash,
                    version: latestVersion,
                    funcSelectors: newSelectors,
                };
                diamond.registerSelectors(newSelectors);
                // Do not add the protocolInitFacet to the Initializer registry
                if (facetName === deployConfig.protocolInitFacet)
                    continue;
                const facetVersionConfig = (_f = facetConfig.versions) === null || _f === void 0 ? void 0 : _f[latestVersion];
                const initFunc = (_g = facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.deployInit) !== null && _g !== void 0 ? _g : facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.upgradeInit;
                const initKey = deployedVersion === -1 ? "deployInit" : "upgradeInit";
                const initFunction = facetConfig.versions && ((_h = facetConfig.versions[latestVersion]) === null || _h === void 0 ? void 0 : _h[initKey]);
                if (initFunction) {
                    console.log(chalk_1.default.blueBright(`▶ Registering ${initKey} for facet ${facetName}: ${initFunction}`));
                    diamond.registerInitializers(facetName, initFunction);
                }
                console.log(chalk_1.default.green(`✅ Facet ${facetName} deployed at ${facetContract.address}`));
            }
        }
        diamond.updateDeployInfo(deployedInfo);
        return facetCuts;
    }
    async getFacetsAndSelectorsToRemove(
    // existingFacets: FacetDeployedInfoRecord,
    // newConfig: FacetsConfig
    diamond) {
        const existingFacets = diamond.getDeployInfo().FacetDeployedInfo;
        const newConfig = diamond.getFacetsConfig();
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
        const currentVersion = (_a = deployedInfo.protocolVersion) !== null && _a !== void 0 ? _a : 0;
        if (protocolInitFacet && deployConfig.protocolVersion > currentVersion) {
            const facetInfo = (_b = deployedInfo.FacetDeployedInfo) === null || _b === void 0 ? void 0 : _b[protocolInitFacet];
            const facetConfig = deployConfig.facets[protocolInitFacet];
            const versionConfig = (_c = facetConfig.versions) === null || _c === void 0 ? void 0 : _c[deployConfig.protocolVersion];
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
        for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
            console.log(chalk_1.default.blueBright(`▶ Running ${initFunction} from the ${facetName} facet`));
            const contract = await hardhat_1.ethers.getContractAt(facetName, deployedInfo.DiamondAddress, diamond.deployer);
            const tx = await contract[initFunction]();
            await tx.wait();
            console.log(chalk_1.default.green(`✅ ${facetName}.${initFunction} executed`));
        }
    }
}
exports.BaseDeploymentStrategy = BaseDeploymentStrategy;
//# sourceMappingURL=BaseDeploymentStrategy.js.map