#!/usr/bin/env npx ts-node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { ethers } from 'ethers';
import { RPCDiamondDeployer, RPCDiamondDeployerConfig } from './setup/RPCDiamondDeployer';
import { Diamond } from '../src/core/Diamond';
import * as fs from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('verify-rpc')
  .description('Verify diamond contracts and validate deployment integrity')
  .version('1.0.0');

/**
 * Verification options interface
 */
interface VerifyOptions {
  diamondName: string;
  networkName?: string;
  rpcUrl?: string;
  privateKey?: string;
  verbose?: boolean;
  configPath?: string;
  deploymentsPath?: string;
  etherscanApiKey?: string;
  blockExplorerUrl?: string;
  verifyContracts?: boolean;
  validateAbi?: boolean;
  validateSelectors?: boolean;
  compareOnChain?: boolean;
}

/**
 * Validates required options
 */
function validateOptions(options: VerifyOptions): void {
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
function createConfig(options: VerifyOptions): RPCDiamondDeployerConfig {
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
 * Validates contract ABIs against deployed contracts
 */
async function validateABIs(diamond: Diamond, provider: ethers.JsonRpcProvider): Promise<void> {
  console.log(chalk.blueBright('\n📋 ABI Validation'));
  console.log(chalk.blue('='.repeat(40)));

  const deployedData = diamond.getDeployedDiamondData();
  const deployedFacets = deployedData.DeployedFacets || {};

  if (Object.keys(deployedFacets).length === 0) {
    console.log(chalk.gray('No facets to validate'));
    return;
  }

  let validatedCount = 0;
  let errorCount = 0;

  for (const [facetName, facetData] of Object.entries(deployedFacets)) {
    try {
      console.log(chalk.blue(`🔍 Validating ${facetName}...`));

      // Check if contract exists
      const code = await provider.getCode(facetData.address!);
      if (code === '0x') {
        console.log(chalk.red(`  ❌ No contract found at ${facetData.address}`));
        errorCount++;
        continue;
      }

      // Try to load contract ABI
      const contractsPath = diamond.contractsPath;
      const abiPath = join(contractsPath, `${facetName}.sol`, `${facetName}.json`);
      
      if (!fs.existsSync(abiPath)) {
        console.log(chalk.yellow(`  ⚠️ ABI file not found: ${abiPath}`));
        continue;
      }

      const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      const contract = new ethers.Contract(facetData.address!, artifact.abi, provider);

      // Validate function selectors
      const expectedSelectors = facetData.funcSelectors || [];
      let validSelectors = 0;

      for (const selector of expectedSelectors) {
        try {
          // Try to find the function in the interface
          const fragment = contract.interface.getFunction(selector);
          if (fragment) {
            validSelectors++;
          }
        } catch (error) {
          console.log(chalk.yellow(`  ⚠️ Selector ${selector} not found in ABI`));
        }
      }

      if (validSelectors === expectedSelectors.length) {
        console.log(chalk.green(`  ✅ ${validSelectors}/${expectedSelectors.length} selectors valid`));
        validatedCount++;
      } else {
        console.log(chalk.yellow(`  ⚠️ ${validSelectors}/${expectedSelectors.length} selectors valid`));
      }

    } catch (error) {
      console.log(chalk.red(`  ❌ Validation failed: ${(error as Error).message}`));
      errorCount++;
    }
  }

  console.log(chalk.blue(`📊 ABI Validation: ${validatedCount} validated, ${errorCount} errors`));
  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Validates function selectors against on-chain data
 */
async function validateSelectors(diamond: Diamond, provider: ethers.JsonRpcProvider): Promise<void> {
  console.log(chalk.blueBright('\n🔍 Selector Validation'));
  console.log(chalk.blue('='.repeat(40)));

  const deployedData = diamond.getDeployedDiamondData();
  
  if (!deployedData.DiamondAddress) {
    console.log(chalk.red('❌ No diamond address found'));
    return;
  }

  try {
    // Try to query diamond loupe
    const diamondLoupeABI = [
      'function facets() external view returns (tuple(address facetAddress, bytes4[] functionSelectors)[])',
      'function facetFunctionSelectors(address _facet) external view returns (bytes4[])',
      'function facetAddresses() external view returns (address[])',
      'function facetAddress(bytes4 _functionSelector) external view returns (address)'
    ];

    const diamondContract = new ethers.Contract(deployedData.DiamondAddress, diamondLoupeABI, provider);
    const onChainFacets = await diamondContract.facets();

    console.log(chalk.blue(`🔧 On-chain facets: ${onChainFacets.length}`));

    // Validate each stored facet against on-chain data
    const storedFacets = deployedData.DeployedFacets || {};
    let validFacets = 0;
    let totalSelectorMatches = 0;
    let totalStoredSelectors = 0;

    for (const [facetName, facetData] of Object.entries(storedFacets)) {
      const expectedAddress = facetData.address?.toLowerCase();
      const expectedSelectors = facetData.funcSelectors || [];
      totalStoredSelectors += expectedSelectors.length;

      // Find matching on-chain facet
      const onChainFacet = onChainFacets.find((f: any) => 
        f.facetAddress.toLowerCase() === expectedAddress
      );

      if (!onChainFacet) {
        console.log(chalk.red(`❌ ${facetName}: not found on-chain (${expectedAddress})`));
        continue;
      }

      const onChainSelectors = onChainFacet.functionSelectors;
      
      // Compare selectors
      const matchingSelectors = expectedSelectors.filter(selector =>
        onChainSelectors.includes(selector)
      );

      totalSelectorMatches += matchingSelectors.length;

      if (matchingSelectors.length === expectedSelectors.length && 
          expectedSelectors.length === onChainSelectors.length) {
        console.log(chalk.green(`✅ ${facetName}: ${matchingSelectors.length}/${expectedSelectors.length} selectors match`));
        validFacets++;
      } else {
        console.log(chalk.yellow(`⚠️ ${facetName}: ${matchingSelectors.length}/${expectedSelectors.length} selectors match`));
        
        // Show missing selectors
        const missingSelectors = expectedSelectors.filter(selector =>
          !onChainSelectors.includes(selector)
        );
        if (missingSelectors.length > 0) {
          console.log(chalk.gray(`   Missing: ${missingSelectors.join(', ')}`));
        }

        // Show extra selectors
        const extraSelectors = onChainSelectors.filter((selector: string) =>
          !expectedSelectors.includes(selector)
        );
        if (extraSelectors.length > 0) {
          console.log(chalk.gray(`   Extra: ${extraSelectors.join(', ')}`));
        }
      }
    }

    console.log(chalk.blue(`📊 Selector Validation: ${totalSelectorMatches}/${totalStoredSelectors} selectors match`));
    console.log(chalk.blue(`📊 Facet Validation: ${validFacets}/${Object.keys(storedFacets).length} facets valid`));

  } catch (error) {
    console.log(chalk.red(`❌ Selector validation failed: ${(error as Error).message}`));
    console.log(chalk.gray('   Diamond may not implement IDiamondLoupe interface'));
  }

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Compares stored deployment data with on-chain state
 */
async function compareOnChainState(diamond: Diamond, provider: ethers.JsonRpcProvider): Promise<void> {
  console.log(chalk.blueBright('\n🌐 On-Chain State Comparison'));
  console.log(chalk.blue('='.repeat(40)));

  const deployedData = diamond.getDeployedDiamondData();
  
  if (!deployedData.DiamondAddress) {
    console.log(chalk.red('❌ No diamond address found'));
    return;
  }

  try {
    // Check diamond contract
    const diamondCode = await provider.getCode(deployedData.DiamondAddress);
    if (diamondCode === '0x') {
      console.log(chalk.red(`❌ Diamond contract not found at ${deployedData.DiamondAddress}`));
      return;
    }

    console.log(chalk.green(`✅ Diamond contract exists at ${deployedData.DiamondAddress}`));
    console.log(chalk.gray(`   Code size: ${(diamondCode.length - 2) / 2} bytes`));

    // Check each facet
    const storedFacets = deployedData.DeployedFacets || {};
    let existingFacets = 0;
    let totalCodeSize = 0;

    for (const [facetName, facetData] of Object.entries(storedFacets)) {
      const facetCode = await provider.getCode(facetData.address!);
      
      if (facetCode === '0x') {
        console.log(chalk.red(`❌ ${facetName}: No contract at ${facetData.address}`));
      } else {
        console.log(chalk.green(`✅ ${facetName}: Contract exists at ${facetData.address}`));
        const codeSize = (facetCode.length - 2) / 2;
        totalCodeSize += codeSize;
        console.log(chalk.gray(`   Code size: ${codeSize} bytes`));
        existingFacets++;
      }
    }

    console.log(chalk.blue(`📊 Facets on-chain: ${existingFacets}/${Object.keys(storedFacets).length}`));
    console.log(chalk.blue(`📊 Total code size: ${totalCodeSize} bytes`));

  } catch (error) {
    console.log(chalk.red(`❌ On-chain comparison failed: ${(error as Error).message}`));
  }

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Shows contract verification information
 */
function showContractVerificationInfo(options: VerifyOptions): void {
  console.log(chalk.blueBright('\n📄 Contract Verification Information'));
  console.log(chalk.blue('='.repeat(40)));

  if (options.etherscanApiKey) {
    console.log(chalk.blue('🔑 Etherscan API Key: Configured'));
  } else {
    console.log(chalk.yellow('⚠️ Etherscan API Key: Not configured'));
    console.log(chalk.gray('   Set ETHERSCAN_API_KEY to enable contract verification'));
  }

  if (options.blockExplorerUrl) {
    console.log(chalk.blue(`🌐 Block Explorer: ${options.blockExplorerUrl}`));
  } else {
    console.log(chalk.gray('📖 Block Explorer: Using default for network'));
  }

  console.log(chalk.blue(''));
  console.log(chalk.blue('💡 Manual Verification Steps:'));
  console.log(chalk.gray('   1. Visit your block explorer (e.g., Etherscan)'));
  console.log(chalk.gray('   2. Navigate to each contract address'));
  console.log(chalk.gray('   3. Use "Verify and Publish" with contract source'));
  console.log(chalk.gray('   4. Ensure compiler version matches deployment'));

  console.log(chalk.blue('='.repeat(40)));
}

/**
 * Main verification function
 */
async function verifyDeployment(options: VerifyOptions): Promise<void> {
  try {
    console.log(chalk.yellowBright('🔍 Diamond Verification'));
    console.log(chalk.blue(`📦 Diamond: ${options.diamondName}`));
    console.log(chalk.blue(`🔗 RPC URL: ${options.rpcUrl}`));

    // Create configuration
    const config = createConfig(options);

    // Create deployer instance
    const deployer = await RPCDiamondDeployer.getInstance(config);
    const diamond = deployer.getDiamond();

    // Check if diamond is deployed
    if (!deployer.isDiamondDeployed()) {
      console.error(chalk.red('❌ Diamond is not deployed yet. Deploy first using deploy-rpc.ts'));
      process.exit(1);
    }

    const provider = deployer.getStrategy().getProvider();
    const deployedData = diamond.getDeployedDiamondData();

    // Basic deployment information
    console.log(chalk.blueBright('\n📋 Deployment Information'));
    console.log(chalk.blue('='.repeat(40)));
    console.log(chalk.blue(`💎 Diamond Address: ${deployedData.DiamondAddress}`));
    console.log(chalk.blue(`👤 Deployer: ${deployedData.DeployerAddress}`));
    
    if (deployedData.protocolVersion) {
      console.log(chalk.blue(`📋 Protocol Version: ${deployedData.protocolVersion}`));
    }

    const facetCount = Object.keys(deployedData.DeployedFacets || {}).length;
    console.log(chalk.blue(`🔧 Deployed Facets: ${facetCount}`));

    // Network validation
    if (options.verbose) {
      const networkInfo = await deployer.getNetworkInfo();
      console.log(chalk.blue(`🌐 Network: ${networkInfo.networkName} (${networkInfo.chainId})`));
    }

    // Perform requested validations
    if (options.validateAbi) {
      await validateABIs(diamond, provider);
    }

    if (options.validateSelectors) {
      await validateSelectors(diamond, provider);
    }

    if (options.compareOnChain) {
      await compareOnChainState(diamond, provider);
    }

    if (options.verifyContracts) {
      showContractVerificationInfo(options);
    }

    console.log(chalk.green('\n✅ Verification completed!'));

  } catch (error) {
    console.error(chalk.red(`\n❌ Verification failed: ${(error as Error).message}`));
    
    if (options.verbose && error instanceof Error && error.stack) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// CLI command setup
program
  .command('verify')
  .description('Verify diamond deployment')
  .option('-d, --diamond-name <name>', 'Name of the diamond to verify', process.env.DIAMOND_NAME)
  .option('-r, --rpc-url <url>', 'RPC endpoint URL', process.env.RPC_URL)
  .option('-k, --private-key <key>', 'Private key', process.env.PRIVATE_KEY)
  .option('-n, --network-name <name>', 'Network name', process.env.NETWORK_NAME)
  .option('-c, --config-path <path>', 'Path to diamond configuration file', process.env.DIAMOND_CONFIG_PATH)
  .option('-p, --deployments-path <path>', 'Path to deployments directory', process.env.DEPLOYMENTS_PATH)
  .option('--etherscan-api-key <key>', 'Etherscan API key for contract verification', process.env.ETHERSCAN_API_KEY)
  .option('--block-explorer-url <url>', 'Block explorer URL', process.env.BLOCK_EXPLORER_URL)
  .option('--verify-contracts', 'Show contract verification information')
  .option('--validate-abi', 'Validate contract ABIs')
  .option('--validate-selectors', 'Validate function selectors')
  .option('--compare-on-chain', 'Compare with on-chain state')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: VerifyOptions) => {
    validateOptions(options);
    await verifyDeployment(options);
  });

// Full verification command
program
  .command('full')
  .description('Perform full verification (all checks)')
  .option('-d, --diamond-name <name>', 'Name of the diamond to verify', process.env.DIAMOND_NAME)
  .option('-r, --rpc-url <url>', 'RPC endpoint URL', process.env.RPC_URL)
  .option('-k, --private-key <key>', 'Private key', process.env.PRIVATE_KEY)
  .option('-n, --network-name <name>', 'Network name', process.env.NETWORK_NAME)
  .option('-c, --config-path <path>', 'Path to diamond configuration file', process.env.DIAMOND_CONFIG_PATH)
  .option('-p, --deployments-path <path>', 'Path to deployments directory', process.env.DEPLOYMENTS_PATH)
  .option('--etherscan-api-key <key>', 'Etherscan API key for contract verification', process.env.ETHERSCAN_API_KEY)
  .option('--block-explorer-url <url>', 'Block explorer URL', process.env.BLOCK_EXPLORER_URL)
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: VerifyOptions) => {
    // Enable all verification options
    options.verifyContracts = true;
    options.validateAbi = true;
    options.validateSelectors = true;
    options.compareOnChain = true;
    
    validateOptions(options);
    await verifyDeployment(options);
  });

// Quick verification using environment variables
program
  .command('quick')
  .description('Quick verification using environment variables')
  .option('--validate-abi', 'Validate contract ABIs')
  .option('--validate-selectors', 'Validate function selectors')
  .option('--compare-on-chain', 'Compare with on-chain state')
  .option('-v, --verbose', 'Enable verbose logging', process.env.VERBOSE === 'true')
  .action(async (options: Partial<VerifyOptions>) => {
    try {
      const config = RPCDiamondDeployer.createConfigFromEnv({ verbose: options.verbose });
      const verifyOptions: VerifyOptions = {
        diamondName: config.diamondName,
        rpcUrl: config.rpcUrl,
        privateKey: config.privateKey,
        networkName: config.networkName,
        verbose: config.verbose,
        configPath: config.configFilePath,
        deploymentsPath: config.deploymentsPath,
        etherscanApiKey: process.env.ETHERSCAN_API_KEY,
        blockExplorerUrl: process.env.BLOCK_EXPLORER_URL,
        validateAbi: options.validateAbi || true,
        validateSelectors: options.validateSelectors || true,
        compareOnChain: options.compareOnChain || true,
      };

      await verifyDeployment(verifyOptions);
    } catch (error) {
      console.error(chalk.red(`❌ Quick verification failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
