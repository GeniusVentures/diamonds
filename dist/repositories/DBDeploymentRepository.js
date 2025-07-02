// import {
//   readDeployedDiamondData,
//   saveDeploymentInfo,
//   getDeployConfigData
// } from './databaseHandler';
// import { DeploymentRepository } from './DeploymentRepository';
// import { DeployedDiamondData, DeployConfig } from '../schemas';
// export class DbDeploymentRepository implements DeploymentRepository {
//   async loadDeployInfo(key: { network: string; diamond: string }): Promise<DeployedDiamondData> {
//     return await readDeployedDiamondData(key.network, key.diamond);
//   }
//   async saveDeployInfo(key: { network: string; diamond: string }, info: DeployedDiamondData): Promise<void> {
//     await saveDeploymentInfo(key.network, key.diamond, info);
//   }
//   async loadDeployConfig(key: { projectId: string }): Promise<DeployConfig> {
//     return await getDeployConfigData(key.projectId);
//   }
// }
