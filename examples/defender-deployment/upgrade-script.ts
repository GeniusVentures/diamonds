import { ethers } from 'hardhat';
import { Diamond } from '../../src/core/Diamond';
import { DiamondDeployer } from '../../src/core/DiamondDeployer';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { OZDefenderDeploymentStrategy } from '../../src/strategies/OZDefenderDeploymentStrategy';
import * as path from 'path';
import * as fs from 'fs-extra';

async function main() {
  console.log('♻️ Starting upgrade process...');

  // Get network information
  const network = await ethers.provider.getNetwork();
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log(`📍 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);

  // Load and update configuration
  const configPath = path.join(__dirname, 'diamond-config.json');
  const deploymentDataPath = path.join(__dirname, 'deployments', `examplediamond-${network.name}-${network.chainId}.json`);

  // Check if initial deployment exists
  if (!await fs.pathExists(deploymentDataPath)) {
    console.error('❌ No existing deployment found. Please run deploy-script.ts first.');
    process.exit(1);
  }

  console.log('📄 Loading existing deployment data...');

  // Load current configuration
  const config = await fs.readJson(configPath);
  const originalVersion = config.protocolVersion;

  console.log(`📊 Current protocol version: ${originalVersion}`);

  // Update configuration for upgrade
  config.protocolVersion = 1.0;

  // Add new UpgradeFacet
  config.facets['UpgradeFacet'] = {
    priority: 50,
    versions: {
      "1.0": {
        deployInit: "initialize()",
        callbacks: ["logUpgrade"]
      }
    }
  };

  // Upgrade existing ExampleFacet1 to version 1.0
  if (!config.facets['ExampleFacet1'].versions) {
    config.facets['ExampleFacet1'].versions = {};
  }
  config.facets['ExampleFacet1'].versions["1.0"] = {
    upgradeInit: "upgradeToV1()",
    callbacks: ["validateUpgrade"]
  };

  console.log('📝 Updated configuration:');
  console.log(`  - Protocol version: ${originalVersion} → ${config.protocolVersion}`);
  console.log('  - Added UpgradeFacet v1.0');
  console.log('  - Upgraded ExampleFacet1 to v1.0');

  // Save updated configuration
  await fs.writeJson(configPath, config, { spaces: 2 });

  // Setup diamond configuration
  const diamondConfig = {
    diamondName: 'ExampleDiamond',
    networkName: network.name,
    chainId: network.chainId,
    deploymentsPath: path.join(__dirname, 'deployments'),
    contractsPath: path.join(__dirname, 'contracts'),
    callbacksPath: path.join(__dirname, 'callbacks'),
    configFilePath: configPath,
    deployedDiamondDataFilePath: deploymentDataPath
  };

  // Create diamond instance
  const repository = new FileDeploymentRepository(diamondConfig);
  const diamond = new Diamond(diamondConfig, repository);

  diamond.setProvider(ethers.provider);
  diamond.setSigner(deployer);

  // Validate environment variables
  const requiredEnvVars = [
    'DEFENDER_API_KEY',
    'DEFENDER_API_SECRET',
    'DEFENDER_RELAYER_ADDRESS',
    'DEFENDER_SAFE_ADDRESS'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Create Defender strategy
  const strategy = new OZDefenderDeploymentStrategy(
    process.env.DEFENDER_API_KEY!,
    process.env.DEFENDER_API_SECRET!,
    process.env.DEFENDER_RELAYER_ADDRESS!,
    process.env.AUTO_APPROVE === 'true',
    process.env.DEFENDER_SAFE_ADDRESS!,
    'Safe',
    true // verbose logging
  );

  console.log('🛡️ Defender strategy configured for upgrade');

  // Load existing deployment data to show before state
  const existingData = diamond.getDeployedDiamondData();
  console.log('\n📊 Pre-upgrade State:');
  console.log(`Diamond Address: ${existingData.DiamondAddress}`);
  if (existingData.DeployedFacets) {
    console.log('Current Facets:');
    Object.entries(existingData.DeployedFacets).forEach(([name, facet]) => {
      console.log(`  ${name}: v${facet.version} at ${facet.address}`);
    });
  }

  // Execute upgrade
  const diamondDeployer = new DiamondDeployer(diamond, strategy);

  try {
    console.log('\n🚀 Starting upgrade deployment...');
    await diamondDeployer.deployDiamond(); // Automatically detects upgrade scenario

    console.log('\n✅ Upgrade completed successfully!');

    // Output upgrade information
    const upgradedData = diamond.getDeployedDiamondData();
    console.log('\n📊 Post-upgrade State:');
    console.log(`Diamond Address: ${upgradedData.DiamondAddress}`);

    if (upgradedData.DeployedFacets) {
      console.log('Updated Facets:');
      Object.entries(upgradedData.DeployedFacets).forEach(([name, facet]) => {
        const isNew = !existingData.DeployedFacets?.[name];
        const isUpgraded = existingData.DeployedFacets?.[name]?.version !== facet.version;

        let status = '';
        if (isNew) status = ' [NEW]';
        else if (isUpgraded) status = ' [UPGRADED]';

        console.log(`  ${name}: v${facet.version} at ${facet.address}${status}`);
      });
    }

    // Create upgrade summary
    const upgradeSummary = {
      timestamp: new Date().toISOString(),
      network: network.name,
      chainId: network.chainId,
      deployerAddress: deployer.address,
      diamondAddress: upgradedData.DiamondAddress,
      upgrade: {
        fromVersion: originalVersion,
        toVersion: config.protocolVersion,
        newFacets: ['UpgradeFacet'],
        upgradedFacets: ['ExampleFacet1'],
        deploymentMethod: 'OpenZeppelin Defender'
      },
      facets: upgradedData.DeployedFacets
    };

    const summaryPath = path.join(diamondConfig.deploymentsPath, 'upgrade-summary.json');
    await fs.writeJson(summaryPath, upgradeSummary, { spaces: 2 });

    console.log(`\n📄 Upgrade summary saved to: ${summaryPath}`);

    // Display next steps
    console.log('\n🎯 Next Steps:');
    console.log('1. Test new functionality');
    console.log('2. Verify upgrade initialization');
    console.log('3. Update documentation');
    console.log('4. Notify stakeholders');

    if (process.env.AUTO_APPROVE !== 'true') {
      console.log('\n⚠️ Note: Auto-approval is disabled. Check your Defender dashboard for pending proposals.');
    }

  } catch (error) {
    console.error('\n❌ Upgrade failed:', error);

    // Restore original configuration
    config.protocolVersion = originalVersion;
    delete config.facets['UpgradeFacet'];
    if (config.facets['ExampleFacet1'].versions && config.facets['ExampleFacet1'].versions["1.0"]) {
      delete config.facets['ExampleFacet1'].versions["1.0"];
    }
    await fs.writeJson(configPath, config, { spaces: 2 });

    console.log('🔄 Configuration restored to pre-upgrade state');

    // Save error information
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error),
      network: network.name,
      chainId: network.chainId,
      deployerAddress: deployer.address,
      attemptedUpgrade: {
        fromVersion: originalVersion,
        toVersion: 1.0
      }
    };

    const errorPath = path.join(diamondConfig.deploymentsPath, 'upgrade-error.json');
    await fs.writeJson(errorPath, errorInfo, { spaces: 2 });

    console.log(`\n🔍 Error details saved to: ${errorPath}`);

    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { main as upgradeWithDefender };
