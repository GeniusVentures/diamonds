import { INetworkDeployInfo, DeployConfig } from "../schemas";

export interface DeploymentRepository {
  // TODO make this generic.  It is using 'path' which implies a file
  loadDeployInfo(path: string, createNew?: boolean): INetworkDeployInfo;
  saveDeployInfo(path: string, info: INetworkDeployInfo): void;
  loadDeployConfig(path: string): DeployConfig;
}