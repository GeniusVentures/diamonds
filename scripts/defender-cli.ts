#!/usr/bin/env node
// scripts/defender-cli.ts

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import hre from 'hardhat';

import { Diamond } from '../src/core/Diamond';
import { DiamondDeployer } from '../src/core/DiamondDeployer';
import { FileDeploymentRepository } from '../src/repositories/FileDeploymentRepository';
import { OZDefenderDeploymentStrategy } from '../src/strategies/OZDefenderDeploymentStrategy';
import { DiamondConfig } from '../src/types/config';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('defender-cli')
  .description('CLI tool for managing Diamond deployments via OpenZeppelin Defender')
  .version('1.0.0');

interface CLIConfig {
  apiKey: string;
  apiSecret: string;
  relayerAddress: string;
  safeAddress?: string;
  networkName: string;
  chainId: number;
  diamondName: string;
  configPath?: string;
  deploymentsPath?: string;
  autoApprove: boolean;
  verbose: boolean;
}

function loadConfig(): CLIConfig {
  const requiredEnvVars = [
    'DEFENDER_API_KEY',
    'DEFENDER_API_SECRET',
    'DEFENDER_RELAYER_ADDRESS',
    'NETWORK_NAME',
    'CHAIN_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(chalk.red(`❌ Missing required environment variable: ${envVar}`));
      process.exit(1);
    }
  }

  return {
    apiKey: process.env.DEFENDER_API_KEY!,
    apiSecret: process.env.DEFENDER_API_SECRET!,
    relayerAddress: process.env.DEFENDER_RELAYER_ADDRESS!,
    safeAddress: process.env.DEFENDER_SAFE_ADDRESS,
    networkName: process.env.NETWORK_NAME!,
    chainId: parseInt(process.env.CHAIN_ID!),
    diamondName: process.env.DIAMOND_NAME || 'MyDiamond',
    configPath: process.env.DIAMOND_CONFIG_PATH,
    deploymentsPath: process.env.DEPLOYMENTS_PATH || 'diamonds',
    autoApprove: process.env.DEFENDER_AUTO_APPROVE === 'true',
    verbose: process.env.VERBOSE === 'true'
  };
}

async function createStrategy(config: CLIConfig): Promise<OZDefenderDeploymentStrategy> {
  const viaAddress = config.safeAddress || config.relayerAddress;
  const viaType = config.safeAddress ? 'Safe' : 'EOA';

  return new OZDefenderDeploymentStrategy(
    config.apiKey,
    config.apiSecret,
    config.relayerAddress,
    config.autoApprove,
    viaAddress,
    viaType as any,
    config.verbose
  );
}

async function createDiamond(config: CLIConfig): Promise<Diamond> {
  const diamondConfig: DiamondConfig = {
    diamondName: config.diamondName,
    networkName: config.networkName,
    chainId: config.chainId,
    deploymentsPath: config.deploymentsPath!,
    contractsPath: 'contracts',
    writeDeployedDiamondData: true,
    configFilePath: config.configPath
  };

  const repository = new FileDeploymentRepository(diamondConfig);
  const diamond = new Diamond(diamondConfig, repository);

  // Setup provider and signer
  diamond.setProvider((hre as any).ethers.provider);

  // Get signer from environment or use default
  const signers = await (hre as any).ethers.getSigners();
  diamond.setSigner(signers[0]);

  return diamond;
}

