// // databaseHandler.ts (Prisma example)
// import { prisma } from './prisma';
// import { DeployedDiamondData, DeployConfig } from '../schemas';
// export async function readDeployedDiamondData(network: string, diamond: string): Promise<DeployedDiamondData> {
//   const record = await prisma.deployment.findUnique({
//     where: { network_diamond: { network, diamond } }
//   });
//   return record?.info as DeployedDiamondData;
// }
