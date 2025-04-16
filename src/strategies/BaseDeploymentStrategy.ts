import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo, FacetCutAction } from "../types";
import { FacetDeployedInfoRecord, FacetsConfig, DeployConfig } from "../schemas";
import { ethers } from "hardhat";
import { join } from "path";
import chalk from "chalk";
import { getSighash } from "../utils/common";

export class BaseDeploymentStrategy implements DeploymentStrategy {
  constructor(protected verbose: boolean = false) { }

  async deployDiamond(diamond: Diamond): Promise<void> {
    console.log(chalk.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`));
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
    const diamondFunctionSelectors = Object.keys(diamondContract.interface.functions).map(fn => diamondContract.interface.getSighash(fn));
    diamond.registerSelectors(diamondFunctionSelectors);

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
    diamond.registerSelectors(diamondCutFacetFunctionSelectors);

    console.log(chalk.green(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`));
  }

  async deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]> {
    const facetsConfig = diamond.getFacetsConfig();
    const deployedInfo = diamond.getDeployInfo();
    const facetCuts: FacetDeploymentInfo[] = [];

    const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
      return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
    });

    for (const facetName of sortedFacetNames) {
      const facetConfig = facetsConfig[facetName];
      const deployedVersion = deployedInfo.FacetDeployedInfo?.[facetName]?.version || 0;
      const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
      const upgradeVersion = Math.max(...availableVersions);

      if (upgradeVersion > deployedVersion || !deployedInfo.FacetDeployedInfo?.[facetName]) {
        console.log(chalk.blueBright(`🚀 Deploying/upgrading facet: ${facetName} to version ${upgradeVersion}`));
        const facetFactory = await ethers.getContractFactory(facetName, diamond.deployer);
        const facetContract = await facetFactory.deploy();
        await facetContract.deployed();

        const allSelectors = Object.keys(facetContract.interface.functions).map(fn =>
          facetContract.interface.getSighash(fn)
        );

        const existingSelectors = deployedInfo.FacetDeployedInfo?.[facetName]?.funcSelectors || [];
        const newSelectors = allSelectors.filter(sel => !diamond.selectorRegistry.has(sel));
        const removedSelectors = existingSelectors.filter(sel => !newSelectors.includes(sel));
        const replacedSelectors = newSelectors.filter(sel => existingSelectors.includes(sel));
        const addedSelectors = newSelectors.filter(sel => !existingSelectors.includes(sel));

        const facetVersionConfig = facetConfig.versions?.[upgradeVersion];
        const initFunc = facetVersionConfig?.deployInit ?? facetVersionConfig?.upgradeInit;
        const initFuncSelector = initFunc ? getSighash(`function ${initFunc}`) : undefined;

        if (this.verbose) {
          console.log(chalk.magentaBright(`🧩 Facet: ${facetName}`));
          console.log(chalk.gray(`  - Upgrade Version: ${upgradeVersion}`));
          console.log(chalk.green(`  - Added Selectors:`), addedSelectors);
          console.log(chalk.yellow(`  - Replaced Selectors:`), replacedSelectors);
          console.log(chalk.red(`  - Removed Selectors:`), removedSelectors);
          if (initFuncSelector) console.log(chalk.cyan(`  - Init Function Selector: ${initFuncSelector}`));
        }

        if (removedSelectors.length > 0) {
          facetCuts.push({
            facetAddress: ethers.constants.AddressZero,
            action: FacetCutAction.Remove,
            functionSelectors: removedSelectors,
            name: facetName,
            version: upgradeVersion
          });
        }

        if (addedSelectors.length) {
          facetCuts.push({
            facetAddress: facetContract.address,
            action: FacetCutAction.Add,
            functionSelectors: addedSelectors,
            name: facetName,
            initFunc: initFuncSelector,
            version: upgradeVersion
          });
        }

        if (replacedSelectors.length) {
          facetCuts.push({
            facetAddress: facetContract.address,
            action: FacetCutAction.Replace,
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

        console.log(chalk.green(`✅ Facet ${facetName} deployed at ${facetContract.address}`));
      }
    }

    diamond.updateDeployInfo(deployedInfo);
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
    const deployConfig = diamond.getDeployConfig();
    const deployedInfo = diamond.getDeployInfo();

    let initAddress = ethers.constants.AddressZero;
    let initCalldata = "0x";

    const protocolInitFacet = deployConfig.protocolInitFacet;
    const currentVersion = deployedInfo.protocolVersion ?? -1;

    if (protocolInitFacet && deployConfig.protocolVersion > currentVersion) {
      const facetInfo = deployedInfo.FacetDeployedInfo?.[protocolInitFacet];
      const initFacetConfig = deployConfig.facets[protocolInitFacet];
      const versionConfig = initFacetConfig.versions?.[deployConfig.protocolVersion];

      const initFn = versionConfig?.deployInit ?? versionConfig?.upgradeInit;
      if (initFn && facetInfo) {
        const iface = new ethers.utils.Interface([`function ${initFn}`]);
        initAddress = facetInfo.address;
        initCalldata = iface.encodeFunctionData(initFn);
      }
    }

    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
      for (const cut of facetCuts) {
        console.log(chalk.bold(`- ${FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
        console.log(chalk.gray(`  Selectors:`), cut.functionSelectors);
        if (cut.initFunc) console.log(chalk.cyan(`  Init:`), cut.initFunc);
      }
      if (initAddress !== ethers.constants.AddressZero) {
        console.log(chalk.cyan(`Using ProtocolInitFacet ${protocolInitFacet} @ ${initAddress}`));
      }
    }

    const tx = await diamondContract.diamondCut(
      facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors })),
      initAddress,
      initCalldata
    );
    await tx.wait();

    deployedInfo.protocolVersion = deployConfig.protocolVersion;
    diamond.updateDeployInfo(deployedInfo);

    console.log(chalk.green(`✅ DiamondCut executed: ${tx.hash}`));
  }
}
