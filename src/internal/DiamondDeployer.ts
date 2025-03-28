import "@nomiclabs/hardhat-ethers";
import hre from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer, ContractFactory } from "ethers";
import { AdminClient } from "@openzeppelin/defender-admin-client";
import { Network } from "@openzeppelin/defender-base-client";
import debug from "debug";
import * as fs from "fs";
// import * as util from "util";
import { glob } from 'glob';
import { readFileSync } from "fs";
import { join, resolve } from "path";
// import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  IDeployConfig,
  CallbackArgs
} from "../types";
import {
  INetworkDeployInfo,
  FacetsConfig
} from "../schemas";
import FacetCallbackManager from "./FacetCallbackManager";
import Diamond from "./Diamond";
const log = debug("DiamondDeploymentManager:log");

/**
 * Multiton class for each network or chain. 
 * An instance manages deployment, upgrades, and interaction with the Diamond Proxy.
 */
export class DiamondDeployer extends Diamond {
  public static instances: Map<string, DiamondDeployer> = new Map();

  // In-memory store of the Diamond address etc. for the current instance.
  private initDeployInfo: INetworkDeployInfo;
  private deployInfo: INetworkDeployInfo;
  // private networkName: string;
  // private diamondName: string;
  private deploymentKey: string;
  public deployer: Signer | undefined;
  private provider: JsonRpcProvider;
  private defenderClient: AdminClient | undefined;
  // private ethers = require("ethers") as typeof hre.ethers;
  private deployerAddress: string | undefined;
  public contractsPath: string;
  private facetsConfigPath: string;
  private facetConfig: FacetsConfig;
  private facetCallbacksPath: string;
  private facetCallbackManager: FacetCallbackManager;

  constructor(diamond: Diamond) {
    super();
    this.diamondName = super.diamondName;
    this.contractsPath = diamond.contractsPath;
    this.networkName = diamond.networkName;
    this.deployer = diamond.deployer;
    this.deploymentKey = diamond.networkName.toLowerCase + "-" + diamond.diamondName.toLowerCase;
    this.initDeployInfo = diamond.deployInfo;
    this.deployInfo = diamond.deployInfo;
    // TODO this should probably just use a helper resolver to the absolute path of based.
    this.provider = diamond.provider;

    // Load Facet Config from facet.json file
    // TODO needs to be eliminated, refactored, not differentiating anymore
    this.facetsConfigPath = diamond.deploymentsPath;
    const facetDeployFilePath = join(this.facetsConfigPath, this.diamondName, 'facets.json');
    this.facetConfig = this.loadFacetDeployments(facetDeployFilePath);

    // Load Facet Callbacks Registry
    this.facetCallbacksPath = join(this.facetsConfigPath, this.diamondName, 'facetCallbacks');
    const files = fs.readdirSync(this.facetCallbacksPath);
    const callbacks: { [key: string]: (args: CallbackArgs) => Promise<void> } = {};
    for (const file of files) {
      const callbackName = file.split(".")[0];
      const callback = require(resolve(this.facetCallbacksPath, file));
      callbacks[callbackName] = callback;
    }

    this.facetCallbackManager = FacetCallbackManager.getInstance(this.diamondName, this.facetCallbacksPath);

    // // TODO verify and load the Facet Post Deployment Callbacks referenced in the facetDeployInfo
    // // Load Facet Deployment Callback  from files
    // const facetPostDeployCallbacksPath = join(this.facetsConfigPath, this.diamondName, 'facetPostDeployCallbacks');
    // this.loadFacetPostDeployCallbacks(facetPostDeployCallbacksPath);
    log(`Singleton instance of DiamondDeploymentManager created on ${this.networkName} for ${this.diamondName}`);
  }

  /**
   * Retrieves a deployment manager for a specific key (e.g., chain name).
   * Creates it if not already present.
   */
  public static getInstance(
    diamond: Diamond
  ): DiamondDeployer {
    const _chainId = diamond.chainId;
    const _diamondName = diamond.diamondName;
    const _deploymentKey = this.normalizeDeploymentKey(_chainId.toString(), _diamondName);
    if (!DiamondDeployer.instances.has(_deploymentKey)) {
      DiamondDeployer.instances.set(
        _deploymentKey,
        new DiamondDeployer(diamond)
      );
    }
    return DiamondDeployer.instances.get(_deploymentKey)!;
  }

  // TODO this would probably be better in a utility class, it is used in DiamondDeployer as well.
  private static normalizeDeploymentKey(chainId: string, diamondName: string): string {
    return chainId.toLowerCase() + "-" + diamondName.toLowerCase();
  }

