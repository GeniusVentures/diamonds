import { Diamond } from "./Diamond";
import { DeploymentStrategy } from "../strategies/DeploymentStrategy";
export declare class DiamondDeployer {
    private diamond;
    private strategy;
    constructor(diamond: Diamond, strategy: DeploymentStrategy);
    deploy(): Promise<void>;
    upgrade(): Promise<void>;
}
//# sourceMappingURL=DiamondDeployer.d.ts.map