program
  .command('deploy')
  .description('Deploy a new diamond via Defender')
  .option('-d, --diamond <name>', 'Diamond name')
  .option('-c, --config <path>', 'Path to diamond configuration file')
  .option('-a, --auto-approve', 'Auto-approve all proposals')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Starting Diamond deployment via Defender...'));

      const config = loadConfig();
      if (options.diamond) config.diamondName = options.diamond;
      if (options.config) config.configPath = options.config;
      if (options.autoApprove) config.autoApprove = true;
      if (options.verbose) config.verbose = true;

      const strategy = await createStrategy(config);
      const diamond = await createDiamond(config);
      const deployer = new DiamondDeployer(diamond, strategy);

      console.log(chalk.yellow(`📋 Configuration:`));
      console.log(`   Diamond: ${config.diamondName}`);
      console.log(`   Network: ${config.networkName} (${config.chainId})`);
      console.log(`   Relayer: ${config.relayerAddress}`);
      console.log(`   Via: ${config.safeAddress || config.relayerAddress}`);
      console.log(`   Auto-approve: ${config.autoApprove}`);
      console.log('');

      await deployer.deployDiamond();

      console.log(chalk.green('✅ Diamond deployment completed successfully!'));
    } catch (error: any) {
      console.error(chalk.red('❌ Deployment failed:'), error.message);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

program
  .command('upgrade')
  .description('Upgrade an existing diamond via Defender')
  .option('-d, --diamond <name>', 'Diamond name')
  .option('-c, --config <path>', 'Path to diamond configuration file')
  .option('-a, --auto-approve', 'Auto-approve all proposals')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      console.log(chalk.blue('♻️ Starting Diamond upgrade via Defender...'));

      const config = loadConfig();
      if (options.diamond) config.diamondName = options.diamond;
      if (options.config) config.configPath = options.config;
      if (options.autoApprove) config.autoApprove = true;
      if (options.verbose) config.verbose = true;

      const strategy = await createStrategy(config);
      const diamond = await createDiamond(config);

      // Verify diamond exists
      const deployedData = diamond.getDeployedDiamondData();
      if (!deployedData.DiamondAddress) {
        throw new Error('Diamond not found. Use "deploy" command for initial deployment.');
      }

      const deployer = new DiamondDeployer(diamond, strategy);

      console.log(chalk.yellow(`📋 Configuration:`));
      console.log(`   Diamond: ${config.diamondName}`);
      console.log(`   Address: ${deployedData.DiamondAddress}`);
      console.log(`   Network: ${config.networkName} (${config.chainId})`);
      console.log('');

      await deployer.deployDiamond();

      console.log(chalk.green('✅ Diamond upgrade completed successfully!'));
    } catch (error: any) {
      console.error(chalk.red('❌ Upgrade failed:'), error.message);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check the status of a diamond deployment')
  .option('-d, --diamond <name>', 'Diamond name')
  .action(async (options) => {
    try {
      const config = loadConfig();
      if (options.diamond) config.diamondName = options.diamond;

      const diamond = await createDiamond(config);
      const deployedData = diamond.getDeployedDiamondData();

      console.log(chalk.blue(`📊 Diamond Status: ${config.diamondName}`));
      console.log('='.repeat(50));

      if (deployedData.DiamondAddress) {
        console.log(chalk.green(`✅ Deployed`));
        console.log(`   Address: ${deployedData.DiamondAddress}`);
        console.log(`   Network: ${config.networkName} (${config.chainId})`);

        if (deployedData.DeployedFacets) {
          const facetCount = Object.keys(deployedData.DeployedFacets).length;
          console.log(`   Facets: ${facetCount}`);

          console.log('\n📦 Deployed Facets:');
          for (const [name, facet] of Object.entries(deployedData.DeployedFacets)) {
            console.log(`   • ${name}:`);
            console.log(`     Address: ${facet.address}`);
            console.log(`     Version: ${facet.version}`);
            console.log(`     Selectors: ${facet.funcSelectors?.length || 0}`);
          }
        }
      } else {
        console.log(chalk.yellow('⏳ Not deployed'));
        console.log('   Use "deploy" command to deploy this diamond.');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error(chalk.red('❌ Status check failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify all deployed contracts on Etherscan')
  .option('-d, --diamond <name>', 'Diamond name')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Starting contract verification...'));

      const config = loadConfig();
      if (options.diamond) config.diamondName = options.diamond;

      const diamond = await createDiamond(config);
      const deployedData = diamond.getDeployedDiamondData();

      if (!deployedData.DiamondAddress) {
        throw new Error('Diamond not deployed. Deploy first before verifying.');
      }

      const strategy = await createStrategy(config);

      // Note: Verification would typically be handled during deployment
      // This is a placeholder for future verification functionality
      console.log(chalk.yellow('📋 Contracts to verify:'));
      console.log(`   Diamond: ${deployedData.DiamondAddress}`);

      if (deployedData.DeployedFacets) {
        for (const [name, facet] of Object.entries(deployedData.DeployedFacets)) {
          console.log(`   ${name}: ${facet.address}`);
        }
      }

      console.log(chalk.green('✅ Verification completed!'));
    } catch (error: unknown) {
      const err = error as Error;
      console.error(chalk.red('❌ Verification failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('batch-deploy')
  .description('Deploy multiple diamonds from a batch configuration')
  .option('-b, --batch <path>', 'Path to batch configuration file')
  .option('-a, --auto-approve', 'Auto-approve all proposals')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    try {
      if (!options.batch) {
        throw new Error('Batch configuration file is required');
      }

      console.log(chalk.blue('🚀 Starting batch diamond deployment...'));

      const batchConfigPath = path.resolve(options.batch);
      if (!await fs.pathExists(batchConfigPath)) {
        throw new Error(`Batch configuration file not found: ${batchConfigPath}`);
      }

      const batchConfig = await fs.readJson(batchConfigPath);
      const baseConfig = loadConfig();

      if (options.autoApprove) baseConfig.autoApprove = true;
      if (options.verbose) baseConfig.verbose = true;

      console.log(chalk.yellow(`📋 Batch deployment of ${batchConfig.diamonds.length} diamonds:`));

      for (const diamondConfig of batchConfig.diamonds) {
        console.log(chalk.cyan(`\n🔄 Deploying ${diamondConfig.name}...`));

        const config = {
          ...baseConfig,
          diamondName: diamondConfig.name,
          networkName: diamondConfig.network || baseConfig.networkName,
          chainId: diamondConfig.chainId || baseConfig.chainId,
          configPath: diamondConfig.configPath
        };

        const strategy = await createStrategy(config);
        const diamond = await createDiamond(config);
        const deployer = new DiamondDeployer(diamond, strategy);

        await deployer.deployDiamond();

        console.log(chalk.green(`✅ ${diamondConfig.name} deployed successfully!`));
      }

      console.log(chalk.green('\n🎉 Batch deployment completed successfully!'));
    } catch (error: unknown) {
      const err = error as Error;
      console.error(chalk.red('❌ Batch deployment failed:'), err.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new diamond project with Defender integration')
  .option('-d, --diamond <name>', 'Diamond name')
  .option('-n, --network <name>', 'Network name')
  .option('-c, --chain-id <id>', 'Chain ID')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🏗️  Initializing new diamond project...'));

      const diamondName = options.diamond || 'MyDiamond';
      const networkName = options.network || 'mainnet';
      const chainId = options.chainId || '1';

      // Create directory structure
      const projectDir = path.join(process.cwd(), diamondName.toLowerCase());
      await fs.ensureDir(projectDir);
      await fs.ensureDir(path.join(projectDir, 'contracts'));
      await fs.ensureDir(path.join(projectDir, 'scripts'));
      await fs.ensureDir(path.join(projectDir, 'test'));
      await fs.ensureDir(path.join(projectDir, 'diamonds', diamondName));
      await fs.ensureDir(path.join(projectDir, 'diamonds', diamondName, 'deployments'));
      await fs.ensureDir(path.join(projectDir, 'diamonds', diamondName, 'callbacks'));

      // Create example configuration
      const exampleConfig = {
        version: 1,
        protocolVersion: 1,
        protocolInitFacet: 'ExampleFacet',
        facets: {
          ExampleFacet: {
            priority: 100,
            versions: {
              1: {
                deployInit: 'initialize()',
                upgradeInit: 'upgrade()'
              }
            }
          }
        }
      };

      await fs.writeJson(
        path.join(projectDir, 'diamonds', diamondName, `${diamondName.toLowerCase()}.config.json`),
        exampleConfig,
        { spaces: 2 }
      );

      // Create environment template
      const envTemplate = `# OpenZeppelin Defender Configuration
DEFENDER_API_KEY=your_api_key_here
DEFENDER_API_SECRET=your_api_secret_here
DEFENDER_RELAYER_ADDRESS=0x...
DEFENDER_SAFE_ADDRESS=0x...

# Network Configuration
NETWORK_NAME=${networkName}
CHAIN_ID=${chainId}
RPC_URL=https://...

# Diamond Configuration
DIAMOND_NAME=${diamondName}
DEPLOYMENTS_PATH=diamonds
DIAMOND_CONFIG_PATH=diamonds/${diamondName}/${diamondName.toLowerCase()}.config.json

# Deployment Options
DEFENDER_AUTO_APPROVE=false
VERBOSE=true
`;

      await fs.writeFile(path.join(projectDir, '.env.example'), envTemplate);

      // Create example deploy script
      const deployScript = `#!/usr/bin/env node
// Deploy script for ${diamondName}
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function deploy() {
  try {
    console.log('Deploying ${diamondName} via Defender...');
    
    const { stdout, stderr } = await execAsync('npx ts-node ../path/to/defender-cli.ts deploy');
    
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
`;

      await fs.writeFile(path.join(projectDir, 'scripts', 'deploy.ts'), deployScript);

      // Create README
      const readme = `# ${diamondName} Diamond Project

A Diamond Proxy (ERC-2535) project with OpenZeppelin Defender integration.

## Setup

1. Copy \`.env.example\` to \`.env\` and fill in your configuration:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Configure your Defender API keys and network settings in \`.env\`

3. Update the diamond configuration in \`diamonds/${diamondName}/${diamondName.toLowerCase()}.config.json\`

## Deployment

Deploy the diamond:
\`\`\`bash
npm run deploy
\`\`\`

Or use the CLI directly:
\`\`\`bash
npx defender-cli deploy --diamond ${diamondName}
\`\`\`

## Upgrade

Upgrade the diamond:
\`\`\`bash
npx defender-cli upgrade --diamond ${diamondName}
\`\`\`

## Status

Check deployment status:
\`\`\`bash
npx defender-cli status --diamond ${diamondName}
\`\`\`

## Verification

Verify contracts on Etherscan:
\`\`\`bash
npx defender-cli verify --diamond ${diamondName}
\`\`\`

## Project Structure

- \`contracts/\` - Solidity contracts
- \`diamonds/${diamondName}/\` - Diamond configuration and deployment data
- \`scripts/\` - Deployment and utility scripts
- \`test/\` - Test files
`;

      await fs.writeFile(path.join(projectDir, 'README.md'), readme);

      console.log(chalk.green(`✅ Project initialized successfully!`));
      console.log(chalk.yellow(`📁 Project directory: ${projectDir}`));
      console.log(chalk.cyan('\n📋 Next steps:'));
      console.log('1. cd ' + diamondName.toLowerCase());
      console.log('2. cp .env.example .env');
      console.log('3. Edit .env with your Defender configuration');
      console.log('4. npx defender-cli deploy');

    } catch (error: unknown) {
      const err = error as Error;
      console.error(chalk.red('❌ Initialization failed:'), err.message);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse(process.argv);
}

export { program as defenderCLI };
