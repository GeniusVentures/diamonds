import { DefenderProposalStatus, DefenderStepRecord } from '../types/defender';
export declare class DefenderDeploymentStore {
    private readonly filePath;
    private readonly diamondName;
    private readonly deploymentId;
    constructor(diamondName: string, deploymentId: string, baseDir?: string);
    private loadRegistry;
    private saveRegistry;
    saveStep(step: DefenderStepRecord): void;
    getStep(stepName: string): DefenderStepRecord | undefined;
    updateStatus(stepName: string, status: DefenderProposalStatus): void;
    list(): DefenderStepRecord[];
}
//# sourceMappingURL=defenderStore.d.ts.map