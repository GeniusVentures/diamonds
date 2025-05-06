export interface DiamondPathsConfig {
    deploymentsPath?: string;
    contractsPath?: string;
    callbacksPath?: string;
    configFilePath?: string;
    deployedDiamondDataFilePath?: string;
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
//# sourceMappingURL=config.d.ts.map