// internal/DiamondDeployer.ts
import { Diamond } from "./Diamond";
import { DeploymentStrategy } from "../strategies/DeploymentStrategy";
import { FacetDeploymentInfo } from "../types";

export class DiamondDeployer {
  private diamond: Diamond;
  private strategy: DeploymentStrategy;

  constructor(diamond: Diamond, strategy: DeploymentStrategy) {
    this.diamond = diamond;
    this.strategy = strategy;
  }

  async deploy(): Promise<void> {
    await this.strategy.deployDiamond(this.diamond);

    const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(
      this.diamond.getDeployInfo().FacetDeployedInfo!,
      this.diamond.getFacetsConfig()
    );

    const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
    const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];

    await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
  }
}
