import { Diamond } from "./Diamond";
import { DiamondDeployer } from "./DiamondDeployer";
export declare class DeploymentManager {
    private diamond;
    private deployer;
    constructor(diamond: Diamond, deployer: DiamondDeployer);
    deployAll(): Promise<void>;
    upgradeAll(): Promise<void>;
    private runPostDeployCallbacks;
}
//# sourceMappingURL=DeploymentManager.d.ts.map