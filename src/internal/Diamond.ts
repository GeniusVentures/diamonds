import fs from "fs";
import path from "path";
import { INetworkDeployInfo, FacetsConfig, FacetsDeployment } from "../schemas";
import FacetCallbackManager from "./FacetCallbackManager";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers, Signer } from "ethers";
import { writeDeployInfo } from "../utils/jsonFileHandler";
import { readFacetsConfig, readDeployFilePathDiamondNetwork } from '../utils/jsonFileHandler';

export class Diamond {
  private static instances: Map<string, Diamond> = new Map();

  public diamondName: string;
  public networkName: string;
  public chainId: number;
  public deployer: Signer | undefined;
  public deploymentsPath: string;
  // public facetsPath: string;
  public deployFilePath: string;
  public contractsPath: string;
  public deployInfo: INetworkDeployInfo;
  public facetsConfig: FacetsConfig;
  public facetSelectors: string[] = [];
  public callbackManager: FacetCallbackManager;
  public provider: JsonRpcProvider | undefined;
  public deploymentId;

  constructor(
    diamondName: string,
    // TODO: probably needs to be a typeof Network instead of both networkName and chainId
    networkName: string,
    chainId: number,
    deploymentsPath: string = 'diamonds',
    contractsPath: string = 'contracts'
  ) {
    this.diamondName = diamondName;
    this.networkName = networkName;
    this.chainId = chainId;
    this.deploymentsPath = deploymentsPath;
    this.contractsPath = contractsPath;
    this.deploymentId = diamondName.toLowerCase() + '-' + networkName.toLowerCase() + '-' + chainId;
    this.deployFilePath = path.join(
      deploymentsPath,
      diamondName,
      this.deploymentId + '.json'
    )
    // Load existing deployment info
    this.deployInfo = readDeployFilePathDiamondNetwork(deploymentsPath, diamondName, networkName);

    // Load facets to deploy
    const facetsConfigFilePath = path.join(
      deploymentsPath,
      diamondName,
      "facets.json"
    );
    this.facetsConfig = readFacetsConfig(facetsConfigFilePath);

    // Load facet selectors (if applicable)
    this.facetSelectors = this.loadFacetSelectors();

    // Initialize the callback manager
    this.callbackManager = FacetCallbackManager.getInstance(
      this.diamondName,
      path.join(this.deploymentsPath, this.diamondName, "facetCallbacks")
    );
  }

  private async getNetworkInfo(provider: JsonRpcProvider) {
    const networkName = (await provider.getNetwork()).name;
    const chainId = (await provider.getNetwork()).chainId.toString();

    return [this.networkName, chainId]
  }

  public setProvider(provider: JsonRpcProvider) {
    this.provider = provider;
  }

  /**
   * Singleton factory method to get or create a Diamond instance.
   */
  public async getDiamond(
    _diamondName: string,
    _networkName: string,
    _chainId: number,
    _deploymentsPath: string,
  ): Promise<Diamond> {
    // const chainName: string = (await provider?.getNetwork())?.name || 'unknown';
    // const chainId: string = (await provider?.getNetwork())?.chainId.toString() || '31337';
    const key = `${_diamondName}-${_networkName}-${_chainId}`;
    if (!Diamond.instances.has(key)) {
      Diamond.instances.set(
        key,
        new Diamond(_diamondName, _networkName, _chainId, _deploymentsPath)
      );
    }
    return Diamond.instances.get(key)!;
  }

  /**
   * Load facets to deploy from facets.json.
   */
  private loadFacetsToDeploy(): FacetsConfig {
    return readFacetsConfig(this.deploymentsPath);
  }

  /**
   * Load facet selectors (if applicable).
   */
  private loadFacetSelectors(): string[] {
    // TODO: Implement logic to load facet selectors if stored separately.
    return [];
  }

  /**
   * Get the deployment information.
   */
  public getDeploymentInfo(): INetworkDeployInfo {
    if (!this.deployInfo) {
    }
    return this.deployInfo;
  }

  /**
   * Update the deployment information.
   */
  public updateDeploymentInfo(deployInfo: INetworkDeployInfo): void {
    this.deployInfo = deployInfo;
    this.saveDeploymentInfo();
  }

  /**
   * Save the deployment information to deployments.json.
   */
  private saveDeploymentInfo(): void {
    const fileName = this.networkName + '.json';
    const deploymentFilePath = path.join(
      this.deploymentsPath,
      this.diamondName,
      fileName
    );
    fs.writeFileSync(
      deploymentFilePath,
      JSON.stringify(this.deployInfo, null, 2),
      "utf-8"
    );
  }

  /**
   * Get the facets to deploy.
   */
  public getFacetsDeployConfig(): FacetsConfig {
    return this.facetsConfig;
  }

  /**
   * Get the facet selectors.
   */
  public getFacetSelectors(): string[] {
    return this.facetSelectors;
  }

  /**
   * Get the callback manager.
   */
  public getCallbackManager(): FacetCallbackManager {
    return this.callbackManager;
  }
}

export default Diamond;