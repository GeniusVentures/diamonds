import { JsonRpcProvider } from "@ethersproject/providers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DeploymentRepository } from "../repositories";

export interface DiamondPathsConfig {
  deploymentsPath?: string;
  contractsPath?: string;
  callbacksPath?: string;
  writeDeployedDiamondData?: boolean;
}

export interface DiamondsPathsConfig {
  paths: Record<string, DiamondPathsConfig>;
}

export interface DiamondConfig extends DiamondPathsConfig {
  diamondName: string;
  networkName: string;
  chainId: number;
  provider?: JsonRpcProvider;
  signer?: SignerWithAddress;
}
export interface DiamondsConfig {
  diamonds: Record<string, DiamondConfig>;
}
