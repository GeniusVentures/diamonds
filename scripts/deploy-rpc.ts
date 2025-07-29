#!/usr/bin/env npx ts-node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { RPCDiamondDeployer, RPCDiamondDeployerConfig, DeploymentStatus } from './setup/RPCDiamondDeployer';
import { Diamond } from '../src/core/Diamond';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('deploy-rpc')
  .description('Deploy diamonds using direct RPC communication')
  .version('1.0.0');

/**
 * Deployment options interface
 */
interface DeploymentOptions {
  diamondName: string;
  networkName?: string;
  rpcUrl?: string;
  privateKey?: string;
  verbose?: boolean;
  gasLimitMultiplier?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  configPath?: string;
  deploymentsPath?: string;
}

/**
 * Validates required options
 */
function validateOptions(options: DeploymentOptions): void {
  const errors: string[] = [];

  if (!options.diamondName) {
    errors.push('Diamond name is required (--diamond-name or DIAMOND_NAME)');
  }

  if (!options.rpcUrl) {
    errors.push('RPC URL is required (--rpc-url or RPC_URL)');
  }

  if (!options.privateKey) {
    errors.push('Private key is required (--private-key or PRIVATE_KEY)');
  }

  if (errors.length > 0) {
    console.error(chalk.red('❌ Validation errors:'));
    errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
    process.exit(1);
  }
}

/**
 * Creates configuration from options
 */
function createConfig(options: DeploymentOptions): RPCDiamondDeployerConfig {
  const config: RPCDiamondDeployerConfig = {
    diamondName: options.diamondName,
    rpcUrl: options.rpcUrl!,
    privateKey: options.privateKey!,
    networkName: options.networkName,
    verbose: options.verbose || false,
    gasLimitMultiplier: options.gasLimitMultiplier,
    maxRetries: options.maxRetries,
    retryDelayMs: options.retryDelayMs,
    configFilePath: options.configPath,
    deploymentsPath: options.deploymentsPath,
  };

  return config;
}

/**
 * Prints deployment summary
 */
function printDeploymentSummary(diamond: Diamond, deployer: RPCDiamondDeployer): void {
  const deployedData = diamond.getDeployedDiamondData();
  const config = deployer.getConfig();

  console.log(chalk.greenBright('\n🎉 Deployment Summary'));
  console.log(chalk.green('='.repeat(50)));
  console.log(chalk.blue(`💎 Diamond Name: ${config.diamondName}`));
  console.log(chalk.blue(`🌐 Network: ${config.networkName} (Chain ID: ${config.chainId})`));
  console.log(chalk.blue(`📍 Diamond Address: ${deployedData.DiamondAddress}`));
  console.log(chalk.blue(`👤 Deployer: ${deployedData.DeployerAddress}`));
  
  if (deployedData.protocolVersion) {
    console.log(chalk.blue(`📋 Protocol Version: ${deployedData.protocolVersion}`));
  }

  if (deployedData.DeployedFacets) {
    const facetCount = Object.keys(deployedData.DeployedFacets).length;
    console.log(chalk.blue(`🔧 Facets Deployed: ${facetCount}`));
    
    if (config.verbose) {
      console.log(chalk.gray('\nDeployed Facets:'));
      Object.entries(deployedData.DeployedFacets).forEach(([name, facet]) => {
        console.log(chalk.gray(`  - ${name}: ${facet.address} (v${facet.version})`));
        console.log(chalk.gray(`    Selectors: ${facet.funcSelectors?.length || 0}`));
      });
    }
  }

  console.log(chalk.green('='.repeat(50)));
}

/**
 * Main deployment function
 */
