import { Diamond } from './Diamond';
import { DeploymentStrategy } from '../strategies';
export declare class DiamondDeployer {
    private diamond;
    private strategy;
    constructor(diamond: Diamond, strategy: DeploymentStrategy);
    deployDiamond(): Promise<void>;
    getDiamond(): Diamond;
}
//# sourceMappingURL=DiamondDeployer.d.ts.map