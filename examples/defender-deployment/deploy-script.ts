import { ethers } from 'hardhat';
import { Diamond } from '../../src/core/Diamond';
import { DiamondDeployer } from '../../src/core/DiamondDeployer';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { OZDefenderDeploymentStrategy } from '../../src/strategies/OZDefenderDeploymentStrategy';
import * as path from 'path';
import * as fs from 'fs-extra';

async function main() {
  console.log('🚀 Starting Defender deployment...');

  // Get network information
  const network = await ethers.provider.getNetwork();
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  console.log(`📍 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);

  // Load configuration
  const configPath = path.join(__dirname, 'diamond-config.json');
  const exampleConfig = {
    diamondName: 'ExampleDiamond',
    networkName: network.name,
    chainId: network.chainId,
    deploymentsPath: path.join(__dirname, 'deployments'),
    contractsPath: path.join(__dirname, 'contracts'),
    callbacksPath: path.join(__dirname, 'callbacks'),
    configFilePath: configPath,
    deployedDiamondDataFilePath: path.join(__dirname, 'deployments', `examplediamond-${network.name}-${network.chainId}.json`)
  };

  // Ensure directories exist
  await fs.ensureDir(exampleConfig.deploymentsPath);
  await fs.ensureDir(exampleConfig.callbacksPath);

  // Create diamond instance
  const repository = new FileDeploymentRepository(exampleConfig);
  const diamond = new Diamond(exampleConfig, repository);

  // Setup provider and signer
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
      console.log('Please check your .env file and ensure all Defender credentials are set.');
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

  console.log('🛡️ Defender strategy configured');
  console.log(`⚙️ Auto-approve: ${process.env.AUTO_APPROVE === 'true' ? 'enabled' : 'disabled'}`);

  // Execute deployment
  const diamondDeployer = new DiamondDeployer(diamond, strategy);

  try {
    await diamondDeployer.deployDiamond();

    console.log('\n✅ Deployment completed successfully!');

    // Output deployment information
    const deployedData = diamond.getDeployedDiamondData();
    console.log('\n📊 Deployment Summary:');
    console.log(`Diamond Address: ${deployedData.DiamondAddress}`);
    console.log(`Deployer Address: ${deployedData.DeployerAddress}`);
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

    console.log('\n📋 Deployed Facets:');
    if (deployedData.DeployedFacets) {
      Object.entries(deployedData.DeployedFacets).forEach(([name, facet]) => {
        console.log(`  ${name}:`);
        console.log(`    Address: ${facet.address}`);
        console.log(`    Version: ${facet.version}`);
        console.log(`    Selectors: ${facet.funcSelectors?.length || 0}`);
        if (facet.tx_hash) {
          console.log(`    TX Hash: ${facet.tx_hash}`);
        }
      });
    }

    // Save deployment summary
    const summary = {
      timestamp: new Date().toISOString(),
      network: network.name,
      chainId: network.chainId,
      deployerAddress: deployer.address,
      diamondAddress: deployedData.DiamondAddress,
      facets: deployedData.DeployedFacets,
      deploymentMethod: 'OpenZeppelin Defender'
    };

    const summaryPath = path.join(exampleConfig.deploymentsPath, 'deployment-summary.json');
    await fs.writeJson(summaryPath, summary, { spaces: 2 });

    console.log(`\n📄 Deployment summary saved to: ${summaryPath}`);

    // Display next steps
    console.log('\n🎯 Next Steps:');
    console.log('1. Verify contracts on block explorer');
    console.log('2. Test diamond functionality');
    console.log('3. Set up monitoring and alerts');
    console.log('4. Prepare upgrade scenarios');

    if (process.env.AUTO_APPROVE !== 'true') {
      console.log('\n⚠️ Note: Auto-approval is disabled. Check your Defender dashboard for pending proposals.');
    }

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);

    // Save error information for debugging
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : String(error),
      network: network.name,
      chainId: network.chainId,
      deployerAddress: deployer.address
    };

    const errorPath = path.join(exampleConfig.deploymentsPath, 'deployment-error.json');
    await fs.writeJson(errorPath, errorInfo, { spaces: 2 });

    console.log(`\n🔍 Error details saved to: ${errorPath}`);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your Defender API credentials');
    console.log('2. Ensure sufficient balance for gas fees');
    console.log('3. Verify network connectivity');
    console.log('4. Check Defender dashboard for detailed logs');

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

export { main as deployWithDefender };
