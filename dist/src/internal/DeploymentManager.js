"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentManager = void 0;
class DeploymentManager {
    constructor(diamond, strategy) {
        this.diamond = diamond;
        this.strategy = strategy;
    }
    async deploy() {
        console.log(`🚀 Starting deployment for Diamond: ${this.diamond.diamondName}`);
        this.diamond.newDeployment = true;
        await this.strategy.deployDiamond(this.diamond);
        await this.strategy.deployFacets(this.diamond);
        await this.strategy.updateFunctionSelectorRegistry(this.diamond);
        await this.strategy.performDiamondCut(this.diamond);
        await this.strategy.runPostDeployCallbacks(this.diamond);
        console.log(`✅ Deployment completed successfully.`);
    }
    async upgrade() {
        console.log(`♻️ Starting upgrade for Diamond: ${this.diamond.diamondName}`);
        this.diamond.newDeployment = false;
        await this.strategy.deployFacets(this.diamond);
        await this.strategy.updateFunctionSelectorRegistry(this.diamond);
        await this.strategy.performDiamondCut(this.diamond);
        await this.strategy.runPostDeployCallbacks(this.diamond);
        console.log(`✅ Upgrade completed successfully.`);
    }
}
exports.DeploymentManager = DeploymentManager;
//# sourceMappingURL=DeploymentManager.js.map