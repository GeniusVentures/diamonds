"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRPCDeploymentStrategy = void 0;
const types_1 = require("../types");
const hardhat_1 = require("hardhat");
const path_1 = require("path");
class BaseRPCDeploymentStrategy {
    async deployDiamond(diamond) {
        console.log(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`);
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
        console.log(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`);
    }
    async deployFacets(diamond) {
        var _a, _b, _c, _d, _e, _f;
        const facetsConfig = diamond.getFacetsConfig();
        const deployInfo = diamond.getDeployInfo();
        const facetCuts = [];
        const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
            return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
        });
        for (const facetName in facetsConfig) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = ((_b = (_a = deployInfo.FacetDeployedInfo) === null || _a === void 0 ? void 0 : _a[facetName]) === null || _b === void 0 ? void 0 : _b.version) || 0;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const upgradeVersion = Math.max(...availableVersions);
            if (upgradeVersion > deployedVersion || !((_c = deployInfo.FacetDeployedInfo) === null || _c === void 0 ? void 0 : _c[facetName])) {
                console.log(`🚀 Deploying/upgrading facet: ${facetName} to version ${upgradeVersion}`);
                const facetFactory = await hardhat_1.ethers.getContractFactory(facetName, diamond.deployer);
                const facetContract = await facetFactory.deploy();
                await facetContract.deployed();
                const allSelectors = Object.keys(facetContract.interface.functions).map(fn => facetContract.interface.getSighash(fn));
                // for (const fn of Object.keys(facetContract.interface.functions)) {
                //   const hash = facetContract.interface.getSighash(fn);
                //   console.log(`Function: ${fn}, Hash: ${hash}`);
                // }
                const existingSelectors = ((_e = (_d = deployInfo.FacetDeployedInfo) === null || _d === void 0 ? void 0 : _d[facetName]) === null || _e === void 0 ? void 0 : _e.funcSelectors) || [];
                const newSelectors = allSelectors.filter(sel => !diamond.selectorRegistry.has(sel));
                const removedSelectors = existingSelectors.filter(sel => !newSelectors.includes(sel));
                const replacedSelectors = newSelectors.filter(sel => existingSelectors.includes(sel));
                const addedSelectors = newSelectors.filter(sel => !existingSelectors.includes(sel));
                const facetVersionConfig = (_f = facetsConfig[facetName].versions) === null || _f === void 0 ? void 0 : _f[1];
                const initFuncSelector = (facetVersionConfig === null || facetVersionConfig === void 0 ? void 0 : facetVersionConfig.deployInit)
                    ? facetContract.interface.getSighash(facetVersionConfig.deployInit)
                    : undefined;
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
                console.log(`✅ Facet ${facetName} deployed at ${facetContract.address}`);
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
        const tx = await diamondContract.diamondCut(facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors })), hardhat_1.ethers.constants.AddressZero, "0x");
        await tx.wait();
        console.log(`✅ DiamondCut executed: ${tx.hash}`);
    }
}
exports.BaseRPCDeploymentStrategy = BaseRPCDeploymentStrategy;
//# sourceMappingURL=BaseRPCDeploymentStrategy%20copy.js.map