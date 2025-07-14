import { JsonRpcProvider } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DeploymentRepository } from "../repositories";
import { Diamond } from "../core";

export interface DiamondPathsConfig {
  deploymentsPath?: string;
  contractsPath?: string;
  callbacksPath?: string;
  configFilePath?: string;
  deployedDiamondDataFilePath?: string
  writeDeployedDiamondData?: boolean;
  diamondAbiPath?: string;
}

export interface DiamondsPathsConfig {
  paths: Record<string, DiamondPathsConfig>;
}

export interface DiamondConfig extends DiamondPathsConfig {
  diamondName: string;
  networkName?: string;
  chainId?: number;
  diamondAbiFileName?: string;
}

export interface FileRepositoryConfig extends DiamondConfig {
  chainId: number;
  networkName: string;
}

export interface DiamondsConfig {
  diamonds: Record<string, DiamondConfig>;
}
