import { DeploymentRepository } from './DeploymentRepository';
import { DeployedDiamondData, DeployConfig } from '../schemas';
import { DiamondConfig } from '../types';
export declare class FileDeploymentRepository implements DeploymentRepository {
    private deploymentDataPath;
    private deployedDiamondDataFilePath;
    private configFilePath;
    private writeDeployedDiamondData;
    private deploymentId;
    constructor(config: DiamondConfig);
    setWriteDeployedDiamondData(write: boolean): void;
    getWriteDeployedDiamondData(): boolean;
    loadDeployedDiamondData(): DeployedDiamondData;
    saveDeployedDiamondData(info: DeployedDiamondData): void;
    loadDeployConfig(): DeployConfig;
    getDeploymentId(): string;
}
//# sourceMappingURL=FileDeploymentRepository.d.ts.map