import { Diamond } from "./Diamond";
import { DeploymentStrategy } from "../strategies/DeploymentStrategy";
export declare class DeploymentManager {
    private diamond;
    private strategy;
    constructor(diamond: Diamond, strategy: DeploymentStrategy);
    deploy(): Promise<void>;
    upgrade(): Promise<void>;
    private runPostDeployCallbacks;
}
//# sourceMappingURL=DeploymentManager.d.ts.map