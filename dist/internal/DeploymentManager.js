"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
class DeploymentManager {
    constructor(diamond, strategy) {
        this.diamond = diamond;
        this.strategy = strategy;
    }
    async deploy() {
        console.log(`🚀 Starting deployment for Diamond: ${this.diamond.diamondName}`);
        await this.strategy.deployDiamond(this.diamond);
        const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
        const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(this.diamond);
        const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];
        await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
        await this.runPostDeployCallbacks();
        console.log(`✅ Deployment completed successfully.`);
    }
    async upgrade() {
        console.log(`♻️ Starting upgrade for Diamond: ${this.diamond.diamondName}`);
        const additionFacetCuts = await this.strategy.deployFacets(this.diamond);
        const removalFacetCuts = await this.strategy.getFacetsAndSelectorsToRemove(this.diamond);
        const allFacetCuts = [...removalFacetCuts, ...additionFacetCuts];
        await this.strategy.performDiamondCut(this.diamond, allFacetCuts);
        await this.runPostDeployCallbacks();
        console.log(`✅ Upgrade completed successfully.`);
    }
    // Handle post-deployment callbacks clearly
    async runPostDeployCallbacks() {
        console.log(`🔄 Running post-deployment callbacks...`);
        const deployConfig = this.diamond.getDeployConfig();
        const deployInfo = this.diamond.getDeployedDiamondData();
        for (const [facetName, facetConfig] of Object.entries(deployConfig.facets)) {
            if (!facetConfig.versions)
                continue;
            for (const [version, config] of Object.entries(facetConfig.versions)) {
                if (config.callbacks) {
                    const args = {
                        diamond: this.diamond,
                    };
                    console.log(chalk_1.default.cyanBright(`Executing callback ${config.callbacks} for facet ${facetName}...`));
                    await this.diamond.callbackManager.executeCallback(facetName, config.callbacks, args);
                    console.log(chalk_1.default.magenta(`✅ Callback ${config.callbacks} executed for facet ${facetName}`));
                }
            }
        }
        console.log(chalk_1.default.greenBright `✅ All post-deployment callbacks executed.`);
    }
}
exports.DeploymentManager = DeploymentManager;
//# sourceMappingURL=DeploymentManager.js.map