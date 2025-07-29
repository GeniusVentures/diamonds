import {
  Diamond,
  DiamondDeployer,
  FileDeploymentRepository,
  DeploymentRepository,
  DiamondConfig,
  cutKey
} from '../../src';
import { RPCDeploymentStrategy } from '../../src/strategies/RPCDeploymentStrategy';
import { JsonRpcProvider, Signer } from 'ethers';
import { join } from 'path';
import chalk from 'chalk';
import { z } from 'zod';

/**
 * Configuration schema for RPC Diamond Deployer
 */
const RPCConfigSchema = z.object({
  rpcUrl: z.string().url('Invalid RPC URL format'),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Private key must be 64 hex characters with 0x prefix'),
  gasLimitMultiplier: z.number().min(1.0).max(2.0).optional().default(1.2),
  maxRetries: z.number().min(1).max(10).optional().default(3),
  retryDelayMs: z.number().min(100).max(30000).optional().default(2000),
});

/**
 * Configuration interface for RPC Diamond Deployer
 */
export interface RPCDiamondDeployerConfig extends DiamondConfig {
  rpcUrl: string;
  privateKey: string;
  gasLimitMultiplier?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  provider?: JsonRpcProvider;
  signer?: Signer;
  verbose?: boolean;
  rpcDiamondDeployerKey?: string;
}

/**
 * Deployment status enumeration
 */
export enum DeploymentStatus {
  NotStarted = 'not_started',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
  UpgradeAvailable = 'upgrade_available'
}

/**
 * RPC Diamond Deployer
 * 
 * Manages diamond deployment and upgrades using direct RPC communication
 * with blockchain networks. Provides singleton pattern with instance management
 * and comprehensive configuration validation.
 */
export class RPCDiamondDeployer {
  private static instances: Map<string, RPCDiamondDeployer> = new Map();
  private deployInProgress: boolean = false;
  private deployComplete: boolean = false;
  private config: RPCDiamondDeployerConfig;
  private diamond: Diamond;
  private strategy: RPCDeploymentStrategy;
  private repository: DeploymentRepository;
  private verbose: boolean;

  /**
   * Private constructor - use getInstance instead
   */
  private constructor(config: RPCDiamondDeployerConfig, repository: DeploymentRepository) {
    this.config = config;
    this.repository = repository;
    this.verbose = config.verbose || false;

    // Create RPC deployment strategy
    this.strategy = new RPCDeploymentStrategy(
      config.rpcUrl,
      config.privateKey,
      config.gasLimitMultiplier,
      config.maxRetries,
      config.retryDelayMs,
      this.verbose
    );

    // Create diamond instance
    this.diamond = new Diamond(config, repository);
    this.diamond.setProvider(this.strategy.getProvider());
    this.diamond.setSigner(this.strategy.getSigner());

    if (this.verbose) {
      console.log(chalk.blue(`🔧 RPCDiamondDeployer initialized for ${config.diamondName}`));
    }
  }

