import { DeploymentStrategy } from "../strategies/DeploymentStrategy";
import { Diamond } from "./Diamond";
export declare class DeploymentManager {
    private diamond;
    private strategy;
    constructor(diamond: Diamond, strategy: DeploymentStrategy);
    deploy(): Promise<void>;
    upgrade(): Promise<void>;
}
//# sourceMappingURL=DeploymentManager.d.ts.map