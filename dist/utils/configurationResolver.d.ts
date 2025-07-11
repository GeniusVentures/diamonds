import { DiamondConfig } from '../types';
/**
 * Configuration resolver that supports both standalone and hardhat-diamonds module configurations
 */
export declare class ConfigurationResolver {
    /**
     * Resolves diamond configuration from multiple sources in order of priority:
     * 1. Hardhat-diamonds configuration from hardhat.config.ts (if available)
     * 2. Standalone JSON configuration files
     * 3. Default configuration with conventional paths
     */
    static resolveDiamondConfig(diamondName: string, configPath?: string, networkName?: string, chainId?: number): Promise<DiamondConfig>;
    /**
     * Attempts to load configuration from hardhat-diamonds module
     */
    private static tryLoadHardhatDiamondsConfig;
    /**
     * Loads configuration from a standalone JSON config file
     */
    private static loadStandaloneConfig;
    /**
     * Returns default configuration using conventional paths
     */
    private static getDefaultConfig;
    /**
     * Creates the necessary directory structure for a diamond configuration
     */
    static ensureDirectoryStructure(config: DiamondConfig): Promise<void>;
}
//# sourceMappingURL=configurationResolver.d.ts.map