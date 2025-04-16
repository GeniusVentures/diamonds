import { INetworkDeployInfo, DeployConfig } from "../schemas";
export interface DeploymentRepository {
    loadDeployInfo(path: string, createNew?: boolean): INetworkDeployInfo;
    saveDeployInfo(path: string, info: INetworkDeployInfo): void;
    loadDeployConfig(path: string): DeployConfig;
}
//# sourceMappingURL=DeploymentRepository.d.ts.map