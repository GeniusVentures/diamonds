export interface DiamondPathsConfig {
  deploymentsPath?: string;
  contractsPath?: string;
  callbacksPath?: string;
}

export interface DiamondsPathsConfig {
  paths: Record<string, DiamondPathsConfig>;
}

export interface DiamondConfig extends DiamondPathsConfig {
  diamondName: string;
  networkName: string;
  chainId: number;

}
export interface DiamondsConfig {
  diamonds: Record<string, DiamondConfig>;
}
