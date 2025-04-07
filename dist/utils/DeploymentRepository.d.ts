import { INetworkDeployInfo, FacetsConfig } from "../schemas";
export interface DeploymentRepository {
    loadDeployInfo(path: string, createNew?: boolean): INetworkDeployInfo;
    saveDeployInfo(path: string, info: INetworkDeployInfo): void;
    loadFacetsConfig(path: string): FacetsConfig;
}
//# sourceMappingURL=DeploymentRepository.d.ts.map