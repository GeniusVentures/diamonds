import { DiamondConfig } from '../types';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Configuration resolver that supports both standalone and hardhat-diamonds module configurations
 */
export class ConfigurationResolver {
  /**
   * Resolves diamond configuration from multiple sources in order of priority:
   * 1. Hardhat-diamonds configuration from hardhat.config.ts (if available)
   * 2. Standalone JSON configuration files
   * 3. Default configuration with conventional paths
   */
  static async resolveDiamondConfig(
    diamondName: string,
    configPath?: string,
    networkName: string = 'hardhat',
    chainId: number = 31337
  ): Promise<DiamondConfig> {

    // Try to get configuration from hardhat-diamonds module if available
    const hardhatConfig = await this.tryLoadHardhatDiamondsConfig(diamondName);
    if (hardhatConfig) {
      return hardhatConfig;
    }

    // Try to load from provided config path
    if (configPath && await fs.pathExists(configPath)) {
      return await this.loadStandaloneConfig(configPath, diamondName, networkName, chainId);
    }

    // Try to find config in conventional locations
    const conventionalPaths = [
      path.join(process.cwd(), 'diamonds', diamondName, `${diamondName.toLowerCase()}.config.json`),
      path.join(process.cwd(), `${diamondName.toLowerCase()}.config.json`),
      path.join(process.cwd(), 'diamond.config.json'),
    ];

    for (const conventionalPath of conventionalPaths) {
      if (await fs.pathExists(conventionalPath)) {
        return await this.loadStandaloneConfig(conventionalPath, diamondName, networkName, chainId);
      }
    }

    // Return default configuration
    return this.getDefaultConfig(diamondName, networkName, chainId);
  }

  /**
   * Attempts to load configuration from hardhat-diamonds module
   */
  private static async tryLoadHardhatDiamondsConfig(diamondName: string): Promise<DiamondConfig | null> {
    try {
      // Try to import hardhat-diamonds configuration
      const hardhatRuntime = require('hardhat');

      // Check if hardhat-diamonds plugin is loaded
      if (hardhatRuntime.config.diamonds && hardhatRuntime.config.diamonds[diamondName]) {
        const hardhatDiamondConfig = hardhatRuntime.config.diamonds[diamondName];

        return {
          diamondName,
          networkName: hardhatRuntime.network.name,
          chainId: hardhatRuntime.network.config.chainId || 31337,
          deploymentsPath: hardhatDiamondConfig.deploymentsPath || path.join(process.cwd(), 'diamonds'),
          contractsPath: hardhatDiamondConfig.contractsPath || path.join(process.cwd(), 'contracts'),
          callbacksPath: hardhatDiamondConfig.callbacksPath || path.join(process.cwd(), 'diamonds', diamondName, 'callbacks'),
          configFilePath: hardhatDiamondConfig.configFilePath || path.join(process.cwd(), 'diamonds', diamondName, `${diamondName.toLowerCase()}.config.json`),
          deployedDiamondDataFilePath: hardhatDiamondConfig.deployedDiamondDataFilePath || path.join(process.cwd(), 'diamonds', diamondName, 'deployments', `${diamondName.toLowerCase()}-${hardhatRuntime.network.name}-${hardhatRuntime.network.config.chainId}.json`),
        };
      }
    } catch (error) {
      // hardhat-diamonds module not available or not configured
      // This is expected in standalone mode
    }

    return null;
  }

  /**
   * Loads configuration from a standalone JSON config file
   */
  private static async loadStandaloneConfig(
    configPath: string,
    diamondName: string,
    networkName: string,
    chainId: number
  ): Promise<DiamondConfig> {
    const configDir = path.dirname(configPath);

    return {
      diamondName,
      networkName,
      chainId,
      deploymentsPath: path.join(configDir, 'deployments'),
      contractsPath: path.join(process.cwd(), 'contracts'),
      callbacksPath: path.join(configDir, 'callbacks'),
      configFilePath: configPath,
      deployedDiamondDataFilePath: path.join(configDir, 'deployments', `${diamondName.toLowerCase()}-${networkName}-${chainId}.json`),
    };
  }

  /**
   * Returns default configuration using conventional paths
   */
  private static getDefaultConfig(
    diamondName: string,
    networkName: string,
    chainId: number
  ): DiamondConfig {
    return {
      diamondName,
      networkName,
      chainId,
      deploymentsPath: path.join(process.cwd(), 'diamonds'),
      contractsPath: path.join(process.cwd(), 'contracts'),
      callbacksPath: path.join(process.cwd(), 'diamonds', diamondName, 'callbacks'),
      configFilePath: path.join(process.cwd(), 'diamonds', diamondName, `${diamondName.toLowerCase()}.config.json`),
      deployedDiamondDataFilePath: path.join(process.cwd(), 'diamonds', diamondName, 'deployments', `${diamondName.toLowerCase()}-${networkName}-${chainId}.json`),
    };
  }

  /**
   * Creates the necessary directory structure for a diamond configuration
   */
  static async ensureDirectoryStructure(config: DiamondConfig): Promise<void> {
    if (config.deploymentsPath) {
      await fs.ensureDir(config.deploymentsPath);
    }
    if (config.configFilePath) {
      await fs.ensureDir(path.dirname(config.configFilePath));
    }
    if (config.callbacksPath) {
      await fs.ensureDir(config.callbacksPath);
    }
    if (config.deployedDiamondDataFilePath) {
      await fs.ensureDir(path.dirname(config.deployedDiamondDataFilePath));
    }
  }
}
