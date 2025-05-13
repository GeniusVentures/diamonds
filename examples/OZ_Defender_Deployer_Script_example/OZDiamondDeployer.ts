import {
  Diamond,
  DiamondDeployer,
  FileDeploymentRepository,
  DeploymentRepository,
  DiamondConfig,
  cutKey
} from '@gnus.ai/diamonds';

import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { OZDefenderDeploymentStrategy } from '@gnus.ai/diamonds'; // Adjust based on your export path
import { join } from 'path';

export interface OZDiamondDeployerConfig extends DiamondConfig {
  provider?: JsonRpcProvider;
  signer?: SignerWithAddress;
  ozDiamondDeployerKey?: string;
}

export class OZDiamondDeployer {
  private static instances: Map<string, OZDiamondDeployer> = new Map();
  private deployInProgress = false;
  private deployComplete = false;
  private config: OZDiamondDeployerConfig;
  private diamond: Diamond;
  private provider: JsonRpcProvider;
  private signer: SignerWithAddress;
  private repository: DeploymentRepository;

  constructor(config: OZDiamondDeployerConfig, repository: DeploymentRepository) {
    this.config = config;
    this.provider = config.provider || ethers.provider;
    this.signer = config.signer!;
    this.repository = repository;

    this.diamond = new Diamond(config, repository);
    this.diamond.setProvider(this.provider);
    this.diamond.setSigner(this.signer);
  }

  public static async getInstance(config: OZDiamondDeployerConfig): Promise<OZDiamondDeployer> {
    config.provider = config.provider || ethers.provider;

    const net = await config.provider.getNetwork();
    config.networkName = config.networkName || (net.name === 'unknown' ? 'hardhat' : net.name);
    config.chainId = config.chainId || net.chainId;

    const key = config.ozDiamondDeployerKey || await cutKey(config.diamondName, config.networkName, config.chainId.toString());

    if (!this.instances.has(key)) {
      const defaultPaths = {
        deploymentsPath: 'diamonds',
        contractsPath: 'contracts',
        callbacksPath: join('diamonds', config.diamondName, 'callbacks'),
        deployedDiamondDataFilePath: join('diamonds', config.diamondName, 'deployments', `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId}.json`),
        configFilePath: join('diamonds', config.diamondName, `${config.diamondName.toLowerCase()}.config.json`)
      };

      config.deploymentsPath ||= defaultPaths.deploymentsPath;
      config.contractsPath ||= defaultPaths.contractsPath;
      config.callbacksPath ||= defaultPaths.callbacksPath;
      config.deployedDiamondDataFilePath ||= defaultPaths.deployedDiamondDataFilePath;
      config.configFilePath ||= defaultPaths.configFilePath;

      const repository = new FileDeploymentRepository(config);
      const [signer0] = await ethers.getSigners();
      config.signer = signer0;

      const instance = new OZDiamondDeployer(config, repository);
      this.instances.set(key, instance);
    }

    return this.instances.get(key)!;
  }

  public async deployDiamond(): Promise<Diamond> {
    if (this.deployComplete) return this.diamond;
    if (this.deployInProgress) {
      console.log(`Deployment already in progress. Waiting...`);
      while (this.deployInProgress) await new Promise(res => setTimeout(res, 1000));
      return this.diamond;
    }

    this.deployInProgress = true;
    const strategy = new OZDefenderDeploymentStrategy(
      process.env.DEFENDER_API_KEY!,
      process.env.DEFENDER_API_SECRET!,
      process.env.DEFENDER_RELAYER_ADDRESS!, // required
      true, // auto-approve
      process.env.DEFENDER_SAFE_ADDRESS!,
      'Safe' // TODO this should be configurable.
    );

    const deployer = new DiamondDeployer(this.diamond, strategy);
    await deployer.deployDiamond();

    this.deployComplete = true;
    this.deployInProgress = false;
    return deployer.getDiamond();
  }

  public async getDiamond(): Promise<Diamond> {
    return this.diamond;
  }
}