  /**
   * Gets or creates an RPCDiamondDeployer instance
   * 
   * @param config - Configuration object
   * @returns Promise resolving to RPCDiamondDeployer instance
   */
  public static async getInstance(config: RPCDiamondDeployerConfig): Promise<RPCDiamondDeployer> {
    // Validate configuration
    const validatedConfig = RPCConfigSchema.parse({
      rpcUrl: config.rpcUrl,
      privateKey: config.privateKey,
      gasLimitMultiplier: config.gasLimitMultiplier,
      maxRetries: config.maxRetries,
      retryDelayMs: config.retryDelayMs,
    });

    // Initialize provider and get network info
    const provider = new JsonRpcProvider(config.rpcUrl);
    const network = await provider.getNetwork();
    
    // Set network defaults if not provided
    config.networkName = config.networkName || network.name || 'unknown';
    config.chainId = config.chainId || Number(network.chainId);

    // Create unique key for this deployer instance
    const key = config.rpcDiamondDeployerKey || await cutKey(
      config.diamondName,
      config.networkName,
      config.chainId.toString()
    );

    // Return existing instance or create new one
    if (!this.instances.has(key)) {
      // Set default paths if not provided
      const deployedDiamondDataFileName = `${config.diamondName.toLowerCase()}-${config.networkName.toLowerCase()}-${config.chainId}.json`;
      const defaultPaths = {
        deploymentsPath: config.deploymentsPath || 'diamonds',
        contractsPath: config.contractsPath || 'contracts',
        callbacksPath: config.callbacksPath || join('diamonds', config.diamondName, 'callbacks'),
        deployedDiamondDataFilePath: config.deployedDiamondDataFilePath || join(
          'diamonds', 
          config.diamondName, 
          'deployments', 
          deployedDiamondDataFileName
        ),
        configFilePath: config.configFilePath || join(
          'diamonds', 
          config.diamondName, 
          `${config.diamondName.toLowerCase()}.config.json`
        )
      };

      // Apply defaults
      Object.assign(config, defaultPaths);

      // Merge validated RPC config
      Object.assign(config, validatedConfig);

      // Create repository and instance
      const repository = new FileDeploymentRepository(config);
      const instance = new RPCDiamondDeployer(config, repository);
      
      this.instances.set(key, instance);

      if (config.verbose) {
        console.log(chalk.green(`✅ RPCDiamondDeployer instance created with key: ${key}`));
      }
    } else if (config.verbose) {
      console.log(chalk.blue(`🔄 Using existing RPCDiamondDeployer instance with key: ${key}`));
    }

    return this.instances.get(key)!;
  }

  /**
   * Creates configuration from environment variables
   * 
   * @param overrides - Optional configuration overrides
   * @returns RPCDiamondDeployerConfig
   */
  public static createConfigFromEnv(overrides?: Partial<RPCDiamondDeployerConfig>): RPCDiamondDeployerConfig {
    const requiredEnvVars = ['RPC_URL', 'PRIVATE_KEY', 'DIAMOND_NAME'];
    
    // Check required environment variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    const config: RPCDiamondDeployerConfig = {
      diamondName: process.env.DIAMOND_NAME!,
      rpcUrl: process.env.RPC_URL!,
      privateKey: process.env.PRIVATE_KEY!,
      networkName: process.env.NETWORK_NAME,
      chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : undefined,
      gasLimitMultiplier: process.env.GAS_LIMIT_MULTIPLIER ? parseFloat(process.env.GAS_LIMIT_MULTIPLIER) : undefined,
      maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : undefined,
      retryDelayMs: process.env.RETRY_DELAY_MS ? parseInt(process.env.RETRY_DELAY_MS) : undefined,
      verbose: process.env.VERBOSE === 'true',
      
      // Path configurations
      deploymentsPath: process.env.DEPLOYMENTS_PATH,
      contractsPath: process.env.CONTRACTS_PATH,
      configFilePath: process.env.DIAMOND_CONFIG_PATH,
      
      // Override with provided values
      ...overrides
    };

