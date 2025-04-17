import { DeploymentRepository } from './DeploymentRepository';
import { DeployedDiamondData, DeployConfig } from '../schemas';
import { readDeployFile, writeDeployInfo, readDeployConfig } from './jsonFileHandler';
import { DiamondConfig } from '../types';
import { join } from 'path';

export class FileDeploymentRepository implements DeploymentRepository {
  private deploymentDataPath: string;
  private deployedDiamondDataFilePath: string;
  private configFilePath: string;
  private writeDeployedDiamondData: boolean;
  private deploymentId: string;

  constructor(config: DiamondConfig) {
    this.deploymentDataPath = config.deploymentsPath! || 'diamonds';
    this.writeDeployedDiamondData = config.writeDeployedDiamondData ?? true;
    this.deploymentId = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId.toString()}`;

    this.deployedDiamondDataFilePath = join(
      this.deploymentDataPath,
      config.diamondName,
      `deployments/${this.deploymentId}.json`
    )

    // Load facets to deploy
    this.configFilePath = join(
      this.deploymentDataPath,
      config.diamondName,
      `${config.diamondName.toLowerCase()}.config.json`
    );
  }

  loadDeployedDiamondData(): DeployedDiamondData {
    return readDeployFile(this.deployedDiamondDataFilePath, this.writeDeployedDiamondData);
  }

  saveDeployedDiamondData(info: DeployedDiamondData): void {
    if (this.writeDeployedDiamondData) {
      writeDeployInfo(this.deployedDiamondDataFilePath, info);
    } else {
      console.log("File deployment Repository configured to ignore writing diamond deployment data.")
    }
  }

  loadDeployConfig(): DeployConfig {
    return readDeployConfig(this.configFilePath);
  }

  public getDeploymentId(): string {
    return this.deploymentId;
  }
}
