import { INetworkDeployInfo, FacetsConfig } from "../schemas";
export interface DeploymentRepository {
    loadDeployInfo(path: string): INetworkDeployInfo;
    saveDeployInfo(path: string, info: INetworkDeployInfo): void;
    loadFacetsConfig(path: string): FacetsConfig;
}
//# sourceMappingURL=DeploymentRepository.d.ts.map