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
    await this.strategy.deployFacets(this.diamond);

    const facetCuts: FacetDeploymentInfo[] = []; // logic to populate facetCuts
    await this.strategy.performDiamondCut(this.diamond, facetCuts);
  }
}
