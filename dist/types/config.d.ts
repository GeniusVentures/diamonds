export interface DiamondConfig {
    diamondName: string;
    networkName: string;
    chainId: number;
    deploymentsPath: string;
    contractsPath: string;
}
/**
 * Matches the structure:
 *
 *  diamonds: [
 *    ProxyDiamond: {
 *      path: '...',
 *      deployments_data: '...',
 *      facets_path: '...',
 *      include: [...],
 *      exclude: [...]
 *    },
 *    GeniusDiamond: {
 *      contracts_path: '...',
 *      diamond_deployments_path: '...',
 *      facets: [...]
 *    },
 *  ],
 */
export interface DiamondsUserConfig {
    diamondsConfig?: Record<string, DiamondConfig>;
}
//# sourceMappingURL=config.d.ts.map