import { Diamond } from "./Diamond";
import { DiamondDeployer } from "./DiamondDeployer";
import { FacetCallbackManager } from "./FacetCallbackManager";
export declare class DeploymentManager {
    private diamond;
    private deployer;
    private callbackManager;
    constructor(diamond: Diamond, deployer: DiamondDeployer, callbackManager: FacetCallbackManager);
    deployAll(): Promise<void>;
    upgradeAll(): Promise<void>;
    private runPostDeployCallbacks;
}
//# sourceMappingURL=DeploymentManager.d.ts.map