import { BaseDeploymentStrategy } from './BaseDeploymentStrategy';
import { Diamond } from '../internal';
export declare class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy {
    private adminClient;
    private relayerAddress;
    private autoApprove;
    constructor(apiKey: string, apiSecret: string, relayerAddress: string, autoApprove?: boolean, verbose?: boolean);
    performDiamondCut(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=OZDefenderDeploymentStrategy.d.ts.map