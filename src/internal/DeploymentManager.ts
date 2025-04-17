import { Diamond } from "./Diamond";
import { DeploymentStrategy } from "../repositories/DeploymentStrategy";
import { CallbackArgs } from "../types";

export class DeploymentManager {
  private diamond: Diamond;
  private strategy: DeploymentStrategy;

  constructor(diamond: Diamond, strategy: DeploymentStrategy) {
    this.diamond = diamond;
    this.strategy = strategy;
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment for Diamond: ${this.diamond.diamondName}`);

    await this.strategy.deployDiamond(this.diamond);

    const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
    const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(
      this.diamond
    );
    const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];

    await this.strategy.performDiamondCut(this.diamond, allFacetCuts);

    await this.runPostDeployCallbacks();

    console.log(`✅ Deployment completed successfully.`);
  }

  async upgrade(): Promise<void> {
    console.log(`♻️ Starting upgrade for Diamond: ${this.diamond.diamondName}`);

    await this.strategy.deployFacets(this.diamond);

    const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(
      this.diamond
    );
    const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
    const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];

    await this.strategy.performDiamondCut(this.diamond, allFacetCuts);

    await this.runPostDeployCallbacks();

    console.log(`✅ Upgrade completed successfully.`);
  }


  // Handle post-deployment callbacks clearly
  private async runPostDeployCallbacks(): Promise<void> {
    console.log(`🔄 Running post-deployment callbacks...`);

    const deployConfig = this.diamond.getDeployConfig();
    const deployInfo = this.diamond.getDeployedDiamondData();

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
