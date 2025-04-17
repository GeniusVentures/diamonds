// DeploymentRepository.ts
import { DeployedDiamondData, DeployConfig } from "../schemas";

export abstract class DeploymentRepository {
  abstract loadDeployedDiamondData(): DeployedDiamondData;

  abstract saveDeployedDiamondData(info: DeployedDiamondData): void;

  abstract loadDeployConfig(): DeployConfig;

  abstract getDeploymentId(): string;
}
