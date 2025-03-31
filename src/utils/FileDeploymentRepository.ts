// utils/FileDeploymentRepository.ts
import { DeploymentRepository } from './DeploymentRepository';
import { INetworkDeployInfo, FacetsConfig } from '../schemas';
import { readDeployFile, writeDeployInfo, readFacetsConfig } from './jsonFileHandler';

export class FileDeploymentRepository implements DeploymentRepository {
  loadDeployInfo(path: string): INetworkDeployInfo {
    return readDeployFile(path, true);
  }

  saveDeployInfo(path: string, info: INetworkDeployInfo): void {
    writeDeployInfo(path, info);
  }

  loadFacetsConfig(path: string): FacetsConfig {
    return readFacetsConfig(path);
  }
}
