export interface DiamondConfig {
    path?: string;
    deployments_path?: string;
    facets_path?: string;
    include: string[];
    exclude: string[];
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
    // diamonds?: Record<string, DiamondConfig>;
    diamondsConfig?: Record<string, DiamondConfig>;
  }