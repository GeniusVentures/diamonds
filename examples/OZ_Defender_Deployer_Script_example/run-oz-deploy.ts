import { OZDiamondDeployer } from './OZDiamondDeployer';
import { config } from 'dotenv';
config();

async function main() {
  const deployer = await OZDiamondDeployer.getInstance({
    diamondName: 'GeniusDiamond'
  });

  const diamond = await deployer.deployDiamond();
  console.log(`🚀 Deployed Diamond at: ${diamond.getDeployedDiamondData().DiamondAddress}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
