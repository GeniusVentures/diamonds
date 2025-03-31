// strategies/LocalDeploymentStrategy.ts
import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo } from "../types";
import hre from "hardhat";

export class LocalDeploymentStrategy implements DeploymentStrategy {
  async deployDiamond(diamond: Diamond): Promise<void> {
    console.log(`🚀 Deploying Diamond locally on ${diamond.networkName} ${diamond.chainId}: ${diamond.diamondName}`);

    const factory = await hre.ethers.getContractFactory(diamond.diamondName, diamond.deployer!);
    const diamondContract = await factory.deploy(diamond.deployer!.getAddress(), diamond.deployer!);
    await diamondContract.deployed();

    const info = diamond.getDeployInfo();
    info.DiamondAddress = diamondContract.address;
    diamond.updateDeployInfo(info);

    console.log(`✅ Diamond deployed locally at ${diamondContract.address}`);
  }

  async deployFacets(diamond: Diamond): Promise<void> {
    console.log(`🚀 Deploying facets locally for ${diamond.diamondName}`);

    const facetsConfig = diamond.getFacetsConfig();
    const deployInfo = diamond.getDeployInfo();

    for (const facetName in facetsConfig) {
      const FacetFactory = await hre.ethers.getContractFactory(facetName, diamond.deployer);
      const facetContract = await FacetFactory.deploy();
      await facetContract.deployed();

      deployInfo.FacetDeployedInfo = deployInfo.FacetDeployedInfo || {};
      deployInfo.FacetDeployedInfo[facetName] = {
        address: facetContract.address,
        tx_hash: facetContract.deployTransaction.hash,
        version: 1,
      };

      console.log(`✅ Facet ${facetName} deployed at ${facetContract.address}`);
    }

    diamond.updateDeployInfo(deployInfo);
  }

  async performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void> {
    console.log(`🔧 Performing diamondCut locally for ${diamond.diamondName}`);

    const deployInfo = diamond.getDeployInfo();
    const diamondContract = await hre.ethers.getContractAt(
      "IDiamondCut",
      deployInfo.DiamondAddress!,
      diamond.deployer
    );

    const tx = await diamondContract.diamondCut(facetCuts, "0x0000000000000000000000000000000000000000", "0x");
    await tx.wait();

    console.log(`✅ diamondCut transaction executed: ${tx.hash}`);
  }
}
