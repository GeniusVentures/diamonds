// internal/DeploymentManager.ts
import { Diamond } from "./Diamond";
import { DiamondDeployer } from "./DiamondDeployer";
import { CallbackArgs } from "../types";

export class DeploymentManager {
  private diamond: Diamond;
  private deployer: DiamondDeployer;

  constructor(
    diamond: Diamond,
    deployer: DiamondDeployer
  ) {
    this.diamond = diamond;
    this.deployer = deployer;
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

    await this.deployer.upgrade();
    await this.runPostDeployCallbacks();

    console.log(`✅ Upgrade completed successfully.`);
  }

  // Handle post-deployment callbacks clearly
  private async runPostDeployCallbacks(): Promise<void> {
    console.log(`🔄 Running post-deployment callbacks...`);

    const deployConfig = this.diamond.getDeployConfig();
    const deployInfo = this.diamond.getDeployInfo();

    for (const [facetName, facetConfig] of Object.entries(deployConfig.facets)) {
      if (!facetConfig.versions) continue;

      for (const [version, config] of Object.entries(facetConfig.versions)) {
        if (config.callbacks) {
          const args: CallbackArgs = {
            diamond: this.diamond,
          };

          await this.diamond.callbackManager.executeCallback(
            facetName,
            config.callbacks,
            args
          );

          console.log(`✅ Callback ${config.callbacks} executed for facet ${facetName}`);
        }
      }
    }

    console.log(`✅ All post-deployment callbacks executed.`);
  }
}
