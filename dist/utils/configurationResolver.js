"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationResolver = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
/**
 * Configuration resolver that supports both standalone and hardhat-diamonds module configurations
 */
class ConfigurationResolver {
    /**
     * Resolves diamond configuration from multiple sources in order of priority:
     * 1. Hardhat-diamonds configuration from hardhat.config.ts (if available)
     * 2. Standalone JSON configuration files
     * 3. Default configuration with conventional paths
     */
    static async resolveDiamondConfig(diamondName, configPath, networkName = 'hardhat', chainId = 31337) {
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
    static async tryLoadHardhatDiamondsConfig(diamondName) {
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
        }
        catch (error) {
            // hardhat-diamonds module not available or not configured
            // This is expected in standalone mode
        }
        return null;
    }
    /**
     * Loads configuration from a standalone JSON config file
     */
    static async loadStandaloneConfig(configPath, diamondName, networkName, chainId) {
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
    static getDefaultConfig(diamondName, networkName, chainId) {
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
    static async ensureDirectoryStructure(config) {
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
exports.ConfigurationResolver = ConfigurationResolver;
//# sourceMappingURL=configurationResolver.js.map