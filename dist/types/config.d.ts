export interface DiamondPathsConfig {
    deploymentsPath?: string;
    contractsPath?: string;
    callbacksPath?: string;
    configFilePath?: string;
    deployedDiamondDataFilePath?: string;
    writeDeployedDiamondData?: boolean;
    diamondAbiPath?: string;
}
export interface DiamondsPathsConfig {
    paths: Record<string, DiamondPathsConfig>;
}
export interface DiamondConfig extends DiamondPathsConfig {
    diamondName: string;
    networkName?: string;
    chainId?: bigint | number;
    diamondAbiFileName?: string;
}
export interface FileRepositoryConfig extends DiamondConfig {
    chainId: number;
    networkName: string;
}
export interface DiamondsConfig {
    diamonds: Record<string, DiamondConfig>;
}
//# sourceMappingURL=config.d.ts.map