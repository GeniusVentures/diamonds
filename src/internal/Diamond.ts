import { join } from "path";
import { DeployedDiamondData, DeployConfig, FacetsConfig } from "../schemas";
import { CallbackManager } from "./CallbackManager";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "ethers";
import { DeploymentRepository } from "../repositories/DeploymentRepository";
import { DiamondConfig } from "../types";

export class Diamond {
  private static instances: Map<string, Diamond> = new Map();

  public diamondName: string;
  public networkName: string;
  public chainId: number;
  public deploymentsPath: string;
  public contractsPath: string;
  public deploymentId: string;
  public facetSelectors: string[] = [];
  public callbackManager: CallbackManager;
  private deployedDiamondData: DeployedDiamondData;
  private config: DiamondConfig;
  private facetsConfig: FacetsConfig;
  private repository: DeploymentRepository;
  public signer: Signer | undefined;
  public provider: JsonRpcProvider | undefined;
  public deployConfig: DeployConfig;

  constructor(config: DiamondConfig, repository: DeploymentRepository) {
    this.config = config;
    this.diamondName = config.diamondName;
    this.networkName = config.networkName;
    this.chainId = config.chainId;
    this.deploymentsPath = config.deploymentsPath || "diamonds";
    this.contractsPath = config.contractsPath || "contracts";
    this.repository = repository;
    this.deploymentId = repository.getDeploymentId();

    // Load existing deployment info
    this.deployedDiamondData = this.repository.loadDeployedDiamondData();
    this.deployConfig = this.repository.loadDeployConfig();

    this.facetsConfig = this.deployConfig.facets;

    this.callbackManager = CallbackManager.getInstance(
      this.diamondName, this.deploymentsPath);
  }

  getDeployedDiamondData(): DeployedDiamondData {
    return this.deployedDiamondData;
  }

  updateDeployedDiamondData(data: DeployedDiamondData): void {
    this.repository.saveDeployedDiamondData(data);
    this.deployedDiamondData = data;
  }

  public getDiamondConfig(): DiamondConfig {
    return this.config;
  }

  public getDeployConfig(): DeployConfig {
    return this.deployConfig;
  }

  getFacetsConfig(): FacetsConfig {
    return this.facetsConfig;
  }

  public isUpgradeDeployment(): boolean {
    return !!this.deployedDiamondData.DiamondAddress;
  }

  public selectorRegistry: Set<string> = new Set();

  public registerSelectors(selectors: string[]): void {
    selectors.forEach(selector => this.selectorRegistry.add(selector));
  }

  public isSelectorRegistered(selector: string): boolean {
    return this.selectorRegistry.has(selector);
  }

  public initializerRegistry: Map<string, string> = new Map();

  public registerInitializers(facetName: string, initFunction: string): void {
    this.initializerRegistry.set(facetName, initFunction);
  }

}

export default Diamond;