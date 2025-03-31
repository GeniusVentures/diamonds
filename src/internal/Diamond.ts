import fs from "fs";
import path from "path";
import { INetworkDeployInfo, FacetsConfig, FacetsDeployment } from "../schemas";
import { FacetCallbackManager } from "./FacetCallbackManager";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers, Signer } from "ethers";
import { writeDeployInfo } from "../utils/jsonFileHandler";
import { readFacetsConfig, readDeployFilePathDiamondNetwork } from '../utils/jsonFileHandler';
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

  constructor(config: DiamondConfig, repository: DeploymentRepository) {
    this.diamondName = config.diamondName;
    this.networkName = config.networkName;
    this.chainId = config.chainId;
    this.deploymentsPath = config.deploymentsPath;
    this.contractsPath = config.contractsPath;
    this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;

    this.repository = repository;

    const deployInfoPath = path.join(
      config.deploymentsPath,
      config.diamondName,
      `${this.deploymentId}.json`
    )

    // Load facets to deploy
    const facetsConfigPath = path.join(
      config.deploymentsPath,
      config.diamondName,
      "facets.json" // TODO change to diamond.config.json
    );

    // Load existing deployment info
    this.deployInfo = this.repository.loadDeployInfo(deployInfoPath);
    this.facetsConfig = this.repository.loadFacetsConfig(facetsConfigPath);

    // Initialize the callback manager
    this.callbackManager = FacetCallbackManager.getInstance(
      this.diamondName,
      path.join(this.deploymentsPath, this.diamondName, "callbacks")
    );
  }

  getDeployInfo(): INetworkDeployInfo {
    return this.deployInfo;
  }

  updateDeployInfo(info: INetworkDeployInfo): void {
    this.deployInfo = info;
    const deployInfoPath = path.join(
      this.deploymentsPath,
      this.diamondName,
      `${this.networkName}.json`
    );
    this.repository.saveDeployInfo(deployInfoPath, info);
  }

  getFacetsConfig(): FacetsConfig {
    return this.facetsConfig;
  }
}

export default Diamond;