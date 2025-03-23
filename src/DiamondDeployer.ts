import '@nomiclabs/hardhat-ethers';
import hre from 'hardhat';
import { JsonRpcProvider } from "@ethersproject/providers";
import { BaseContract, Signer } from "ethers";
import { assert } from "chai";
// import { ProxyDiamond } from "../typechain-types";
// import { loadExistingDeployment, loadFacetsToDeploy, getDiamondContract } from "./helpers";
import { 
  // getDiamondContractViem, 
  loadExistingDeployment, 
  loadFacetsToDeploy 
} from "./helpers";
import { DiamondDeploymentManager } from "./DiamondDeploymentManager";
import { DeploymentInfo,  INetworkDeployInfo, IFacetsToDeploy, IDeployments } from "./types";
import { error } from "console";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { join, resolve } from 'path';
import { loadFacets, saveFacets, updateFacet, deleteFacet, validateFacets } from './utils/jsonFileHandler';
  
export async function getDiamondContract(diamondName: string,
  typechainDir: string = "typechain-types"
): Promise<any> {
    // // Get the typechain configuration (default to "typechain-types" if not defined)
    // const typechainConfig = hre.config.typechain;
    // // Resolve the outDir relative to the project's root path
    // const outDir = typechainConfig?.outDir ?? "typechain-types";
    // const baseDir = resolve(hre.config.paths.root, outDir);
    
    const baseDir = typechainDir;
    // Construct the absolute path to the Diamond type.
    // The exact location depends on your TypeChain configuration and naming.
    // Here, we assume the file is named 'ProxyDiamond.ts' under the typechain-types directory:
    const diamondPath = join(baseDir, diamondName);

    // Dynamically import the ProxyDiamond types.
    // The module should export the contract type (e.g. as ProxyDiamond).
    const diamondModule = await import(diamondPath);
    
    return diamondModule.Diamond;
  } 


// This class is a factory of singletons (Multiton) that coordinates the deployment of a diamond contract and its facets.
export class DiamondDeployer {
  private static instances: Map<string, DiamondDeployer> = new Map();
  private networkName: string;
  private diamondName: string;
  private deploymentKey: string;
  private provider: JsonRpcProvider;
  private deployInfo: INetworkDeployInfo | null = null;
  private deployInProgress = false;
  private upgradeInProgress = false;
  private deployCompleted = false;
  private upgradeCompleted = false;
  private deployer: Signer;
  // private ethers = hre.ethers;
  private chainId: number;
  private deploymentsPath: string
  private facetsPath: string = "facets";
  private facetsToDeploy: IFacetsToDeploy;
  
  private diamond!: any;
  
  private manager: DiamondDeploymentManager;
  
  private constructor(config: DeploymentInfo) {
    let initialDeployInfo: INetworkDeployInfo;
    this.networkName = config.networkName;
    this.chainId = config.chainId;
    this.diamondName = config.diamondName;
    this.provider = config.provider;
    this.deploymentsPath = config.deploymentsPath;
    this.facetsPath = config.facetsPath;

    const DiamondType = getDiamondContract(this.diamondName);
    
    // Setup the ethers provider on multichain
    // hre.ethers.provider = this.provider;
    
    // Establish deployer from current deployments info or signer 0
    initialDeployInfo = loadExistingDeployment(this.networkName, this.diamondName, this.deploymentsPath);
    if (!initialDeployInfo.DeployerAddress) {
      console.log("No existing deployment info found for", this.networkName);
      this.deployer = this.provider.getSigner(0);
    } else {
      console.log("Existing deployment info found for", this.networkName);
      this.deployer = this.provider.getSigner(initialDeployInfo.DeployerAddress);
      initialDeployInfo = initialDeployInfo;
    }
    this.deployInfo = initialDeployInfo;
    
    // Load the facet deployment info for this diamond
    const facetsConfigPath = this.facetsPath
    this.facetsToDeploy = loadFacetsToDeploy(this.diamondName, facetsConfigPath);
    
    config.deployer = this.deployer;
    this.deploymentKey = this.networkName + this.diamondName;
    this.manager = DiamondDeploymentManager.getInstance(
      config,
      initialDeployInfo
    );
  }

  static getInstance(deploymentInfo: DeploymentInfo): DiamondDeployer {
    const chainId = deploymentInfo.chainId.toString();
    const _deploymentKey = this.normalizeDeploymentKey(chainId, deploymentInfo.diamondName);
    if (!this.instances.has(_deploymentKey)) {
      this.instances.set(_deploymentKey, new DiamondDeployer(deploymentInfo));
    }
    return this.instances.get(_deploymentKey)!;
  }

  // TODO this would probably be better in a utility class
  private static normalizeDeploymentKey(networkName: string, diamondName: string): string {
    return networkName.toLowerCase() + "-" + diamondName.toLowerCase();
  }

