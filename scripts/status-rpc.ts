#!/usr/bin/env npx ts-node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { RPCDiamondDeployer, RPCDiamondDeployerConfig, DeploymentStatus } from './setup/RPCDiamondDeployer';
import { Diamond } from '../src/core/Diamond';
import * as fs from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('status-rpc')
  .description('Check diamond deployment status and validate configuration')
  .version('1.0.0');

/**
 * Status options interface
 */
interface StatusOptions {
  diamondName: string;
  networkName?: string;
  rpcUrl?: string;
  privateKey?: string;
  verbose?: boolean;
  configPath?: string;
  deploymentsPath?: string;
  onChainValidation?: boolean;
  showConfig?: boolean;
  showFacets?: boolean;
  showSelectors?: boolean;
}

/**
 * Validates required options
 */
function validateOptions(options: StatusOptions): void {
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
function createConfig(options: StatusOptions): RPCDiamondDeployerConfig {
  const config: RPCDiamondDeployerConfig = {
    diamondName: options.diamondName,
    rpcUrl: options.rpcUrl!,
    privateKey: options.privateKey!,
    networkName: options.networkName,
    verbose: options.verbose || false,
    configFilePath: options.configPath,
    deploymentsPath: options.deploymentsPath,
  };

  return config;
}

/**
 * Performs on-chain validation of diamond
 */
async function validateOnChain(diamond: Diamond, rpcUrl: string): Promise<void> {
  console.log(chalk.blueBright('\n🌐 On-Chain Validation'));
  console.log(chalk.blue('='.repeat(40)));

  const deployedData = diamond.getDeployedDiamondData();
  
  if (!deployedData.DiamondAddress) {
    console.log(chalk.red('❌ No diamond address found - cannot validate on-chain'));
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const diamondAddress = deployedData.DiamondAddress;

    // Check if contract exists
    const code = await provider.getCode(diamondAddress);
    if (code === '0x') {
      console.log(chalk.red(`❌ No contract code found at ${diamondAddress}`));
      return;
    }

    console.log(chalk.green(`✅ Contract exists at ${diamondAddress}`));
    console.log(chalk.gray(`   Code size: ${(code.length - 2) / 2} bytes`));

    // Try to load IDiamondLoupe interface and query facets
    try {
      const diamondLoupeABI = [
        'function facets() external view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])',
        'function facetFunctionSelectors(address _facet) external view returns (bytes4[])',
        'function facetAddresses() external view returns (address[])',
        'function facetAddress(bytes4 _functionSelector) external view returns (address)'
      ];

      const diamondContract = new ethers.Contract(diamondAddress, diamondLoupeABI, provider);
      
      // Get facets from contract
      const onChainFacets = await diamondContract.facets();
      console.log(chalk.blue(`🔧 On-chain facets: ${onChainFacets.length}`));

      // Compare with stored data
      const storedFacets = deployedData.DeployedFacets || {};
      const storedFacetCount = Object.keys(storedFacets).length;
      
      console.log(chalk.blue(`📁 Stored facets: ${storedFacetCount}`));

      if (onChainFacets.length === storedFacetCount) {
        console.log(chalk.green('✅ Facet count matches'));
      } else {
        console.log(chalk.yellow('⚠️ Facet count mismatch - may need sync'));
      }

      // Validate individual facets
      let validFacets = 0;
      for (const [facetName, facetData] of Object.entries(storedFacets)) {
        const onChainFacet = onChainFacets.find((f: any) => f.facetAddress.toLowerCase() === facetData.address?.toLowerCase());
        
        if (onChainFacet) {
          const expectedSelectors = facetData.funcSelectors || [];
          const onChainSelectors = onChainFacet.functionSelectors;
          
          if (expectedSelectors.length === onChainSelectors.length) {
            console.log(chalk.green(`  ✅ ${facetName}: ${expectedSelectors.length} selectors`));
            validFacets++;
          } else {
            console.log(chalk.yellow(`  ⚠️ ${facetName}: selector count mismatch (${expectedSelectors.length} vs ${onChainSelectors.length})`));
          }
        } else {
          console.log(chalk.red(`  ❌ ${facetName}: not found on-chain`));
        }
      }

      console.log(chalk.blue(`📊 Validation: ${validFacets}/${storedFacetCount} facets valid`));

    } catch (loupeError) {
      console.log(chalk.yellow('⚠️ Could not query diamond loupe interface'));
      if ((loupeError as Error).message.includes('execution reverted')) {
        console.log(chalk.gray('   Diamond may not implement IDiamondLoupe'));
      } else {
        console.log(chalk.gray(`   Error: ${(loupeError as Error).message}`));
      }
    }

  } catch (error) {
    console.error(chalk.red(`❌ On-chain validation failed: ${(error as Error).message}`));
  }

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Shows configuration details
 */
async function showConfiguration(deployer: RPCDiamondDeployer, diamond: Diamond): Promise<void> {
  console.log(chalk.blueBright('\n⚙️ Configuration Details'));
  console.log(chalk.blue('='.repeat(40)));

  const config = deployer.getConfig();
  const deployConfig = diamond.getDeployConfig();
  const signerAddress = await deployer.getStrategy().getSigner().getAddress();

  console.log(chalk.blue(`📦 Diamond Name: ${config.diamondName}`));
  console.log(chalk.blue(`🌐 Network: ${config.networkName} (Chain ID: ${config.chainId})`));
  console.log(chalk.blue(`🔗 RPC URL: ${config.rpcUrl}`));
  console.log(chalk.blue(`👤 Deployer: ${signerAddress}`));
  console.log(chalk.blue(`📁 Deployments Path: ${config.deploymentsPath}`));
  console.log(chalk.blue(`📄 Config File: ${config.configFilePath}`));

  if (deployConfig.protocolVersion) {
    console.log(chalk.blue(`📋 Protocol Version: ${deployConfig.protocolVersion}`));
  }

  console.log(chalk.blue(`⛽ Gas Limit Multiplier: ${config.gasLimitMultiplier}`));
  console.log(chalk.blue(`🔄 Max Retries: ${config.maxRetries}`));
  console.log(chalk.blue(`⏱️ Retry Delay: ${config.retryDelayMs}ms`));

  // Show facet configuration
  const facetsConfig = deployConfig.facets || {};
  const facetNames = Object.keys(facetsConfig);
  
  if (facetNames.length > 0) {
    console.log(chalk.blue(`🔧 Configured Facets: ${facetNames.length}`));
    facetNames.forEach(name => {
      const facetConfig = facetsConfig[name];
      const versions = Object.keys(facetConfig.versions || {}).map(Number);
      const latestVersion = versions.length > 0 ? Math.max(...versions) : 0;
      console.log(chalk.gray(`  - ${name}: v${latestVersion} (priority: ${facetConfig.priority || 1000})`));
    });
  }

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Shows deployed facets details
 */
function showFacetsDetails(diamond: Diamond, verbose: boolean = false): void {
  console.log(chalk.blueBright('\n🔧 Deployed Facets'));
  console.log(chalk.blue('='.repeat(40)));

  const deployedData = diamond.getDeployedDiamondData();
  const deployedFacets = deployedData.DeployedFacets || {};

  if (Object.keys(deployedFacets).length === 0) {
    console.log(chalk.gray('No facets deployed yet'));
    console.log(chalk.blue('='.repeat(40)));
    return;
  }

  Object.entries(deployedFacets).forEach(([name, facet]) => {
    console.log(chalk.blue(`📦 ${name}`));
    console.log(chalk.gray(`   Address: ${facet.address}`));
    console.log(chalk.gray(`   Version: ${facet.version}`));
    console.log(chalk.gray(`   Selectors: ${facet.funcSelectors?.length || 0}`));
    console.log(chalk.gray(`   TX Hash: ${facet.tx_hash}`));

    if (verbose && facet.funcSelectors && facet.funcSelectors.length > 0) {
      console.log(chalk.gray(`   Function Selectors:`));
      facet.funcSelectors.forEach(selector => {
        console.log(chalk.gray(`     - ${selector}`));
      });
    }
    console.log();
  });

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Shows function selectors registry
 */
function showSelectorsRegistry(diamond: Diamond): void {
  console.log(chalk.blueBright('\n🔍 Function Selectors Registry'));
  console.log(chalk.blue('='.repeat(40)));

  const registry = diamond.functionSelectorRegistry;
  
  if (registry.size === 0) {
    console.log(chalk.gray('No selectors registered'));
    console.log(chalk.blue('='.repeat(40)));
    return;
  }

  // Group selectors by facet
  const facetGroups: Record<string, Array<{ selector: string; priority: number; action: string; address: string }>> = {};

  for (const [selector, entry] of registry.entries()) {
    if (!facetGroups[entry.facetName]) {
      facetGroups[entry.facetName] = [];
    }
    
    facetGroups[entry.facetName].push({
      selector,
      priority: entry.priority,
      action: entry.action.toString(),
      address: entry.address
    });
  }

  Object.entries(facetGroups).forEach(([facetName, selectors]) => {
    console.log(chalk.blue(`🔧 ${facetName} (${selectors.length} selectors)`));
    console.log(chalk.gray(`   Priority: ${selectors[0]?.priority || 'Unknown'}`));
    console.log(chalk.gray(`   Address: ${selectors[0]?.address || 'Unknown'}`));
    
    selectors.forEach(({ selector, action }) => {
      const actionColor = action === 'Deployed' ? chalk.green : 
                         action === 'Add' ? chalk.cyan :
                         action === 'Replace' ? chalk.yellow : chalk.red;
      console.log(chalk.gray(`     ${selector} `) + actionColor(`[${action}]`));
    });
    console.log();
  });

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Main status checking function
 */
async function checkStatus(options: StatusOptions): Promise<void> {
  try {
    console.log(chalk.yellowBright('📊 Diamond Status Check'));
    console.log(chalk.blue(`📦 Diamond: ${options.diamondName}`));
    console.log(chalk.blue(`🔗 RPC URL: ${options.rpcUrl}`));

    // Create configuration
    const config = createConfig(options);

    // Create deployer instance
    const deployer = await RPCDiamondDeployer.getInstance(config);
    const diamond = deployer.getDiamond();

    // Basic status information
    console.log(chalk.blueBright('\n📈 Basic Status'));
    console.log(chalk.blue('='.repeat(40)));

    const status = deployer.getDeploymentStatus();
    const isDeployed = deployer.isDiamondDeployed();
    
    console.log(chalk.blue(`📊 Status: ${status}`));
    console.log(chalk.blue(`✅ Deployed: ${isDeployed ? 'Yes' : 'No'}`));

    if (isDeployed) {
      const deployedData = diamond.getDeployedDiamondData();
      console.log(chalk.blue(`📍 Diamond Address: ${deployedData.DiamondAddress}`));
      console.log(chalk.blue(`👤 Deployer: ${deployedData.DeployerAddress}`));
      
      if (deployedData.protocolVersion) {
        console.log(chalk.blue(`📋 Protocol Version: ${deployedData.protocolVersion}`));
      }
      
      if (deployedData.DeployedFacets) {
        const facetCount = Object.keys(deployedData.DeployedFacets).length;
        console.log(chalk.blue(`🔧 Facets: ${facetCount}`));
      }
    }

    // Network information
    if (options.verbose) {
      console.log(chalk.blueBright('\n🌐 Network Information'));
      console.log(chalk.blue('='.repeat(40)));
      
      const networkInfo = await deployer.getNetworkInfo();
      console.log(chalk.blue(`🌐 Network: ${networkInfo.networkName}`));
      console.log(chalk.blue(`🆔 Chain ID: ${networkInfo.chainId}`));
      console.log(chalk.blue(`👤 Signer: ${networkInfo.signerAddress}`));
      console.log(chalk.blue(`💰 Balance: ${Number(networkInfo.balance) / 1e18} ETH`));
      console.log(chalk.blue(`⛽ Gas Price: ${Number(networkInfo.gasPrice) / 1e9} gwei`));
    }

    // Configuration validation
    const validation = await deployer.validateConfiguration();
    console.log(chalk.blueBright('\n✅ Configuration Validation'));
    console.log(chalk.blue('='.repeat(40)));
    
    if (validation.valid) {
      console.log(chalk.green('✅ Configuration is valid'));
    } else {
      console.log(chalk.red('❌ Configuration validation failed:'));
      validation.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
    }

    // Show additional details based on options
    if (options.showConfig) {
      await showConfiguration(deployer, diamond);
    }

    if (options.showFacets && isDeployed) {
      showFacetsDetails(diamond, options.verbose);
    }

    if (options.showSelectors && isDeployed) {
      showSelectorsRegistry(diamond);
    }

    // On-chain validation
    if (options.onChainValidation && isDeployed) {
      await validateOnChain(diamond, options.rpcUrl!);
    }

    console.log(chalk.blue('='.repeat(40)));

  } catch (error) {
    console.error(chalk.red(`\n❌ Status check failed: ${(error as Error).message}`));
    
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// CLI command setup
program
  .command('check')
  .description('Check diamond deployment status')
  .option('-d, --diamond-name <name>', 'Name of the diamond', process.env.DIAMOND_NAME)
  .option('-r, --rpc-url <url>', 'RPC endpoint URL', process.env.RPC_URL)
  .option('-k, --private-key <key>', 'Private key', process.env.PRIVATE_KEY)
  .option('-n, --network-name <name>', 'Network name', process.env.NETWORK_NAME)
  .option('-c, --config-path <path>', 'Path to diamond configuration file', process.env.DIAMOND_CONFIG_PATH)
  .option('-p, --deployments-path <path>', 'Path to deployments directory', process.env.DEPLOYMENTS_PATH)
  .option('--on-chain-validation', 'Perform on-chain validation')
  .option('--show-config', 'Show configuration details')
  .option('--show-facets', 'Show deployed facets details')
  .option('--show-selectors', 'Show function selectors registry')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: StatusOptions) => {
    validateOptions(options);
    await checkStatus(options);
  });

// Quick status command using environment variables
program
  .command('quick')
  .description('Quick status check using environment variables')
  .option('--on-chain-validation', 'Perform on-chain validation')
  .option('--show-config', 'Show configuration details')
  .option('--show-facets', 'Show deployed facets details')
  .option('--show-selectors', 'Show function selectors registry')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: Partial<StatusOptions>) => {
    try {
      const config = RPCDiamondDeployer.createConfigFromEnv({ verbose: options.verbose });
      const statusOptions: StatusOptions = {
        diamondName: config.diamondName,
        rpcUrl: config.rpcUrl,
        privateKey: config.privateKey,
        networkName: config.networkName,
        verbose: config.verbose,
        configPath: config.configFilePath,
        deploymentsPath: config.deploymentsPath,
        onChainValidation: options.onChainValidation,
        showConfig: options.showConfig,
        showFacets: options.showFacets,
        showSelectors: options.showSelectors,
      };

      await checkStatus(statusOptions);
    } catch (error) {
      console.error(chalk.red(`❌ Quick status check failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
