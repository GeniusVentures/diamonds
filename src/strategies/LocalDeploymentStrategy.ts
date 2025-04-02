import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo, FacetCutAction } from "../types";
import { FacetDeployedInfoRecord, FacetsConfig } from "../schemas";
import { ethers } from "hardhat";
import { join } from "path";

export class LocalDeploymentStrategy implements DeploymentStrategy {
  async deployDiamond(diamond: Diamond): Promise<void> {
    console.log(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`);
    const diamondCutFactory = await ethers.getContractFactory("DiamondCutFacet", diamond.deployer!);
    const diamondCutFacet = await diamondCutFactory.deploy();
    await diamondCutFacet.deployed();

    const diamondArtifactName = `${diamond.diamondName}.sol:${diamond.diamondName}`;
    const diamondArtifactPath = join(
      diamond.contractsPath,
      diamondArtifactName,
    );
    const diamondFactory = await ethers.getContractFactory(diamondArtifactPath, diamond.deployer!);
    const diamondContract = await diamondFactory.deploy(diamond.deployer!.getAddress(), diamondCutFacet.address);
    await diamondContract.deployed();

    const info = diamond.getDeployInfo();
    info.DeployerAddress = await diamond.deployer!.getAddress();
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

    console.log(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`);
  }

  async deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]> {
    const facetsConfig = diamond.getFacetsConfig();
    const deployInfo = diamond.getDeployInfo();
    const facetCuts: FacetDeploymentInfo[] = [];

    for (const facetName in facetsConfig) {
      const facetConfig = facetsConfig[facetName];
      const deployedVersion = deployInfo.FacetDeployedInfo?.[facetName]?.version || 0;
      const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
      const upgradeVersion = Math.max(...availableVersions);

      if (upgradeVersion > deployedVersion || !deployInfo.FacetDeployedInfo?.[facetName]) {
        console.log(`🚀 Deploying/upgrading facet: ${facetName} to version ${upgradeVersion}`);
        const facetFactory = await ethers.getContractFactory(facetName, diamond.deployer);
        const facetContract = await facetFactory.deploy();
        await facetContract.deployed();

        const newSelectors = Object.keys(facetContract.interface.functions).map(fn => facetContract.interface.getSighash(fn));
        const existingSelectors = deployInfo.FacetDeployedInfo?.[facetName]?.funcSelectors || [];

        const selectorsToAdd = newSelectors.filter(sel => !existingSelectors.includes(sel));
        const selectorsToReplace = newSelectors.filter(sel => existingSelectors.includes(sel));

        const facetVersionConfig = facetsConfig[facetName].versions?.[1];
        const initFuncSelector = facetVersionConfig?.deployInit
          ? facetContract.interface.getSighash(facetVersionConfig.deployInit)
          : undefined;

        if (selectorsToAdd.length) {
          facetCuts.push({
            facetAddress: facetContract.address,
            action: FacetCutAction.Add,
            functionSelectors: selectorsToAdd,
            name: facetName,
            initFunc: initFuncSelector,
          });
        }

        if (selectorsToReplace.length) {
          facetCuts.push({
            facetAddress: facetContract.address,
            action: FacetCutAction.Replace,
            functionSelectors: selectorsToReplace,
            name: facetName,
            initFunc: initFuncSelector,
          });
        }

        deployInfo.FacetDeployedInfo = deployInfo.FacetDeployedInfo || {};
        deployInfo.FacetDeployedInfo[facetName] = {
          address: facetContract.address,
          tx_hash: facetContract.deployTransaction.hash,
          version: 1,
          funcSelectors: newSelectors,
        };

        diamond.registerSelectors(newSelectors);

        console.log(`✅ Facet ${facetName} deployed at ${facetContract.address}`);
      }
    }


    diamond.updateDeployInfo(deployInfo);
    return facetCuts;
  }

  async getFacetsAndSelectorsToRemove(
    existingFacets: FacetDeployedInfoRecord,
    newConfig: FacetsConfig
  ): Promise<FacetDeploymentInfo[]> {
    const selectorsToRemove: FacetDeploymentInfo[] = [];

    for (const deployedFacetName in existingFacets) {
      if (!(deployedFacetName in newConfig)) {
        selectorsToRemove.push({
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: existingFacets[deployedFacetName].funcSelectors || [],
          name: deployedFacetName,
        });
      }
    }
    return selectorsToRemove;
  }


  async performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void> {
    const diamondContract = await ethers.getContractAt("IDiamondCut", diamond.getDeployInfo().DiamondAddress!, diamond.deployer);

    const tx = await diamondContract.diamondCut(
      facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors })),
      ethers.constants.AddressZero,
      "0x"
    );
    await tx.wait();

    console.log(`✅ DiamondCut executed: ${tx.hash}`);
  }
}
