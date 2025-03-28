import '@nomiclabs/hardhat-ethers';
import hre from 'hardhat';
import { JsonRpcProvider } from "@ethersproject/providers";
import { BaseContract, Signer } from "ethers";
import { assert } from "chai";
import {
  loadDeployFile,
  loadFacetsConfigFile
} from "../utils/deploymentFileHelpers";
import DiamondDeployer from "./DiamondDeployer";
import { Diamond } from "./Diamond";
import { IFacetsDeployConfig } from "../types";
import { INetworkDeployInfo } from "../schemas";
import { error } from "console";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { join, resolve } from 'path';




// This class is a factory of singletons (Multiton) that coordinates the deployment of a diamond contract and its facets.
export class DiamondDeploymentManger extends DiamondDeployer {
  private static instances: Map<string, DiamondDeployer> = new Map();
  private networkName: string;
  private diamondName: string;
  private deploymentKey: string;
  private provider: JsonRpcProvider;
  private deployInfo: INetworkDeployInfo;
  private deployInProgress = false;
  private upgradeInProgress = false;
  private deployCompleted = false;
  private upgradeCompleted = false;
  private deployer: Signer;
  private chainId: number;
  private deploymentsPath: string
  private facetsPath: string = "facets";
  private facetsConfig: IFacetsDeployConfig;
  private diamond!: Diamond;

  private constructor(diamond: Diamond, provider: JsonRpcProvider) {
    super(diamond, provider);
    this.diamond = diamond;
    if (!diamond.deployer) {
      this.deployer = hre.ethers.provider.getSigner();
    } else {
      this.deployer = diamond.deployer;
    }
    this.networkName = diamond.networkName;
    this.chainId = diamond.chainId;
    this.diamondName = diamond.diamondName;
    this.provider = provider;
    this.deploymentsPath = diamond.deploymentsPath;
    this.facetsPath = diamond.deploymentsPath;

    this.deployInfo = diamond.deployInfo;
    this.facetsConfig = diamond.facetsConfig


    this.deploymentKey = this.diamond.networkName + this.diamond.diamondName;
  }

  static getInstance(diamond: Diamond, provider: JsonRpcProvider): DiamondDeployer {
    const chainId = diamond.chainId.toString();
    const _deploymentKey = this.normalizeDeploymentKey(chainId, diamond.diamondName);
    if (!this.instances.has(_deploymentKey)) {
      this.instances.set(_deploymentKey, new DiamondDeployer(diamond, diamond.provider));
    }
    return this.instances.get(_deploymentKey)!;
  }

  public getInstanceKey(): string {
    return DiamondDeployer.normalizeDeploymentKey(this.networkName, this.diamondName);
  }

  // TODO this would probably be better in a utility class/helper because it is used elseware
  private static normalizeDeploymentKey(networkName: string, diamondName: string): string {
    return networkName.toLowerCase() + "-" + diamondName.toLowerCase();
  }

