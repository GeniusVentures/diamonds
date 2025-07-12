"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiamondDeployer = void 0;
const DeploymentManager_1 = require("./DeploymentManager");
class DiamondDeployer {
    // private provider: JsonRpcProvider;
    diamond;
    strategy;
    constructor(diamond, strategy) {
        this.diamond = diamond;
        this.strategy = strategy;
        ;
    }
    async deployDiamond() {
        const manager = new DeploymentManager_1.DeploymentManager(this.diamond, this.strategy);
        let deployedDiamondData;
        const deployedData = this.diamond.getDeployedDiamondData();
        if (deployedData && deployedData.DiamondAddress) {
            deployedDiamondData = deployedData;
            console.log(`Diamond already deployed at ${deployedDiamondData.DiamondAddress}. Performing upgrade...`);
            await manager.upgrade();
        }
        else {
            console.log(`Diamond not previously deployed. Performing initial deployment...`);
            await manager.deploy();
        }
    }
    getDiamond() {
        return this.diamond;
    }
}
exports.DiamondDeployer = DiamondDeployer;
//# sourceMappingURL=DiamondDeployer.js.map