import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo, FacetCutAction } from "../types";
import { ethers } from "hardhat";
import { join } from "path";
import chalk from "chalk";
import { logTx, logDiamondLoupe, getDeployedFacets } from "../utils";
import { getDeployedFacetInterfaces } from "../utils";

export class BaseDeploymentStrategy implements DeploymentStrategy {
  constructor(protected verbose: boolean = false) { }

  async deployDiamond(diamond: Diamond): Promise<void> {
    console.log(chalk.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`));
    const diamondCutFactory = await ethers.getContractFactory("DiamondCutFacet", diamond.signer!);
    const diamondCutFacet = await diamondCutFactory.deploy();
    await diamondCutFacet.deployed();

    const diamondArtifactName = `${diamond.diamondName}.sol:${diamond.diamondName}`;
    const diamondArtifactPath = join(
      diamond.contractsPath,
      diamondArtifactName,
    );
    const diamondFactory = await ethers.getContractFactory(diamondArtifactPath, diamond.signer!);
    const diamondContract = await diamondFactory.deploy(diamond.signer!.getAddress(), diamondCutFacet.address);
    await diamondContract.deployed();
    const diamondFunctionSelectors = Object.keys(diamondContract.interface.functions).map(fn => diamondContract.interface.getSighash(fn));
    diamond.registerSelectors(diamondFunctionSelectors);

    const info = diamond.getDeployedDiamondData();
    info.DeployerAddress = await diamond.signer!.getAddress();
    info.DiamondAddress = diamondContract.address;
    const diamondCutFacetFunctionSelectors = Object.keys(diamondCutFacet.interface.functions).map(fn => diamondCutFacet.interface.getSighash(fn));
    info.FacetDeployedInfo = info.FacetDeployedInfo || {};
    info.FacetDeployedInfo["DiamondCutFacet"] = {
      address: diamondCutFacet.address,
      tx_hash: diamondCutFacet.deployTransaction.hash,
      version: 1,
      funcSelectors: diamondCutFacetFunctionSelectors,
    };

    diamond.updateDeployedDiamondData(info);
    diamond.registerSelectors(diamondCutFacetFunctionSelectors);

    console.log(chalk.green(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`));
  }

  async deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]> {
    const deployConfig = diamond.getDeployConfig();
    const facetsConfig = deployConfig.facets;
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const facetCuts: FacetDeploymentInfo[] = [];

    const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
      return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
    });

    for (const facetName of sortedFacetNames) {
      const facetConfig = facetsConfig[facetName];
      const deployedVersion = deployedDiamondData.FacetDeployedInfo?.[facetName]?.version ?? -1;
      const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
      const latestVersion = Math.max(...availableVersions);

      if (latestVersion > deployedVersion || deployedVersion === -1) {
        console.log(chalk.blueBright(`🚀 Deploying facet: ${facetName} to version ${latestVersion}`));
        const facetFactory = await ethers.getContractFactory(facetName, diamond.signer);
        const facetContract = await facetFactory.deploy();
        await facetContract.deployed();

        const allSelectors = Object.keys(facetContract.interface.functions).map(fn =>
          facetContract.interface.getSighash(fn)
        );

        const existingSelectors = deployedDiamondData.FacetDeployedInfo?.[facetName]?.funcSelectors || [];
        const newSelectors = allSelectors.filter(sel => !diamond.selectorRegistry.has(sel));
        const removedSelectors: string[] = existingSelectors.filter((sel: string) => !newSelectors.includes(sel));
        const replacedSelectors = newSelectors.filter(sel => existingSelectors.includes(sel));
        const addedSelectors = newSelectors.filter(sel => !existingSelectors.includes(sel));

        if (this.verbose) {
          console.log(chalk.magentaBright(`🧩 Facet: ${facetName}`));
          console.log(chalk.gray(`  - Upgrade Version: ${latestVersion}`));
          console.log(chalk.green(`  - Added Selectors:`), addedSelectors);
          console.log(chalk.yellow(`  - Replaced Selectors:`), replacedSelectors);
          console.log(chalk.red(`  - Removed Selectors:`), removedSelectors);
        }

        if (removedSelectors.length > 0) {
          facetCuts.push({
            facetAddress: ethers.constants.AddressZero,
            action: FacetCutAction.Remove,
            functionSelectors: removedSelectors,
            name: facetName,
            version: latestVersion
          });
        }

        if (addedSelectors.length) {
          facetCuts.push({
            facetAddress: facetContract.address,
            action: FacetCutAction.Add,
            functionSelectors: addedSelectors,
            name: facetName,
            version: latestVersion
          });
        }

        if (replacedSelectors.length) {
          facetCuts.push({
            facetAddress: facetContract.address,
            action: FacetCutAction.Replace,
            functionSelectors: replacedSelectors,
            name: facetName,
            version: latestVersion
          });
        }

        deployedDiamondData.FacetDeployedInfo = deployedDiamondData.FacetDeployedInfo || {};
        deployedDiamondData.FacetDeployedInfo[facetName] = {
          address: facetContract.address,
          tx_hash: facetContract.deployTransaction.hash,
          version: latestVersion,
          funcSelectors: newSelectors,
        };

        diamond.registerSelectors(newSelectors);
        // Do not add the protocolInitFacet to the Initializer registry
        if (facetName === deployConfig.protocolInitFacet) continue;

        const facetVersionConfig = facetConfig.versions?.[latestVersion];
        const initFunc = facetVersionConfig?.deployInit ?? facetVersionConfig?.upgradeInit;
        const initKey = deployedVersion === -1 ? "deployInit" : "upgradeInit";
        const initFunction = facetConfig.versions && facetConfig.versions[latestVersion]?.[initKey];

        if (initFunction) {
          console.log(chalk.blueBright(`▶ Registering ${initKey} for facet ${facetName}: ${initFunction}`));
          diamond.registerInitializers(facetName, initFunction);
        }

        console.log(chalk.green(`✅ Facet ${facetName} deployed at ${facetContract.address}`));
      }
    }

    diamond.updateDeployedDiamondData(deployedDiamondData);
    return facetCuts;
  }

  async getFacetsAndSelectorsToRemove(
    diamond: Diamond
  ): Promise<FacetDeploymentInfo[]> {
    const existingFacets = diamond.getDeployedDiamondData().FacetDeployedInfo!;
    const newConfig = diamond.getFacetsConfig();
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
    const diamondContract = await ethers.getContractAt("IDiamondCut", diamond.getDeployedDiamondData().DiamondAddress!, diamond.signer);
    const deployConfig = diamond.getDeployConfig();
    const deployedDiamondData = diamond.getDeployedDiamondData();

    let initAddress = ethers.constants.AddressZero;
    let initCalldata = "0x";

    const protocolInitFacet = deployConfig.protocolInitFacet;
    const currentVersion = deployedDiamondData.protocolVersion ?? 0;

    if (protocolInitFacet && deployConfig.protocolVersion > currentVersion) {
      const facetInfo = deployedDiamondData.FacetDeployedInfo?.[protocolInitFacet];
      const facetConfig = deployConfig.facets[protocolInitFacet];
      const versionConfig = facetConfig.versions?.[deployConfig.protocolVersion];

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

    const ifaceList = getDeployedFacetInterfaces(deployedDiamondData);
    if (this.verbose) {
      await logTx(tx, "DiamondCut", ifaceList);
    } else {
      console.log(chalk.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
      await tx.wait();
    }

    deployedDiamondData.protocolVersion = deployConfig.protocolVersion;
    diamond.updateDeployedDiamondData(deployedDiamondData);

    console.log(chalk.green(`✅ DiamondCut executed: ${tx.hash}`));

    for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
      console.log(chalk.blueBright(`▶ Running ${initFunction} from the ${facetName} facet`));
      const contract = await ethers.getContractAt(facetName, deployedDiamondData!.DiamondAddress, diamond.signer);
      const tx = await contract[initFunction]();
      if (this.verbose) {
        logTx(tx, `${facetName}.${initFunction}`, ifaceList);
      } else {
        console.log(chalk.blueBright(`🔄 Waiting for ${facetName}.${initFunction}} mined...`));
        await tx.wait();
      }
      console.log(chalk.green(`✅ ${facetName}.${initFunction} executed`));
    }
  }

}
