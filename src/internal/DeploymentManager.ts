// internal/DeploymentManager.ts
import { Diamond } from "./Diamond";
import { DiamondDeployer } from "./DiamondDeployer";
import { FacetCallbackManager } from "./FacetCallbackManager";
import { CallbackArgs } from "../types";

export class DeploymentManager {
  private diamond: Diamond;
  private deployer: DiamondDeployer;
  private callbackManager: FacetCallbackManager;

  constructor(
    diamond: Diamond,
    deployer: DiamondDeployer,
    callbackManager: FacetCallbackManager
  ) {
    this.diamond = diamond;
    this.deployer = deployer;
    this.callbackManager = callbackManager;
  }

  // High-level method to handle complete deployment
  async deployAll(): Promise<void> {
    console.log(`🚀 Starting deployment for Diamond: ${this.diamond.diamondName}`);

    await this.deployer.deploy();
    await this.runPostDeployCallbacks();

    console.log(`✅ Deployment completed successfully.`);
  }

  // High-level method to handle upgrades
  async upgradeAll(): Promise<void> {
    console.log(`♻️ Starting upgrade for Diamond: ${this.diamond.diamondName}`);

    await this.deployer.deploy(); // TODO: This should be a separate upgrade method that defaults to the deploy() if no upgrade function exists for the strategy.
    await this.runPostDeployCallbacks();

    console.log(`✅ Upgrade completed successfully.`);
  }

  // Handle post-deployment callbacks clearly
  private async runPostDeployCallbacks(): Promise<void> {
    console.log(`🔄 Running post-deployment callbacks...`);

    const facetsConfig = this.diamond.getFacetsConfig();
    const deployInfo = this.diamond.getDeployInfo();

    for (const [facetName, facetConfig] of Object.entries(facetsConfig)) {
      if (!facetConfig.versions) continue;

      for (const [version, config] of Object.entries(facetConfig.versions)) {
        if (config.callback) {
          const args: CallbackArgs = {
            initConfig: {
              diamondName: this.diamond.diamondName,
              deploymentsPath: this.diamond.deploymentsPath,
              facetsPath: "", // populate accordingly
              contractsPath: this.diamond.contractsPath,
              provider: this.diamond.provider!,
              networkName: this.diamond.networkName,
              chainId: this.diamond.chainId,
              deployer: this.diamond.deployer,
            },
            deployInfo: deployInfo,
          };

          await this.callbackManager.executeCallback(
            facetName,
            config.callback.name,
            args
          );

          console.log(`✅ Callback ${config.callback.name} executed for facet ${facetName}`);
        }
      }
    }

    console.log(`✅ All post-deployment callbacks executed.`);
  }
}
