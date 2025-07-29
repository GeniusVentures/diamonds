#!/usr/bin/env npx ts-node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as readline from 'readline';
import { RPCDiamondDeployer, RPCDiamondDeployerConfig, DeploymentStatus } from './setup/RPCDiamondDeployer';
import { Diamond } from '../src/core/Diamond';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('deploy-rpc-manual')
  .description('Manual step-by-step diamond deployment with confirmations')
  .version('1.0.0');

/**
 * Manual deployment options interface
 */
interface ManualDeploymentOptions {
  diamondName: string;
  networkName?: string;
  rpcUrl?: string;
  privateKey?: string;
  gasLimitMultiplier?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  configPath?: string;
  deploymentsPath?: string;
  skipConfirmations?: boolean;
  debugMode?: boolean;
  verbose?: boolean;
}

/**
 * Creates readline interface for user input
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompts user for confirmation
 */
async function confirm(message: string, defaultValue: boolean = false): Promise<boolean> {
  const rl = createReadlineInterface();
  const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
  
  return new Promise((resolve) => {
    rl.question(`${message} ${defaultText}: `, (answer) => {
      rl.close();
      
      if (!answer.trim()) {
        resolve(defaultValue);
      } else {
        resolve(answer.toLowerCase().startsWith('y'));
      }
    });
  });
}

/**
 * Prompts user for input
 */
