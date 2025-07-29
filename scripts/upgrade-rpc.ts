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
  .name('upgrade-rpc')
  .description('Upgrade diamonds using direct RPC communication')
  .version('1.0.0');

/**
 * Upgrade options interface
 */
interface UpgradeOptions {
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
  targetVersion?: number;
  force?: boolean;
  dryRun?: boolean;
}

/**
 * Validates required options
 */
function validateOptions(options: UpgradeOptions): void {
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
function createConfig(options: UpgradeOptions): RPCDiamondDeployerConfig {
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
 * Checks what will be upgraded
 */
function analyzeUpgrade(diamond: Diamond): void {
  const deployedData = diamond.getDeployedDiamondData();
  const currentConfig = diamond.getDeployConfig();
  const newDeployedFacets = diamond.getNewDeployedFacets();

  console.log(chalk.blueBright('\n🔍 Upgrade Analysis'));
  console.log(chalk.blue('='.repeat(40)));

  // Protocol version comparison
  if (deployedData.protocolVersion && currentConfig.protocolVersion) {
    console.log(chalk.blue(`📋 Protocol Version: ${deployedData.protocolVersion} → ${currentConfig.protocolVersion}`));
  }

  // Facet analysis
  const currentFacets = deployedData.DeployedFacets || {};
  const configFacets = currentConfig.facets || {};

  console.log(chalk.blue('\n🔧 Facet Changes:'));

  // Check for new facets
  const newFacets = Object.keys(configFacets).filter(name => !currentFacets[name]);
  if (newFacets.length > 0) {
    console.log(chalk.green(`  ➕ New Facets: ${newFacets.join(', ')}`));
  }

  // Check for updated facets
  const updatedFacets: string[] = [];
  Object.keys(configFacets).forEach(name => {
    if (currentFacets[name]) {
      const currentVersion = currentFacets[name].version || 0;
      const configVersions = Object.keys(configFacets[name].versions || {}).map(Number);
      const latestVersion = Math.max(...configVersions);
      
      if (latestVersion > currentVersion) {
        updatedFacets.push(`${name} (v${currentVersion} → v${latestVersion})`);
      }
    }
  });

  if (updatedFacets.length > 0) {
    console.log(chalk.yellow(`  🔄 Updated Facets: ${updatedFacets.join(', ')}`));
  }

  // Check for removed facets
  const removedFacets = Object.keys(currentFacets).filter(name => !configFacets[name]);
  if (removedFacets.length > 0) {
    console.log(chalk.red(`  ➖ Removed Facets: ${removedFacets.join(', ')}`));
  }

  if (newFacets.length === 0 && updatedFacets.length === 0 && removedFacets.length === 0) {
    console.log(chalk.gray('  📝 No facet changes detected'));
  }

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Prints upgrade summary
 */
function printUpgradeSummary(diamond: Diamond, deployer: RPCDiamondDeployer): void {
  const deployedData = diamond.getDeployedDiamondData();
  const config = deployer.getConfig();

  console.log(chalk.greenBright('\n🎉 Upgrade Summary'));
  console.log(chalk.green('='.repeat(50)));
  console.log(chalk.blue(`💎 Diamond Name: ${config.diamondName}`));
  console.log(chalk.blue(`🌐 Network: ${config.networkName} (Chain ID: ${config.chainId})`));
  console.log(chalk.blue(`📍 Diamond Address: ${deployedData.DiamondAddress}`));
  
  if (deployedData.protocolVersion) {
    console.log(chalk.blue(`📋 Protocol Version: ${deployedData.protocolVersion}`));
  }

  if (deployedData.DeployedFacets) {
    const facetCount = Object.keys(deployedData.DeployedFacets).length;
    console.log(chalk.blue(`🔧 Total Facets: ${facetCount}`));
    
    if (config.verbose) {
      console.log(chalk.gray('\nCurrent Facets:'));
      Object.entries(deployedData.DeployedFacets).forEach(([name, facet]) => {
        console.log(chalk.gray(`  - ${name}: ${facet.address} (v${facet.version})`));
        console.log(chalk.gray(`    Selectors: ${facet.funcSelectors?.length || 0}`));
      });
    }
  }

  console.log(chalk.green('='.repeat(50)));
}

/**
 * Main upgrade function
 */
async function upgradeDiamond(options: UpgradeOptions): Promise<void> {
  try {
    console.log(chalk.yellowBright('🔄 Starting RPC Diamond Upgrade'));
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

    // Check if diamond is deployed
    if (!deployer.isDiamondDeployed()) {
      console.error(chalk.red('❌ Diamond is not deployed yet. Use deploy-rpc.ts first.'));
      process.exit(1);
    }

    // Get diamond instance and analyze upgrade
    const diamond = deployer.getDiamond();
    const status = deployer.getDeploymentStatus();

    console.log(chalk.blue(`📊 Current Status: ${status}`));

    if (status === DeploymentStatus.Completed && !options.force) {
      console.log(chalk.yellow('⚠️ No upgrade available. Use --force to re-run upgrade process.'));
      printUpgradeSummary(diamond, deployer);
      return;
    }

    // Analyze what will be upgraded
    analyzeUpgrade(diamond);

    // Confirm upgrade unless dry run
    if (options.dryRun) {
      console.log(chalk.blue('\n🧪 Dry run completed - no changes made'));
      return;
    }

    if (!options.force) {
      // In a real CLI, you'd want to add confirmation prompt here
      console.log(chalk.yellow('\n⚠️ This will modify the diamond on-chain.'));
      console.log(chalk.blue('💡 Use --dry-run to preview changes without executing them.'));
    }

    // Perform upgrade
    console.log(chalk.yellowBright('\n🎯 Executing upgrade...'));
    await deployer.deployDiamond(); // This handles both deploy and upgrade

    // Print success message and summary
    console.log(chalk.green('\n✅ Diamond upgrade completed successfully!'));
    printUpgradeSummary(diamond, deployer);

  } catch (error) {
    console.error(chalk.red(`\n❌ Upgrade failed: ${(error as Error).message}`));
    
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// CLI command setup
program
  .command('upgrade')
  .description('Upgrade a diamond using RPC')
  .option('-d, --diamond-name <name>', 'Name of the diamond to upgrade', process.env.DIAMOND_NAME)
  .option('-r, --rpc-url <url>', 'RPC endpoint URL', process.env.RPC_URL)
  .option('-k, --private-key <key>', 'Private key for deployment', process.env.PRIVATE_KEY)
  .option('-n, --network-name <name>', 'Network name', process.env.NETWORK_NAME)
  .option('-c, --config-path <path>', 'Path to diamond configuration file', process.env.DIAMOND_CONFIG_PATH)
  .option('-p, --deployments-path <path>', 'Path to deployments directory', process.env.DEPLOYMENTS_PATH)
  .option('-t, --target-version <version>', 'Target protocol version to upgrade to', 
    val => parseInt(val))
  .option('-g, --gas-limit-multiplier <multiplier>', 'Gas limit multiplier (1.0-2.0)', 
    val => parseFloat(val), parseFloat(process.env.GAS_LIMIT_MULTIPLIER || '1.2'))
  .option('-m, --max-retries <retries>', 'Maximum number of retries (1-10)', 
    val => parseInt(val), parseInt(process.env.MAX_RETRIES || '3'))
  .option('--retry-delay-ms <delay>', 'Retry delay in milliseconds (100-30000)', 
    val => parseInt(val), parseInt(process.env.RETRY_DELAY_MS || '2000'))
  .option('--dry-run', 'Preview changes without executing them')
  .option('--force', 'Force upgrade even if no changes detected')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: UpgradeOptions) => {
    validateOptions(options);
    await upgradeDiamond(options);
  });

// Quick upgrade command that uses environment variables
program
  .command('quick')
  .description('Quick upgrade using environment variables')
  .option('--dry-run', 'Preview changes without executing them')
  .option('--force', 'Force upgrade even if no changes detected')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: { dryRun?: boolean; force?: boolean; verbose?: boolean }) => {
    try {
      const config = RPCDiamondDeployer.createConfigFromEnv({ verbose: options.verbose });
      const upgradeOptions: UpgradeOptions = {
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
        dryRun: options.dryRun,
        force: options.force,
      };

      await upgradeDiamond(upgradeOptions);
    } catch (error) {
      console.error(chalk.red(`❌ Quick upgrade failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Rollback information command
program
  .command('rollback-info')
  .description('Show information about rollback capabilities')
  .action(() => {
    console.log(chalk.yellowBright('🔄 Diamond Rollback Information'));
    console.log(chalk.blue('='.repeat(40)));
    console.log(chalk.blue('📋 Diamond Proxy Standard (ERC-2535) does not have'));
    console.log(chalk.blue('   built-in rollback functionality.'));
    console.log(chalk.blue(''));
    console.log(chalk.blue('🔧 Rollback Options:'));
    console.log(chalk.blue('   1. Re-deploy previous facet versions'));
    console.log(chalk.blue('   2. Use diamond cut to replace facets'));
    console.log(chalk.blue('   3. Remove problematic facets'));
    console.log(chalk.blue(''));
    console.log(chalk.yellow('⚠️  Manual intervention required for rollbacks'));
    console.log(chalk.blue('💡 Best practice: Test thoroughly before deployment'));
    console.log(chalk.blue('='.repeat(40)));
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