    return config;
  }

  /**
   * Deploys or upgrades the diamond
   * 
   * @returns Promise resolving to Diamond instance
   */
  public async deployDiamond(): Promise<Diamond> {
    if (this.deployComplete) {
      if (this.verbose) {
        console.log(chalk.blue(`📦 Diamond ${this.config.diamondName} already deployed`));
      }
      return this.diamond;
    }

    if (this.deployInProgress) {
      if (this.verbose) {
        console.log(chalk.yellow(`⏳ Deployment already in progress for ${this.config.diamondName}. Waiting...`));
      }
      
      while (this.deployInProgress) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return this.diamond;
    }

    this.deployInProgress = true;

    try {
      if (this.verbose) {
        console.log(chalk.yellowBright(`\n🚀 Starting diamond deployment for ${this.config.diamondName}`));
        console.log(chalk.blue(`🌐 Network: ${this.config.networkName} (Chain ID: ${this.config.chainId})`));
        console.log(chalk.blue(`🔗 RPC URL: ${this.config.rpcUrl}`));
      }

      // Validate connection before deployment
      await this.strategy.validateConnection();

      // Create deployer and execute deployment
      const deployer = new DiamondDeployer(this.diamond, this.strategy);
      await deployer.deployDiamond();

      this.deployComplete = true;
      
      if (this.verbose) {
        console.log(chalk.green(`✅ Diamond deployment completed successfully!`));
        const deployedData = this.diamond.getDeployedDiamondData();
        if (deployedData.DiamondAddress) {
          console.log(chalk.green(`💎 Diamond Address: ${deployedData.DiamondAddress}`));
        }
      }

      return this.diamond;
    } catch (error) {
      console.error(chalk.red(`❌ Diamond deployment failed: ${(error as Error).message}`));
      throw error;
    } finally {
      this.deployInProgress = false;
    }
  }

  /**
   * Gets the deployed diamond instance
   * 
   * @returns Promise resolving to Diamond instance
   */
  public async getDiamondDeployed(): Promise<Diamond> {
    if (!this.deployComplete) {
      return await this.deployDiamond();
    }
    return this.diamond;
  }

  /**
   * Sets verbose logging
   * 
   * @param verbose - Enable verbose logging
   */
  public async setVerbose(verbose: boolean): Promise<void> {
    this.verbose = verbose;
    this.config.verbose = verbose;
    
    // Update strategy verbose setting if possible
    if (this.strategy && typeof (this.strategy as any).setVerbose === 'function') {
      (this.strategy as any).setVerbose(verbose);
    }
  }

  /**
   * Gets deployment status
   * 
   * @returns Current deployment status
   */
  public getDeploymentStatus(): DeploymentStatus {
    if (this.deployComplete) {
      const deployedData = this.diamond.getDeployedDiamondData();
      const currentConfig = this.diamond.getDeployConfig();
      
      // Check if upgrade is available by comparing protocol versions
      if (deployedData.protocolVersion && currentConfig.protocolVersion) {
        if (currentConfig.protocolVersion > deployedData.protocolVersion) {
          return DeploymentStatus.UpgradeAvailable;
        }
      }
      
      return DeploymentStatus.Completed;
    }
    
    if (this.deployInProgress) {
      return DeploymentStatus.InProgress;
    }
    
    return DeploymentStatus.NotStarted;
  }

  /**
   * Checks if diamond is deployed
   * 
   * @returns True if diamond is deployed
   */
  public isDiamondDeployed(): boolean {
    const deployedData = this.diamond.getDeployedDiamondData();
    return !!(deployedData && deployedData.DiamondAddress);
  }

  /**
   * Gets the configuration
   * 
   * @returns Configuration object
   */
  public getConfig(): RPCDiamondDeployerConfig {
    return { ...this.config };
  }

  /**
   * Gets the diamond instance
   * 
   * @returns Diamond instance
   */
  public getDiamond(): Diamond {
    return this.diamond;
  }

  /**
   * Gets the deployment strategy
   * 
   * @returns RPCDeploymentStrategy instance
   */
  public getStrategy(): RPCDeploymentStrategy {
    return this.strategy;
  }

  /**
   * Gets the deployment repository
   * 
   * @returns DeploymentRepository instance
   */
  public getRepository(): DeploymentRepository {
    return this.repository;
  }

  /**
   * Validates the current configuration
   * 
   * @returns Promise resolving to validation result
   */
  public async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validate RPC configuration
      RPCConfigSchema.parse({
        rpcUrl: this.config.rpcUrl,
        privateKey: this.config.privateKey,
        gasLimitMultiplier: this.config.gasLimitMultiplier,
        maxRetries: this.config.maxRetries,
        retryDelayMs: this.config.retryDelayMs,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push(`Configuration validation error: ${(error as Error).message}`);
      }
    }

    try {
      // Validate network connection
      await this.strategy.validateConnection();
    } catch (error) {
      errors.push(`Network connection error: ${(error as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets network information
   * 
   * @returns Promise resolving to network information
   */
  public async getNetworkInfo() {
    const provider = this.strategy.getProvider();
    const signer = this.strategy.getSigner();
    
    const [network, balance, gasPrice] = await Promise.all([
      provider.getNetwork(),
      provider.getBalance(signer.address),
      provider.getGasPrice()
    ]);

    return {
      networkName: network.name,
      chainId: Number(network.chainId),
      signerAddress: signer.address,
      balance: balance.toString(),
      gasPrice: gasPrice.toString()
    };
  }
}
