import { INetworkDeployInfo, FacetsConfig } from "../schemas";

export interface DeploymentRepository {
  // TODO make this generic.  It is using 'path' which implies a file
  loadDeployInfo(path: string, createNew?: boolean): INetworkDeployInfo;
  saveDeployInfo(path: string, info: INetworkDeployInfo): void;
  loadFacetsConfig(path: string): FacetsConfig;
}