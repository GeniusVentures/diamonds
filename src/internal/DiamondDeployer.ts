import { Diamond } from './Diamond';
import { DeploymentManager } from './DeploymentManager';
import { DeploymentStrategy } from '../strategies';
import { DeployedDiamondData } from '../schemas';

export class DiamondDeployer {
  // private provider: JsonRpcProvider;
  private diamond: Diamond;
  private strategy: DeploymentStrategy;

  constructor(
    diamond: Diamond,
    strategy: DeploymentStrategy
  ) {
    this.diamond = diamond;
    this.strategy = strategy;;
  }

  async deployDiamond(): Promise<void> {
    const manager = new DeploymentManager(this.diamond, this.strategy);
    let deployedDiamondData: DeployedDiamondData;
    const deployedData = this.diamond.getDeployedDiamondData();
    if (deployedData && deployedData.DiamondAddress) {
      deployedDiamondData = deployedData;
      console.log(`Diamond already deployed at ${deployedDiamondData.DiamondAddress}. Performing upgrade...`);
      await manager.upgrade();
    } else {
      console.log(`Diamond not previously deployed. Performing initial deployment...`);
      await manager.deploy();
    }
  }

  public getDiamond(): Diamond {
    return this.diamond;
  }
}
