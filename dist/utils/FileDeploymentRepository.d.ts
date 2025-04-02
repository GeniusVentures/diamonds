import { DeploymentRepository } from './DeploymentRepository';
import { INetworkDeployInfo, FacetsConfig } from '../schemas';
export declare class FileDeploymentRepository implements DeploymentRepository {
    loadDeployInfo(path: string): INetworkDeployInfo;
    saveDeployInfo(path: string, info: INetworkDeployInfo): void;
    loadFacetsConfig(path: string): FacetsConfig;
}
//# sourceMappingURL=FileDeploymentRepository.d.ts.map