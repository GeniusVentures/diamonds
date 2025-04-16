// utils/FileDeploymentRepository.ts
import { DeploymentRepository } from './DeploymentRepository';
import { INetworkDeployInfo, DeployConfig } from '../schemas';
import { readDeployFile, writeDeployInfo, readDeployConfig } from './jsonFileHandler';

export class FileDeploymentRepository implements DeploymentRepository {
  loadDeployInfo(path: string, createNew?: boolean): INetworkDeployInfo {
    return readDeployFile(path, createNew);
  }

  saveDeployInfo(path: string, info: INetworkDeployInfo): void {
    writeDeployInfo(path, info);
  }

  loadDeployConfig(path: string): DeployConfig {
    return readDeployConfig(path);
  }
}