async function deployDiamond(options: DeploymentOptions): Promise<void> {
  try {
    console.log(chalk.yellowBright('🚀 Starting RPC Diamond Deployment'));
    console.log(chalk.blue(`📦 Diamond: ${options.diamondName}`));
    console.log(chalk.blue(`🔗 RPC URL: ${options.rpcUrl}`));

    // Create configuration
    const config = createConfig(options);

    // Create deployer instance
    const deployer = await RPCDiamondDeployer.getInstance(config);

    // Validate configuration
    if (options.verbose) {
      console.log(chalk.blue('\n🔍 Validating configuration...'));
      const validation = await deployer.validateConfiguration();
      
      if (!validation.valid) {
        console.error(chalk.red('❌ Configuration validation failed:'));
        validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
      }
      
      console.log(chalk.green('✅ Configuration is valid'));

      // Print network info
      const networkInfo = await deployer.getNetworkInfo();
      console.log(chalk.blue(`🌐 Connected to: ${networkInfo.networkName} (${networkInfo.chainId})`));
      console.log(chalk.blue(`👤 Deployer: ${networkInfo.signerAddress}`));
      console.log(chalk.blue(`💰 Balance: ${Number(networkInfo.balance) / 1e18} ETH`));
    }

    // Check current status
    const status = deployer.getDeploymentStatus();
    console.log(chalk.blue(`📊 Current Status: ${status}`));

    if (status === DeploymentStatus.Completed) {
      console.log(chalk.yellow('⚠️ Diamond is already deployed'));
      console.log(chalk.blue('💡 Use upgrade-rpc.ts to perform upgrades'));
      const diamond = deployer.getDiamond();
      printDeploymentSummary(diamond, deployer);
      return;
    }

    if (status === DeploymentStatus.UpgradeAvailable) {
      console.log(chalk.cyan('🔄 Upgrade available - proceeding with upgrade...'));
    }

    // Deploy diamond
    console.log(chalk.yellowBright('\n🎯 Executing deployment...'));
    const diamond = await deployer.deployDiamond();

    // Print success message and summary
    console.log(chalk.green('\n✅ Diamond deployment completed successfully!'));
    printDeploymentSummary(diamond, deployer);

  } catch (error) {
    console.error(chalk.red(`\n❌ Deployment failed: ${(error as Error).message}`));
    
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// CLI command setup
program
  .command('deploy')
  .description('Deploy a diamond using RPC')
  .option('-d, --diamond-name <name>', 'Name of the diamond to deploy', process.env.DIAMOND_NAME)
  .option('-r, --rpc-url <url>', 'RPC endpoint URL', process.env.RPC_URL)
  .option('-k, --private-key <key>', 'Private key for deployment', process.env.PRIVATE_KEY)
  .option('-n, --network-name <name>', 'Network name', process.env.NETWORK_NAME)
  .option('-c, --config-path <path>', 'Path to diamond configuration file', process.env.DIAMOND_CONFIG_PATH)
  .option('-p, --deployments-path <path>', 'Path to deployments directory', process.env.DEPLOYMENTS_PATH)
  .option('-g, --gas-limit-multiplier <multiplier>', 'Gas limit multiplier (1.0-2.0)', 
    val => parseFloat(val), parseFloat(process.env.GAS_LIMIT_MULTIPLIER || '1.2'))
  .option('-m, --max-retries <retries>', 'Maximum number of retries (1-10)', 
    val => parseInt(val), parseInt(process.env.MAX_RETRIES || '3'))
  .option('-t, --retry-delay-ms <delay>', 'Retry delay in milliseconds (100-30000)', 
    val => parseInt(val), parseInt(process.env.RETRY_DELAY_MS || '2000'))
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: DeploymentOptions) => {
    validateOptions(options);
    await deployDiamond(options);
  });

// Quick deploy command that uses environment variables
program
  .command('quick')
  .description('Quick deploy using environment variables')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: { verbose?: boolean }) => {
    try {
      const config = RPCDiamondDeployer.createConfigFromEnv({ verbose: options.verbose });
      const deployOptions: DeploymentOptions = {
        diamondName: config.diamondName,
        rpcUrl: config.rpcUrl,
        privateKey: config.privateKey,
        networkName: config.networkName,
        verbose: config.verbose,
        gasLimitMultiplier: config.gasLimitMultiplier,
        maxRetries: config.maxRetries,
        retryDelayMs: config.retryDelayMs,
        configPath: config.configFilePath,
        deploymentsPath: config.deploymentsPath,
      };

      await deployDiamond(deployOptions);
    } catch (error) {
      console.error(chalk.red(`❌ Quick deploy failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check deployment status')
  .option('-d, --diamond-name <name>', 'Name of the diamond', process.env.DIAMOND_NAME)
  .option('-r, --rpc-url <url>', 'RPC endpoint URL', process.env.RPC_URL)
  .option('-k, --private-key <key>', 'Private key', process.env.PRIVATE_KEY)
  .option('-n, --network-name <name>', 'Network name', process.env.NETWORK_NAME)
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: DeploymentOptions) => {
    try {
      validateOptions(options);
      const config = createConfig(options);
      const deployer = await RPCDiamondDeployer.getInstance(config);
      
      console.log(chalk.blue('📊 Deployment Status Check'));
      console.log(chalk.blue('='.repeat(30)));
      
      const status = deployer.getDeploymentStatus();
      const isDeployed = deployer.isDiamondDeployed();
      
      console.log(chalk.blue(`📍 Diamond: ${config.diamondName}`));
      console.log(chalk.blue(`🌐 Network: ${config.networkName}`));
      console.log(chalk.blue(`📊 Status: ${status}`));
      console.log(chalk.blue(`✅ Deployed: ${isDeployed ? 'Yes' : 'No'}`));
      
      if (isDeployed) {
        const diamond = deployer.getDiamond();
        const deployedData = diamond.getDeployedDiamondData();
        console.log(chalk.blue(`📍 Address: ${deployedData.DiamondAddress}`));
        
        if (deployedData.DeployedFacets) {
          const facetCount = Object.keys(deployedData.DeployedFacets).length;
          console.log(chalk.blue(`🔧 Facets: ${facetCount}`));
        }
      }
      
      if (options.verbose) {
        const networkInfo = await deployer.getNetworkInfo();
        console.log(chalk.gray('\nNetwork Information:'));
        console.log(chalk.gray(`  Chain ID: ${networkInfo.chainId}`));
        console.log(chalk.gray(`  Deployer: ${networkInfo.signerAddress}`));
        console.log(chalk.gray(`  Balance: ${Number(networkInfo.balance) / 1e18} ETH`));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Status check failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
