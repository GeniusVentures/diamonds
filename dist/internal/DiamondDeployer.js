"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiamondDeployer = void 0;
class DiamondDeployer {
    constructor(diamond, strategy) {
        this.diamond = diamond;
        this.strategy = strategy;
    }
    async deploy() {
        await this.strategy.deployDiamond(this.diamond);
        const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(this.diamond.getDeployInfo().FacetDeployedInfo, this.diamond.getFacetsConfig());
        const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
        const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];
        await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
    }
    async upgrade() {
        await this.strategy.deployFacets(this.diamond);
        const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(this.diamond.getDeployInfo().FacetDeployedInfo, this.diamond.getFacetsConfig());
        const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
        const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];
        await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
    }
}
exports.DiamondDeployer = DiamondDeployer;
//# sourceMappingURL=DiamondDeployer.js.map