  /**
   * Sets up the deployer address accounting for hardhat network or forks
   */
  private async setupDeployerAddress(): Promise<void> {
    if (!this.deployer) throw new Error("Deployer not resolved");
    this.deployerAddress = await this.deployer.getAddress();
    if (this.deployInfo.DeployerAddress !== this.deployerAddress) {
      this.deployInfo.DeployerAddress = this.deployerAddress;
    }
  }

  /**
   * Deploy the DiamondCutFacet and the Diamond itself. Update local deployment info.
   */
  public async deployDiamond(): Promise<void> {
    if (!this.deployer) throw new Error("Deployer not resolved");

    log(`🚀Deploying Diamond: {$this.diamondName} on {this.networkName}...`);
    await this.setupDeployerAddress();
    const diamondCutFacetKey = "DiamondCutFacet";
    // Check if DiamondCutFacet is deployed and deploy if not
    if (!this.deployInfo.FacetDeployedInfo[diamondCutFacetKey]?.address) {
      const DiamondCutFacet = await hre.ethers.getContractFactory(
        "DiamondCutFacet",
        this.deployer
      );
      const facet = await DiamondCutFacet.deploy();
      await facet.deployed();
      this.deployInfo.FacetDeployedInfo[diamondCutFacetKey] = {
        address: facet.address,
        tx_hash: facet.deployTransaction.hash,
        version: 0.0,
        funcSelectors: [] // TODO: update with selectors?
      };
      log(`DiamondCutFacet deployed at ${facet.address}`);
    }

    //Check if Diamond is deployed
    if (!this.deployInfo.DiamondAddress) {
      const diamondPath = `${this.contractsPath}/${this.diamondName}.sol:${this.diamondName}`;
      const DiamondFactory = await hre.ethers.getContractFactory(
        diamondPath,
        this.deployer
      );
      const contractOwnerAddress = await this.deployer.getAddress();
      const diamond = await DiamondFactory.deploy(
        contractOwnerAddress,
        this.deployInfo.FacetDeployedInfo[diamondCutFacetKey]?.address
      );
      await diamond.deployed();
      this.deployInfo.DiamondAddress = diamond.address;
      log(`Diamond deployed at ${diamond.address}`);
    } else {
      log(`Diamond already deployed at ${this.deployInfo.DiamondAddress}`);
    }
  }

  /**
   * Deploy facets that are not yet present or need an upgrade. 
   */
  public async deployFacets(facetsToDeploy: IFacetsToDeploy): Promise<void> {
    !this.deployerAddress ? this.setupDeployerAddress() : null;
    if (!this.deployer) throw new Error("Signer not resolved");
    log("Deploying (or upgrading) Facets...");

    // Sort facets by priority
    const facetsPriority = Object.keys(facetsToDeploy).sort(
      (a, b) => facetsToDeploy[a].priority - facetsToDeploy[b].priority
    );

    for (const facetName of facetsPriority) {
      const existing = this.deployInfo.FacetDeployedInfo[facetName];
      const facetData = facetsToDeploy[facetName];
      const versions = facetData.versions
        ? Object.keys(facetData.versions).map((v) => +v).sort((a, b) => b - a)
        : [0.0];

      const highestVersion = versions[0];
      const deployedVersion =
        existing?.version ?? (existing?.tx_hash ? 0.0 : -1.0);

      // If out of date or missing
      if (deployedVersion !== highestVersion) {
        const externalLibs: any = {};
        if (this.deployInfo.ExternalLibraries && facetData.libraries) {
          for (const lib of facetData.libraries) {
            externalLibs[lib] = this.deployInfo.ExternalLibraries[lib];
          }
        }
        const FacetCF: ContractFactory = await hre.ethers.getContractFactory(
          facetName,
          {
            signer: this.deployer,
            libraries: externalLibs
          }
        );

        log(`Deploying ${facetName} version ${highestVersion}...`);
        const facetContract = await FacetCF.deploy();
        await facetContract.deployed();

        this.deployInfo.FacetDeployedInfo[facetName] = {
          address: facetContract.address,
          tx_hash: facetContract.deployTransaction.hash,
          version: highestVersion,
          funcSelectors: [] // Later updated in a diamondCut step
        };
        log(`${facetName} deployed at ${facetContract.address}`);
      } else {
        log(`${facetName} up to date (version ${deployedVersion}).`);
      }
    }
  }