  // The new deploy() now delegates to the DiamondDeploymentManager instance.
  // TODO this should not be null and void.  Needs cleanup.  Also, async?
  async deploy(): Promise<INetworkDeployInfo | null | void> {
    // Check if a previous deployment has been loaded.
    if (this.deployInfo?.DiamondAddress || this.deployCompleted) {
      console.log(`Deployment already completed for ${this.diamond.networkName}`);
      return this.deployInfo ? this.deployInfo : error("The deploy info is null");
    }
    // Check for ongoing upgrades.
    if (this.deployInProgress || this.upgradeInProgress) {
      console.log(`Operation already in progress for ${this.diamond.networkName}`);
      while (this.deployInProgress || this.upgradeInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return this.deployInfo ? this.deployInfo : error("The deploy info is null");;
    }
    else if (this.upgradeInProgress) {
      console.log(`Upgrade in progress for ${this.diamond.networkName}`);
      while (this.upgradeInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return this.deployInfo ? this.deployInfo : error("The deploy info is null");
    }

    this.deployInProgress = true;
    try {

      // If the diamond is already deployed then impersonate the deployer info.
      if (this.deployInfo!.DiamondAddress) {
        console.log("Diamond already deployed. Reusing deployment info.");
        // TODO: Only for hardhat/forked local networks.  This could be a callback or optional. Otherwise a gas estimator and account balance check for the deployer on chain.
        // Impersonate the deployer and fund their account
        await this.impersonateAndFundAccount(await this.deployer.getAddress());
      }

      // Call the deployDiamond process via the manager.
      await super.deployDiamond();

      // After the diamond is deployed, update our local state.
      this.deployInfo = super.getDeploymentInfo();
      console.log("Diamond deployed at:", this.deployInfo?.DiamondAddress);

      // Deploy (or upgrade) facets. Use Facets object as desired.
      await super.deployFacets(super.facetsDeployConfig);

      // Perform the diamond cut to bind new selectors.
      // Here we use an empty diamondCut for simplicity.
      await this.manager.performDiamondCut([], "0x0000000000000000000000000000000000000000", "0x");

      // Perform any post-deploy initialization steps. This is not a thing.
      // await this.manager.afterDeployCallbacks();

      if (!this.deployInfo!.DiamondAddress) {
        throw new Error("DiamondAddress is undefined");
      }

      this.deployCompleted = true;
      return this.deployInfo;
    } catch (error) {
      console.error(`Deployment failed for ${this.diamond.networkName}:`, error);
      throw error;
    } finally {
      this.deployInProgress = false;
    }
  }

  // The new upgrade() method delegates to the manager as well.
  async upgrade(): Promise<boolean> {
    if (this.upgradeCompleted) {
      console.log(`Upgrade already completed for ${this.diamond.networkName}`);
      return true;
    }
    if (this.deployInProgress) {
      console.log(`Deployment in progress for ${this.diamond.networkName}, waiting to upgrade.`);
      while (this.deployInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    if (this.upgradeInProgress) {
      console.log(`Upgrade already in progress for ${this.diamond.networkName}`);
      while (this.upgradeInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return true;
    }
    this.upgradeInProgress = true;
    try {
      console.log(`Starting upgrade for ${this.diamond.networkName}`);
      // Ensure diamond deployment exists before upgrade.
      if (!this.deployInfo || !this.deployInfo.DiamondAddress) {
        console.log("Diamond not deployed. Needs deployment first.");
        // await this.deploy();
      }

      // Load Facet Callbacks (initializers) from files

      // Impersonate and fund deployer account on hardhat and forked networks.
      // TODO This is for test deployments only. This should be done before the deploy() or upgrade method is called in a test.
      await this.impersonateAndFundAccount(this.deployInfo!.DeployerAddress);

      await this.manager.deployFacets(this.facetDeployConfig);
      // TODO: Perform DiamondCut as needed here...
      await this.manager.performDiamondCut([], "0x0000000000000000000000000000000000000000", "0x");

      console.log(`Upgrade completed for ${this.diamond.networkName}`);
      this.upgradeCompleted = true;
      return true;
    } catch (error) {
      console.error(`Upgrade failed for ${this.diamond.networkName}:`, error);
      throw error;
    } finally {
      this.upgradeInProgress = false;
    }
  }

  // Helper: Impersonate and fund deployer account on Hardhat, if necessary.
  async impersonateAndFundAccount(deployerAddress: string): Promise<Signer> {
    try {
      await this.diamond.provider!.send("hardhat_impersonateAccount", [deployerAddress]);
      const deployer = this.diamond.provider!.getSigner(deployerAddress);
      await this.diamond.provider!.send("hardhat_setBalance", [deployerAddress, "0x56BC75E2D63100000"]);
      return deployer;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Impersonation and funding failed for ${deployerAddress}: ${error.message}`);
      } else {
        console.error(`Impersonation and funding failed for ${deployerAddress}: ${String(error)}`);
      }
      throw error;
    }
  }
}

export default DiamondDeployer;
