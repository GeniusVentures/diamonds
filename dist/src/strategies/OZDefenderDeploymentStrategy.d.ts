import { BaseDeploymentStrategy } from './BaseDeploymentStrategy';
import { Diamond } from '../core';
import { ExternalApiCreateProposalRequest } from "@openzeppelin/defender-sdk-proposal-client/lib/models/proposal";
export declare class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy {
    private client;
    private proposalClient;
    private relayerAddress;
    private autoApprove;
    private via;
    private viaType;
    constructor(apiKey: string, apiSecret: string, relayerAddress: string, autoApprove: boolean | undefined, via: ExternalApiCreateProposalRequest['via'], viaType: ExternalApiCreateProposalRequest['viaType'], verbose?: boolean);
    protected checkAndUpdateDeployStep(stepName: string, diamond: Diamond): Promise<void>;
    /**
     * Polls the Defender API until the deployment is complete or fails.
     * @param stepName The name of the step to poll.
     * @param diamond The diamond instance.
     * @param options Polling options.
     * @returns The deployment response or null if not found.
     */
    private pollUntilComplete;
    protected preDeployDiamondTasks(diamond: Diamond): Promise<void>;
    protected deployDiamondTasks(diamond: Diamond): Promise<void>;
    protected preDeployFacetsTasks(diamond: Diamond): Promise<void>;
    /**
     * deployFacetsTasks
     *
     * Deploys the facets of the diamond using OpenZeppelin Defender.
     *
     * @param diamond
     */
    protected deployFacetsTasks(diamond: Diamond): Promise<void>;
    /**
     * Performs the diamond cut tasks using OpenZeppelin Defender.
     * @param diamond The diamond instance.
     */
    protected performDiamondCutTasks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=OZDefenderDeploymentStrategy.d.ts.map