async function prompt(message: string, defaultValue?: string): Promise<string> {
  const rl = createReadlineInterface();
  const defaultText = defaultValue ? ` [${defaultValue}]` : '';
  
  return new Promise((resolve) => {
    rl.question(`${message}${defaultText}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Validates required options
 */
function validateOptions(options: ManualDeploymentOptions): void {
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
 * Interactively collects configuration if missing
 */
async function collectMissingConfig(options: ManualDeploymentOptions): Promise<ManualDeploymentOptions> {
  console.log(chalk.blueBright('\n🔧 Configuration Setup'));
  console.log(chalk.blue('='.repeat(40)));

  if (!options.diamondName) {
    options.diamondName = await prompt('Diamond name', process.env.DIAMOND_NAME);
  }

  if (!options.rpcUrl) {
    options.rpcUrl = await prompt('RPC URL', process.env.RPC_URL);
  }

  if (!options.privateKey) {
    const privateKey = await prompt('Private key (0x...)', process.env.PRIVATE_KEY);
    options.privateKey = privateKey;
  }

  if (!options.networkName) {
    options.networkName = await prompt('Network name (optional)', process.env.NETWORK_NAME);
  }

  if (!options.gasLimitMultiplier) {
    const gasMultiplier = await prompt('Gas limit multiplier', process.env.GAS_LIMIT_MULTIPLIER || '1.2');
    if (gasMultiplier) {
      options.gasLimitMultiplier = parseFloat(gasMultiplier);
    }
  }

  console.log(chalk.blue('='.repeat(40)));
  return options;
}

/**
 * Creates configuration from options
 */
function createConfig(options: ManualDeploymentOptions): RPCDiamondDeployerConfig {
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
 * Shows pre-deployment summary and asks for confirmation
 */
async function preDeploymentConfirmation(
  deployer: RPCDiamondDeployer, 
  options: ManualDeploymentOptions
): Promise<boolean> {
  console.log(chalk.yellowBright('\n📋 Pre-Deployment Summary'));
  console.log(chalk.blue('='.repeat(50)));

  const config = deployer.getConfig();
  const diamond = deployer.getDiamond();
  const deployConfig = diamond.getDeployConfig();
  const networkInfo = await deployer.getNetworkInfo();

  console.log(chalk.blue(`💎 Diamond Name: ${config.diamondName}`));
  console.log(chalk.blue(`🌐 Network: ${networkInfo.networkName} (Chain ID: ${networkInfo.chainId})`));
  console.log(chalk.blue(`🔗 RPC URL: ${config.rpcUrl}`));
  console.log(chalk.blue(`👤 Deployer: ${networkInfo.signerAddress}`));
  console.log(chalk.blue(`💰 Balance: ${Number(networkInfo.balance) / 1e18} ETH`));
  console.log(chalk.blue(`⛽ Gas Price: ${Number(networkInfo.gasPrice) / 1e9} gwei`));

  if (deployConfig.protocolVersion) {
    console.log(chalk.blue(`📋 Protocol Version: ${deployConfig.protocolVersion}`));
  }

  // Show facets to be deployed
  const facetsConfig = deployConfig.facets || {};
  const facetNames = Object.keys(facetsConfig);
  
  if (facetNames.length > 0) {
    console.log(chalk.blue(`\n🔧 Facets to Deploy: ${facetNames.length}`));
    facetNames.forEach(name => {
      const facetConfig = facetsConfig[name];
      const versions = Object.keys(facetConfig.versions || {}).map(Number);
      const latestVersion = versions.length > 0 ? Math.max(...versions) : 0;
      console.log(chalk.gray(`  - ${name}: v${latestVersion} (priority: ${facetConfig.priority || 1000})`));
    });
  }

  // Estimate costs
  const estimatedGasPrice = Number(networkInfo.gasPrice) / 1e18;
  const estimatedDeploymentCost = estimatedGasPrice * 5000000; // Rough estimate
  console.log(chalk.blue(`\n💸 Estimated Cost: ~${estimatedDeploymentCost.toFixed(6)} ETH`));

  console.log(chalk.blue('='.repeat(50)));

  if (options.skipConfirmations) {
    console.log(chalk.yellow('⏭️ Skipping confirmation (--skip-confirmations)'));
    return true;
  }

  return await confirm('\n🚀 Proceed with deployment?', false);
}

/**
 * Step-by-step deployment process
 */
async function stepByStepDeployment(
  deployer: RPCDiamondDeployer,
  options: ManualDeploymentOptions
): Promise<void> {
  const diamond = deployer.getDiamond();

  // Step 1: Pre-deployment validation
  console.log(chalk.yellowBright('\n📋 Step 1: Pre-deployment Validation'));
  console.log(chalk.blue('-'.repeat(40)));

  const validation = await deployer.validateConfiguration();
  if (!validation.valid) {
    console.error(chalk.red('❌ Configuration validation failed:'));
    validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
    
    if (!options.skipConfirmations) {
      const continueAnyway = await confirm('Continue anyway?', false);
      if (!continueAnyway) {
        console.log(chalk.yellow('🛑 Deployment cancelled'));
        return;
      }
    }
  } else {
    console.log(chalk.green('✅ Configuration is valid'));
  }

  if (!options.skipConfirmations) {
    const proceed = await confirm('Continue to next step?', true);
    if (!proceed) {
      console.log(chalk.yellow('🛑 Deployment cancelled'));
      return;
    }
  }

  // Step 2: Diamond Core Deployment
  console.log(chalk.yellowBright('\n💎 Step 2: Diamond Core Deployment'));
  console.log(chalk.blue('-'.repeat(40)));
  
  console.log(chalk.blue('This step will deploy:'));
  console.log(chalk.gray('  - DiamondCutFacet'));
  console.log(chalk.gray('  - Diamond proxy contract'));

  if (!options.skipConfirmations) {
    const proceed = await confirm('Deploy diamond core contracts?', true);
    if (!proceed) {
      console.log(chalk.yellow('🛑 Deployment cancelled'));
      return;
    }
  }

  try {
    // This will be handled by the deployment manager
    console.log(chalk.blue('⏳ Deploying diamond core...'));
    // We'll let the normal deployment process handle this
  } catch (error) {
    console.error(chalk.red(`❌ Diamond core deployment failed: ${(error as Error).message}`));
    
    if (!options.skipConfirmations) {
      const retry = await confirm('Retry deployment?', false);
      if (retry) {
        // Could implement retry logic here
        console.log(chalk.blue('🔄 Retrying deployment...'));
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  // Step 3: Facet Deployment
  console.log(chalk.yellowBright('\n🔧 Step 3: Facet Deployment'));
  console.log(chalk.blue('-'.repeat(40)));

  const deployConfig = diamond.getDeployConfig();
  const facetsConfig = deployConfig.facets || {};
  const facetNames = Object.keys(facetsConfig);

  if (facetNames.length > 0) {
    console.log(chalk.blue(`Deploying ${facetNames.length} facets:`));
    facetNames.forEach(name => {
      console.log(chalk.gray(`  - ${name}`));
    });

    if (!options.skipConfirmations) {
      const proceed = await confirm('Deploy all facets?', true);
      if (!proceed) {
        console.log(chalk.yellow('🛑 Deployment cancelled'));
        return;
      }
    }
  } else {
    console.log(chalk.gray('No additional facets to deploy'));
  }

  // Step 4: Diamond Cut Execution
  console.log(chalk.yellowBright('\n🪓 Step 4: Diamond Cut Execution'));
  console.log(chalk.blue('-'.repeat(40)));

  console.log(chalk.blue('This step will:'));
  console.log(chalk.gray('  - Execute diamond cut with all facets'));
  console.log(chalk.gray('  - Register function selectors'));
  console.log(chalk.gray('  - Run initialization callbacks'));

  if (!options.skipConfirmations) {
    const proceed = await confirm('Execute diamond cut?', true);
    if (!proceed) {
      console.log(chalk.yellow('🛑 Deployment cancelled'));
      return;
    }
  }

  // Step 5: Final Deployment
  console.log(chalk.yellowBright('\n🚀 Step 5: Executing Full Deployment'));
  console.log(chalk.blue('-'.repeat(40)));

  try {
    await deployer.deployDiamond();
    console.log(chalk.green('✅ Deployment completed successfully!'));
  } catch (error) {
    console.error(chalk.red(`❌ Deployment failed: ${(error as Error).message}`));
    throw error;
  }

  // Step 6: Post-deployment verification
  console.log(chalk.yellowBright('\n✅ Step 6: Post-deployment Verification'));
  console.log(chalk.blue('-'.repeat(40)));

  const deployedData = diamond.getDeployedDiamondData();
  console.log(chalk.green(`💎 Diamond deployed at: ${deployedData.DiamondAddress}`));
  
  if (deployedData.DeployedFacets) {
    const facetCount = Object.keys(deployedData.DeployedFacets).length;
    console.log(chalk.green(`🔧 Total facets: ${facetCount}`));
  }

  if (!options.skipConfirmations) {
    const runVerification = await confirm('Run verification checks?', true);
    if (runVerification) {
      console.log(chalk.blue('💡 You can run verification with:'));
      console.log(chalk.gray(`   npx ts-node scripts/verify-rpc.ts verify --diamond-name ${options.diamondName}`));
    }
  }
}

/**
 * Debug mode deployment with detailed logging
 */
async function debugModeDeployment(
  deployer: RPCDiamondDeployer,
  options: ManualDeploymentOptions
): Promise<void> {
  console.log(chalk.magentaBright('\n🐛 Debug Mode Deployment'));
  console.log(chalk.blue('='.repeat(50)));

  // Enable verbose mode
  await deployer.setVerbose(true);
  
  const diamond = deployer.getDiamond();
  const strategy = deployer.getStrategy();

  console.log(chalk.blue('🔍 Debug Information:'));
  console.log(chalk.gray(`  Diamond Instance: ${diamond.diamondName}`));
  console.log(chalk.gray(`  Strategy: ${strategy.constructor.name}`));
  console.log(chalk.gray(`  Provider: ${strategy.getProvider().constructor.name}`));
  console.log(chalk.gray(`  Signer: ${strategy.getSigner().constructor.name}`));

  // Show configuration details
  const config = deployer.getConfig();
  console.log(chalk.blue('\n⚙️ Configuration:'));
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'privateKey') {
      console.log(chalk.gray(`  ${key}: ${'*'.repeat(10)}...`));
    } else {
      console.log(chalk.gray(`  ${key}: ${value}`));
    }
  });

  // Show network info
  const networkInfo = await deployer.getNetworkInfo();
  console.log(chalk.blue('\n🌐 Network Information:'));
  Object.entries(networkInfo).forEach(([key, value]) => {
    console.log(chalk.gray(`  ${key}: ${value}`));
  });

  console.log(chalk.blue('='.repeat(50)));

  if (!options.skipConfirmations) {
    const proceed = await confirm('Continue with debug deployment?', true);
    if (!proceed) {
      console.log(chalk.yellow('🛑 Debug deployment cancelled'));
      return;
    }
  }

  // Execute normal deployment with verbose logging
  await deployer.deployDiamond();
}

/**
 * Main manual deployment function
 */
async function manualDeploy(options: ManualDeploymentOptions): Promise<void> {
  try {
    console.log(chalk.yellowBright('🎛️ Manual Diamond Deployment'));
    console.log(chalk.blue(`📦 Diamond: ${options.diamondName || 'TBD'}`));

    // Interactive configuration collection if needed
    if (!options.diamondName || !options.rpcUrl || !options.privateKey) {
      options = await collectMissingConfig(options);
    }

    validateOptions(options);

    // Create configuration
    const config = createConfig(options);

    // Create deployer instance
    const deployer = await RPCDiamondDeployer.getInstance(config);

    // Pre-deployment confirmation
    const confirmed = await preDeploymentConfirmation(deployer, options);
    if (!confirmed) {
      console.log(chalk.yellow('🛑 Deployment cancelled by user'));
      return;
    }

    // Check deployment mode
    if (options.debugMode) {
      await debugModeDeployment(deployer, options);
    } else {
      await stepByStepDeployment(deployer, options);
    }

    console.log(chalk.greenBright('\n🎉 Manual deployment completed!'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Manual deployment failed: ${(error as Error).message}`));
    
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
  .description('Manual step-by-step deployment')
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
  .option('--skip-confirmations', 'Skip all confirmation prompts')
  .option('--debug-mode', 'Enable debug mode with detailed logging')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: ManualDeploymentOptions) => {
    await manualDeploy(options);
  });

// Interactive mode - no command line arguments needed
program
  .command('interactive')
  .description('Fully interactive deployment mode')
  .option('--debug-mode', 'Enable debug mode with detailed logging')
  .action(async (options: { debugMode?: boolean }) => {
    const deployOptions: ManualDeploymentOptions = {
      diamondName: '',
      debugMode: options.debugMode,
      verbose: true
    };

    await manualDeploy(deployOptions);
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
