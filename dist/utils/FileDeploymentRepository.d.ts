import { DeploymentRepository } from './DeploymentRepository';
import { INetworkDeployInfo, DeployConfig } from '../schemas';
export declare class FileDeploymentRepository implements DeploymentRepository {
    loadDeployInfo(path: string, createNew?: boolean): INetworkDeployInfo;
    saveDeployInfo(path: string, info: INetworkDeployInfo): void;
    loadDeployConfig(path: string): DeployConfig;
}
//# sourceMappingURL=FileDeploymentRepository.d.ts.map