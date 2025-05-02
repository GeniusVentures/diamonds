import { JsonRpcProvider } from "@ethersproject/providers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DeploymentRepository } from "../repositories";
import { Diamond } from "../internal";

export interface DiamondPathsConfig {
  deploymentsPath?: string;
  contractsPath?: string;
  callbacksPath?: string;
  configFilePath?: string;
  deployedDiamondDataFilePath?: string
  writeDeployedDiamondData?: boolean;
}

export interface DiamondsPathsConfig {
  paths: Record<string, DiamondPathsConfig>;
}

export interface DiamondConfig extends DiamondPathsConfig {
  diamondName: string;
  networkName?: string;
  chainId?: number;
}

export interface FileRepositoryConfig extends DiamondConfig {
  chainId: number;
  networkName: string;
}

export interface DiamondsConfig {
  diamonds: Record<string, DiamondConfig>;
}
