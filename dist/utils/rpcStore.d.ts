import { RPCDeploymentRegistry, RPCStepStatus, RPCStepRecord } from '../types/rpc';
/**
 * Step-by-step deployment store for RPC-based deployments
 * Similar to DefenderDeploymentStore but for RPC deployments
 */
export declare class RPCDeploymentStore {
    private readonly filePath;
    private readonly diamondName;
    private readonly deploymentId;
    constructor(diamondName: string, deploymentId: string, baseDir?: string);
    private loadRegistry;
    private saveRegistry;
    initializeDeployment(network: string, chainId: number, rpcUrl: string, deployerAddress: string): void;
    saveStep(step: RPCStepRecord): void;
    getStep(stepName: string): RPCStepRecord | undefined;
    updateStatus(stepName: string, status: RPCStepStatus, txHash?: string, contractAddress?: string, error?: string): void;
    list(): RPCStepRecord[];
    getRegistry(): RPCDeploymentRegistry;
    isStepCompleted(stepName: string): boolean;
    isStepFailed(stepName: string): boolean;
    getCompletedSteps(): RPCStepRecord[];
    getFailedSteps(): RPCStepRecord[];
    getPendingSteps(): RPCStepRecord[];
    markDeploymentComplete(): void;
    markDeploymentFailed(error: string): void;
    clearFailedSteps(): void;
    getDeploymentSummary(): {
        total: number;
        completed: number;
        failed: number;
        pending: number;
        isComplete: boolean;
        hasFailed: boolean;
    };
}
//# sourceMappingURL=rpcStore.d.ts.map