import { BaseDeploymentStrategy } from './BaseDeploymentStrategy';
import { Diamond } from '../internal';
import { ExternalApiCreateProposalRequest } from "@openzeppelin/defender-admin-client/lib/models/proposal";
export declare class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy {
    private adminClient;
    private relayerAddress;
    private autoApprove;
    private via;
    private viaType;
    constructor(apiKey: string, apiSecret: string, relayerAddress: string, autoApprove: boolean | undefined, via: ExternalApiCreateProposalRequest['via'], viaType: ExternalApiCreateProposalRequest['viaType'], verbose?: boolean);
    protected preDeployDiamondTasks(diamond: Diamond): Promise<void>;
    protected postDeployDiamondTasks(diamond: Diamond): Promise<void>;
    protected _performDiamondCut(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=OZDefenderDeploymentStrategy.d.ts.map