import path from "path";
import { INetworkDeployInfo, DeployConfig, FacetsConfig } from "../schemas";
import { CallbackManager } from "./CallbackManager";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "ethers";
import { DeploymentRepository } from "../utils/DeploymentRepository";
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
  // TODO: Refactor deployInfo to lastDeploymentInfo or deployedRecord for clarity
  private deployInfo: INetworkDeployInfo;
  private config: DiamondConfig;
  private facetsConfig: FacetsConfig;
  private repository: DeploymentRepository;
  public deployer: Signer | undefined;
  public provider: JsonRpcProvider | undefined;
  public deployInfoFilePath: string;
  public deployConfig: DeployConfig;
  public configFilePath: string;
  public createOrUpdateDeploymentFile: boolean;

  constructor(config: DiamondConfig, repository: DeploymentRepository) {
    this.config = config;
    this.diamondName = config.diamondName;
    this.networkName = config.networkName;
    this.chainId = config.chainId;
    this.deploymentsPath = config.deploymentsPath || "diamonds";
    this.contractsPath = config.contractsPath || "contracts";
    this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;
    this.createOrUpdateDeploymentFile = config.createOrUpdateDeployFile ?? true;

    this.repository = repository;

    this.deployInfoFilePath = path.join(
      this.deploymentsPath,
      config.diamondName,
      `deployments/${this.deploymentId}.json`
    )

    // Load facets to deploy
    this.configFilePath = path.join(
      this.deploymentsPath,
      config.diamondName,
      `${config.diamondName.toLowerCase()}.config.json`
    );

    // Load existing deployment info
    this.deployInfo = this.repository.loadDeployInfo(this.deployInfoFilePath, this.createOrUpdateDeploymentFile);
    this.deployConfig = this.repository.loadDeployConfig(this.configFilePath);

    this.facetsConfig = this.deployConfig.facets;

    // Initialize the callback manager
    this.callbackManager = CallbackManager.getInstance(
      this.diamondName, this.deploymentsPath);
  }

  getDeployInfo(): INetworkDeployInfo {
    return this.deployInfo;
  }

  updateDeployInfo(info: INetworkDeployInfo): void {
    if (this.createOrUpdateDeploymentFile == true) {
      this.deployInfo = info;
      this.repository.saveDeployInfo(this.deployInfoFilePath, info);
    }
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
    return !!this.deployInfo.DiamondAddress;
  }

  public selectorRegistry: Set<string> = new Set();

  public registerSelectors(selectors: string[]): void {
    selectors.forEach(selector => this.selectorRegistry.add(selector));
  }

  public isSelectorRegistered(selector: string): boolean {
    return this.selectorRegistry.has(selector);
  }

}

export default Diamond;