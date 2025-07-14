import { join } from "path";
import {
  DeployedDiamondData,
  DeployedFacets,
  DeployedFacet,
  DeployConfig,
  FacetsConfig
} from "../schemas";
import { CallbackManager } from "./CallbackManager";
import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { Signer } from "ethers";
import { DeploymentRepository } from "../repositories/DeploymentRepository";
import {
  DiamondConfig,
  RegistryFacetCutAction,
  FunctionSelectorRegistryEntry,
  NewDeployedFacets,
  NewDeployedFacet
} from "../types";
import { ethers } from "ethers";
import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

export class Diamond {
  private static instances: Map<string, Diamond> = new Map();

  public diamondName: string;
  public networkName: string;
  public chainId: number | bigint;
  public deploymentsPath: string;
  public contractsPath: string;
  public diamondAbiPath: string;
  public diamondAbiFileName: string;
  public deploymentId: string;
  public facetSelectors: string[] = [];
  public callbackManager: CallbackManager;
  private deployedDiamondData: DeployedDiamondData;
  private config: DiamondConfig;
  private facetsConfig: FacetsConfig;
  private repository: DeploymentRepository;
  public signer: Signer | undefined;
  public provider: JsonRpcProvider | Provider | HardhatEthersProvider | undefined;
  public deployConfig: DeployConfig;
  public newDeployment: boolean = true;
  public initAddress: string | undefined;

  constructor(config: DiamondConfig, repository: DeploymentRepository) {
    this.config = config;
    this.diamondName = config.diamondName;
    this.networkName = config.networkName || "hardhat";
    this.chainId = config.chainId || 31337;
    this.deploymentsPath = config.deploymentsPath || "diamonds";
    this.contractsPath = config.contractsPath || "contracts";
    this.diamondAbiFileName = config.diamondAbiFileName || config.diamondName;
    
    // Set diamond ABI path - default to diamond-abi subdirectory of configFilePath directory
    if (config.diamondAbiPath) {
      this.diamondAbiPath = config.diamondAbiPath;
    } else {
      const configDir = config.configFilePath 
        ? config.configFilePath.replace(/\/[^\/]*$/, '') // Remove filename from path
        : join(this.deploymentsPath, config.diamondName);
      this.diamondAbiPath = join(configDir, 'diamond-abi');
    }
    
    this.repository = repository;
    this.deploymentId = repository.getDeploymentId();

    // Load existing deployment info
    this.deployedDiamondData = this.repository.loadDeployedDiamondData();
    this.deployConfig = this.repository.loadDeployConfig();

    this.facetsConfig = this.deployConfig.facets;

    this.callbackManager = CallbackManager.getInstance(
      this.diamondName, this.deploymentsPath);

    this._initializeFunctionSelectorRegistry(this);
  }

  public functionSelectorRegistry = new Map<string, FunctionSelectorRegistryEntry>();

  private _initializeFunctionSelectorRegistry(
    diamond: Diamond
  ) {
    const diamondConfig: DiamondConfig = diamond.getDiamondConfig();
    const deployedDiamondData: DeployedDiamondData = diamond.getDeployedDiamondData();
    const deployedFacets: DeployedFacets = deployedDiamondData.DeployedFacets || {};

    for (const [facetName, { address: contractAddress, funcSelectors: selectors }] of Object.entries(deployedFacets)) {
      console.log(facetName);
      for (const selector of selectors!) {
        this.functionSelectorRegistry.set(selector, {
          facetName,
          priority: this.facetsConfig[facetName]?.priority! || 1000,
          address: contractAddress!,
          action: RegistryFacetCutAction.Deployed,
        });
      }
    }
  }

  public registerFunctionSelectors(selectors: Record<string, Omit<FunctionSelectorRegistryEntry, "selector">>): void {
    Object.entries(selectors).forEach(([selector, entry]) => {
      this.functionSelectorRegistry.set(selector, entry);
    });
  }

  public updateFunctionSelectorRegistry(selector: string, entry: FunctionSelectorRegistryEntry): void {
    this.functionSelectorRegistry.set(selector, entry);
  }

  public isFunctionSelectorRegistered(selector: string): boolean {
    return this.functionSelectorRegistry.has(selector);
  }

  public newDeployedFacets: NewDeployedFacets = {};

  public getNewDeployedFacets(): NewDeployedFacets {
    return this.newDeployedFacets || {};
  }

  public updateNewDeployedFacets(facetName: string, facet: NewDeployedFacet): void {
    this.newDeployedFacets[facetName] = facet;
  }

  getDeployedDiamondData(): DeployedDiamondData {
    return this.deployedDiamondData;
  }

  setDeployedDiamondData(data: DeployedDiamondData) {
    this.deployedDiamondData = data;
  }

  updateDeployedDiamondData(data: DeployedDiamondData): void {
    this.deployedDiamondData = data;
    this.repository.saveDeployedDiamondData(data);
  }

  public getDiamondConfig(): DiamondConfig {
    return this.config;
  }

  public getDeployConfig(): DeployConfig {
    return this.deployConfig;
  }

  public getFacetsConfig(): FacetsConfig {
    return this.facetsConfig;
  }

  public setProvider(provider: JsonRpcProvider | Provider | HardhatEthersProvider): void {
    this.provider = provider;
  }

  public getProvider(): JsonRpcProvider | Provider | HardhatEthersProvider | undefined {
    return this.provider;
  }

  public setSigner(signer: Signer): void {
    this.signer = signer;
  }

  public getSigner(): Signer | undefined {
    return this.signer;
  }

  public isUpgradeDeployment(): boolean {
    return !!this.deployedDiamondData.DiamondAddress;
  }

  public initializerRegistry: Map<string, string> = new Map();

  public registerInitializers(facetName: string, initFunction: string): void {
    this.initializerRegistry.set(facetName, initFunction);
  }

  public setInitAddress(initAddress: string): void {
    this.initAddress = initAddress;
  }
  public getInitAddress(): string | undefined {
    return this.initAddress;
  }

  public getDiamondAbiPath(): string {
    return this.diamondAbiPath;
  }

  public getDiamondAbiFileName(): string {
    return this.diamondAbiFileName;
  }

  public getDiamondAbiFilePath(): string {
    return join(this.diamondAbiPath, `${this.diamondAbiFileName}.json`);
  }
}

export default Diamond;