  // The new deploy() now delegates to the DiamondDeploymentManager instance.
  // TODO this should not be null and void.  Needs cleanup
  async deploy(): Promise<INetworkDeployInfo | null | void> {
    // Check if a previous deployment has been loaded.
    if (this.deployInfo?.DiamondAddress || this.deployCompleted) {
      console.log(`Deployment already completed for ${this.networkName}`);
      return this.deployInfo ? this.deployInfo : error("The deploy info is null");
    }
    // Check for ongoing upgrades.
    if (this.deployInProgress || this.upgradeInProgress) {
      console.log(`Operation already in progress for ${this.networkName}`);
      while (this.deployInProgress || this.upgradeInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return this.deployInfo ? this.deployInfo : error("The deploy info is null");;
    }
    else if (this.upgradeInProgress) {
      console.log(`Upgrade in progress for ${this.networkName}`);
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
      await this.manager.deployDiamond();

      // After the diamond is deployed, update our local state.
      this.deployInfo = this.manager.getDeploymentInfo();
      console.log("Diamond deployed at:", this.deployInfo?.DiamondAddress);

      // Deploy (or upgrade) facets. Use Facets object (or a tailored FacetToDeployInfo) as desired.
      await this.manager.deployFacets(this.facetsToDeploy);

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
      console.error(`Deployment failed for ${this.networkName}:`, error);
      throw error;
    } finally {
      this.deployInProgress = false;
    }
  }

  // The new upgrade() method delegates to the manager as well.
  async upgrade(): Promise<boolean> {
    if (this.upgradeCompleted) {
      console.log(`Upgrade already completed for ${this.networkName}`);
      return true;
    }
    if (this.deployInProgress) {
      console.log(`Deployment in progress for ${this.networkName}, waiting to upgrade.`);
      while (this.deployInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    if (this.upgradeInProgress) {
      console.log(`Upgrade already in progress for ${this.networkName}`);
      while (this.upgradeInProgress) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return true;
    }
    this.upgradeInProgress = true;
    try {
      console.log(`Starting upgrade for ${this.networkName}`);
      // Ensure diamond deployment exists before upgrade.
      if (!this.deployInfo || !this.deployInfo.DiamondAddress) {
        console.log("Diamond not deployed. Needs deployment first.");
        // await this.deploy();
      }
      
      // Load Facet Callbacks (initializers) from files
      
      // Impersonate and fund deployer account on hardhat and forked networks.
      // TODO This is for test deployments only. This should be done before the deploy() or upgrade method is called in a test.
      await this.impersonateAndFundAccount(this.deployInfo!.DeployerAddress);

      await this.manager.deployFacets(this.facetsToDeploy);
      // TODO: Perform DiamondCut as needed here...
      // await this.manager.performDiamondCut([], "0x0000000000000000000000000000000000000000", "0x");

      console.log(`Upgrade completed for ${this.networkName}`);
      this.upgradeCompleted = true;
      return true;
    } catch (error) {
      console.error(`Upgrade failed for ${this.networkName}:`, error);
      throw error;
    } finally {
      this.upgradeInProgress = false;
    }
  }

  // Helper: Impersonate and fund deployer account on Hardhat, if necessary.
  async impersonateAndFundAccount(deployerAddress: string): Promise<Signer> {
    try {
      await this.provider.send("hardhat_impersonateAccount", [deployerAddress]);
      const deployer = this.provider.getSigner(deployerAddress);
      await this.provider.send("hardhat_setBalance", [deployerAddress, "0x56BC75E2D63100000"]);
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

  public getDiamond<T extends BaseContract>(): Promise<T> {
    return Promise.resolve(this.diamond as T);
  }
  
  public getDeployment(): INetworkDeployInfo | null {
    return this.deployInfo;
  }
  
  // This doesn't work because hardhat=-typechain causes the parent project to error out if it is included included in this node module as well.  Since it is deprecated and this functionality is only needed in the parent project it will not be included.
// export async function getDiamondContract(diamondName: string,
//     hre: HardhatRuntimeEnvironment
//   ): Promise<any> {
//     // Get the typechain configuration (default to "typechain-types" if not defined)
//     const typechainConfig = hre.config.typechain;
//     // Resolve the outDir relative to the project's root path
//     const outDir = typechainConfig?.outDir ?? "typechain-types";
//     const baseDir = resolve(hre.config.paths.root, outDir);
  
//     // Construct the absolute path to the Diamond type.
//     // The exact location depends on your TypeChain configuration and naming.
//     // Here, we assume the file is named 'ProxyDiamond.ts' under the typechain-types directory:
//     const diamondPath = join(baseDir, diamondName);
  
//     // Dynamically import the ProxyDiamond types.
//     // The module should export the contract type (e.g. as ProxyDiamond).
//     const diamondModule = await import(diamondPath);
    
//     return diamondModule.Diamond;
//   }
}

export default DiamondDeployer;
