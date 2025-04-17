import { DeployedDiamondData, DeployConfig } from "../schemas";
export declare abstract class DeploymentRepository {
    abstract loadDeployedDiamondData(): DeployedDiamondData;
    abstract saveDeployedDiamondData(info: DeployedDiamondData): void;
    abstract loadDeployConfig(): DeployConfig;
    abstract getDeploymentId(): string;
}
//# sourceMappingURL=DeploymentRepository.d.ts.map