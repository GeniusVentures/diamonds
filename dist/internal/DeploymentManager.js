"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentManager = void 0;
class DeploymentManager {
    constructor(diamond, deployer) {
        this.diamond = diamond;
        this.deployer = deployer;
    }
    // High-level method to handle complete deployment
    async deployAll() {
        console.log(`🚀 Starting deployment for Diamond: ${this.diamond.diamondName}`);
        await this.deployer.deploy();
        await this.runPostDeployCallbacks();
        console.log(`✅ Deployment completed successfully.`);
    }
    // High-level method to handle upgrades
    async upgradeAll() {
        console.log(`♻️ Starting upgrade for Diamond: ${this.diamond.diamondName}`);
        await this.deployer.upgrade();
        await this.runPostDeployCallbacks();
        console.log(`✅ Upgrade completed successfully.`);
    }
    // Handle post-deployment callbacks clearly
    async runPostDeployCallbacks() {
        console.log(`🔄 Running post-deployment callbacks...`);
        const facetsConfig = this.diamond.getFacetsConfig();
        const deployInfo = this.diamond.getDeployInfo();
        for (const [facetName, facetConfig] of Object.entries(facetsConfig)) {
            if (!facetConfig.versions)
                continue;
            for (const [version, config] of Object.entries(facetConfig.versions)) {
                if (config.callbacks) {
                    const args = {
                        diamond: this.diamond,
                        // initConfig: {
                        //   diamondName: this.diamond.diamondName,
                        //   deploymentsPath: this.diamond.deploymentsPath,
                        //   contractsPath: this.diamond.contractsPath,
                        //   provider: this.diamond.provider!,
                        //   networkName: this.diamond.networkName,
                        //   chainId: this.diamond.chainId,
                        //   deployer: this.diamond.deployer,
                        // },
                        // deployInfo: deployInfo,
                    };
                    await this.diamond.callbackManager.executeCallback(facetName, config.callbacks, args);
                    console.log(`✅ Callback ${config.callbacks} executed for facet ${facetName}`);
                }
            }
        }
        console.log(`✅ All post-deployment callbacks executed.`);
    }
}
exports.DeploymentManager = DeploymentManager;
//# sourceMappingURL=DeploymentManager.js.map