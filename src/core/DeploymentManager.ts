import { Diamond } from "./Diamond";
import { DeploymentStrategy } from "../strategies/DeploymentStrategy";
import { CallbackArgs } from "../types";
import chalk from "chalk";

export class DeploymentManager {
  private diamond: Diamond;
  private strategy: DeploymentStrategy;

  constructor(diamond: Diamond, strategy: DeploymentStrategy) {
    this.diamond = diamond;
    this.strategy = strategy;
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment for Diamond: ${this.diamond.diamondName}`);
    this.diamond.newDeployment = true;

    await this.strategy.preDeployDiamond(this.diamond);
    await this.strategy.deployDiamond(this.diamond);
    await this.strategy.postDeployDiamond(this.diamond);

    await this.strategy.preDeployFacets(this.diamond);
    await this.strategy.deployFacets(this.diamond);
    await this.strategy.postDeployFacets(this.diamond);

    await this.strategy.preUpdateFunctionSelectorRegistry(this.diamond);
    await this.strategy.updateFunctionSelectorRegistry(this.diamond);
    await this.strategy.postUpdateFunctionSelectorRegistry(this.diamond);

    await this.strategy.prePerformDiamondCut(this.diamond);
    await this.strategy.performDiamondCut(this.diamond);
    await this.strategy.postPerformDiamondCut(this.diamond);

    await this.strategy.preRunPostDeployCallbacks(this.diamond);
    await this.strategy.runPostDeployCallbacks(this.diamond);
    await this.strategy.postRunPostDeployCallbacks(this.diamond);

    console.log(`✅ Deployment completed successfully.`);
  }

  async upgrade(): Promise<void> {
    console.log(`♻️ Starting upgrade for Diamond: ${this.diamond.diamondName}`);

    this.diamond.newDeployment = false;

    await this.strategy.preDeployFacets(this.diamond);
    await this.strategy.deployFacets(this.diamond);
    await this.strategy.postDeployFacets(this.diamond);

    await this.strategy.preUpdateFunctionSelectorRegistry(this.diamond);
    await this.strategy.updateFunctionSelectorRegistry(this.diamond);
    await this.strategy.postUpdateFunctionSelectorRegistry(this.diamond);

    await this.strategy.prePerformDiamondCut(this.diamond);
    await this.strategy.performDiamondCut(this.diamond);
    await this.strategy.postPerformDiamondCut(this.diamond);

    await this.strategy.preRunPostDeployCallbacks(this.diamond);
    await this.strategy.runPostDeployCallbacks(this.diamond);
    await this.strategy.postRunPostDeployCallbacks(this.diamond);

    console.log(`✅ Upgrade completed successfully.`);
  }

}