  /**
   * Perform the diamondCut operation to add/replace/remove facet selectors on the Diamond.
   */
  public async performDiamondCut(
    facetCuts: FacetDeploymentInfo[],
    initAddress: string,
    initData: string
  ): Promise<void> {
    await this.setupDeployerAddress();
    if (!this.deployer) throw new Error("Signer not resolved");
    const diamondAddress = this.deployInfo.DiamondAddress;
    if (!diamondAddress) throw new Error("No diamond address found");

    // Get the diamondCut function from the already-deployed diamond ABI
    const diamond = await hre.ethers.getContractAt("IDiamondCut", diamondAddress, this.deployer);
    log("Performing diamondCut...");
    const tx = await diamond.diamondCut(facetCuts, initAddress, initData);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw new Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    log(`diamondCut transaction executed. Hash: ${tx.hash}`);
  }

  /**
   * Method for generating function selectors from a contract.
   * This replaces some functionality from FacetSelectors.ts.
   */
  public async getSelectors(contractAddress: string): Promise<string[]> {
    // TODO: replace the dummy array. This is in FacetSelectors.ts
    return ["0x12345678"];
  }

  /**
   * Optional: call after deployment to initialize or upgrade via some function on the diamond.
   */
  public async callInitFunction(facetAddress: string, initSig: string): Promise<void> {
    if (!this.deployer) throw new Error("Signer not resolved");
    log(`Calling init function on facet ${facetAddress}, sig ${initSig}`);
    // Send a raw transaction
    const tx = await this.deployer.sendTransaction({
      to: this.deployInfo.DiamondAddress,
      data: initSig // e.g., the encoded function signature + arguments of the init function
    });
    await tx.wait();
    log("Initialization function call completed.");
  }

  /**
   * Configure Defender for this manager.
   */
  public configureDefender(apiKey: string, apiSecret: string): void {
    this.defenderClient = new AdminClient({
      apiKey: apiKey,
      apiSecret: apiSecret
    });
    log("Defender client configured.");
  }

  /**
   * Method showing to create a proposal to OpenZeppelin Defender
   * executing the diamondCut.
   */
  public async proposeDiamondCutToDefender(
    facetCuts: FacetDeploymentInfo[],
    initAddress: string,
    initData: string
  ): Promise<void> {
    if (!this.defenderClient) {
      throw new Error("Defender client not configured. Call configureDefender first.");
    }
    if (!this.deployInfo.DiamondAddress) {
      throw new Error("No diamond address found.");
    }

    // Convert the facetCuts data into an array suitable for your diamondCut function ABI
    const diamondCutFunctionInputs: any[] = [];
    for (const info of facetCuts) {
      diamondCutFunctionInputs.push([info.facetAddress, info.action, info.functionSelectors]);
    }

    const response = await this.defenderClient.createProposal({
      contract: {
        address: this.deployInfo.DiamondAddress,
        network: this.provider.network.name as Network
      },
      title: "Diamond Cut Proposal",
      description: "Propose an upgrade to diamond facets",
      type: "custom",
      functionInterface: {
        name: "diamondCut",
        inputs: [
          {
            name: "_diamondCut",
            type: "tuple[]"
          },
          {
            name: "_init",
            type: "address"
          },
          {
            name: "_calldata",
            type: "bytes"
          }
        ],
      },
      functionInputs: [diamondCutFunctionInputs, initAddress, initData],
      via: "<DEFENDER_RELAY_ADDRESS>",
      viaType: "Safe" // or Defender Relay, etc.
    });

    log(`Defender proposal created: ${response.proposalId}`);
  }

  // /**
  //  * Set Facet Post Deploy Callbacks
  //  */
  // public loadFacetPostDeployCallbacks(facetPostDeployCallbacksPath: string,): void {
  //   // Get all the callbacks listed in the facetDeployInfo
  //   const facetNames = Object.keys(this.facetDeployInfo);
  //   for (const facetName of facetNames) {
  //     const facetInfo = this.facetDeployInfo[facetName];
  //     if (facetInfo.versions?.callback) {
  //       const deployLoad = this.facetsConfigPath + "/facetCallbacks/" + facetInfo.versions.callback;
  //       import(deployLoad);
  //     }
  //   }
  // }

  /**
   * Set Facet Deployments
   */
  public loadFacetDeployments(facetsDeployFilePath: string): FacetsDeployment {
    // Read and parse JSON
    const jsonData = readFileSync(facetsDeployFilePath, 'utf-8');
    const facetsDeployments: FacetsDeployment = JSON.parse(jsonData);

    return facetsDeployments;
  }

  /**
   * Retrieve the current deployment info for saving or logging.
   */
  public getDeploymentInfo(): INetworkDeployInfo {
    return this.deployInfo;
  }

}

export default DiamondDeploymentManager;