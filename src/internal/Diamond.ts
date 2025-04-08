import path from "path";
import { INetworkDeployInfo, FacetsConfig } from "../schemas";
import { FacetCallbackManager } from "./FacetCallbackManager";
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
  // public deployInfoPath: string;
  public contractsPath: string;
  public deploymentId: string;
  public facetSelectors: string[] = [];
  public callbackManager: FacetCallbackManager;
  private deployInfo: INetworkDeployInfo;
  private facetsConfig: FacetsConfig;
  private repository: DeploymentRepository;
  public deployer: Signer | undefined;
  public provider: JsonRpcProvider | undefined;
  public deployInfoFilePath: string;
  public facetsConfigFilePath: string;
  public createNewDeploymentFile: boolean;

  constructor(config: DiamondConfig, repository: DeploymentRepository) {
    this.diamondName = config.diamondName;
    this.networkName = config.networkName;
    this.chainId = config.chainId;
    this.deploymentsPath = config.deploymentsPath || "diamonds";
    this.contractsPath = config.contractsPath || "contracts";
    this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;
    this.createNewDeploymentFile = config.createNewDeployFile || true;

    this.repository = repository;

    this.deployInfoFilePath = path.join(
      this.deploymentsPath,
      config.diamondName,
      `deployments/${this.deploymentId}.json`
    )

    // Load facets to deploy
    this.facetsConfigFilePath = path.join(
      this.deploymentsPath,
      config.diamondName,
      `${config.diamondName.toLowerCase()}.config.json`
    );

    // Load existing deployment info
    this.deployInfo = this.repository.loadDeployInfo(this.deployInfoFilePath, this.createNewDeploymentFile);
    this.facetsConfig = this.repository.loadFacetsConfig(this.facetsConfigFilePath);

    // Initialize the callback manager
    this.callbackManager = FacetCallbackManager.getInstance(
      this.diamondName, this.deploymentsPath);
  }

  getDeployInfo(): INetworkDeployInfo {
    return this.deployInfo;
  }

  updateDeployInfo(info: INetworkDeployInfo): void {
    this.deployInfo = info;
    this.repository.saveDeployInfo(this.deployInfoFilePath, info);
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