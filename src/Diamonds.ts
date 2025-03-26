import fs from "fs";
import path from "path";
import { INetworkDeployInfo, IFacetsToDeploy, FacetsDeployment } from "./types";
import FacetCallbackManager from "./FacetCallbackManager";

class Diamond {
  private static instances: Map<string, Diamond> = new Map();

  private diamondName: string;
  private chainId: string;
  private deploymentsPath: string;
  private facetsPath: string;
  private deployInfo: INetworkDeployInfo | null = null;
  private facetsToDeploy: IFacetsToDeploy | null = null;
  private facetSelectors: string[] = [];
  private callbackManager: FacetCallbackManager;

  private constructor(
    diamondName: string,
    chainId: string,
    deploymentsPath: string,
    facetsPath: string
  ) {
    this.diamondName = diamondName;
    this.chainId = chainId;
    this.deploymentsPath = deploymentsPath;
    this.facetsPath = facetsPath;

    // Load existing deployment info
    this.deployInfo = this.loadDeploymentInfo();

    // Load facets to deploy
    this.facetsToDeploy = this.loadFacetsToDeploy();

    // Load facet selectors (if applicable)
    this.facetSelectors = this.loadFacetSelectors();

    // Initialize the callback manager
    this.callbackManager = FacetCallbackManager.getInstance(
      this.diamondName,
      path.join(this.facetsPath, this.diamondName, "facetCallbacks")
    );
  }

  /**
   * Singleton factory method to get or create a Diamond instance.
   */
  public static getInstance(
    diamondName: string,
    chainId: string,
    deploymentsPath: string,
    facetsPath: string
  ): Diamond {
    const key = `${chainId}-${diamondName}`;
    if (!Diamond.instances.has(key)) {
      Diamond.instances.set(
        key,
        new Diamond(diamondName, chainId, deploymentsPath, facetsPath)
      );
    }
    return Diamond.instances.get(key)!;
  }

  /**
   * Load existing deployment information from deployments.json.
   */
  private loadDeploymentInfo(): INetworkDeployInfo | null {
    const deploymentFilePath = path.join(
      this.deploymentsPath,
      this.diamondName,
      "deployments.json"
    );
    if (fs.existsSync(deploymentFilePath)) {
      return JSON.parse(fs.readFileSync(deploymentFilePath, "utf-8"));
    }
    return null;
  }

  /**
   * Load facets to deploy from facets.json.
   */
  private loadFacetsToDeploy(): IFacetsToDeploy | null {
    const facetsConfigPath = path.join(
      this.facetsPath,
      this.diamondName,
      "facets.json"
    );
    if (fs.existsSync(facetsConfigPath)) {
      return JSON.parse(fs.readFileSync(facetsConfigPath, "utf-8"));
    }
    return null;
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
  public getDeploymentInfo(): INetworkDeployInfo | null {
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
    const deploymentFilePath = path.join(
      this.deploymentsPath,
      this.diamondName,
      "deployments.json"
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
  public getFacetsToDeploy(): IFacetsToDeploy | null {
    return this.facetsToDeploy;
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