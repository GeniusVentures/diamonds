import { Diamond } from "./Diamond";
import { DeploymentStrategy } from "../strategies/DeploymentStrategy";

export class DiamondDeployer {
  private diamond: Diamond;
  private strategy: DeploymentStrategy;

  constructor(diamond: Diamond, strategy: DeploymentStrategy) {
    this.diamond = diamond;
    this.strategy = strategy;
  }

  async deploy(): Promise<void> {
    await this.strategy.deployDiamond(this.diamond);


    const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
    const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(
      this.diamond
    );
    const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];

    await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
  }

  async upgrade(): Promise<void> {
    await this.strategy.deployFacets(this.diamond);

    const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(
      this.diamond
    );
    const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
    const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];
    await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
  }
}
