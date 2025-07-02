# Defender Deployment Example

This example demonstrates how to deploy and upgrade a Diamond proxy contract using OpenZeppelin Defender.

## Overview

This example includes:
- A complete Diamond implementation with multiple facets
- Configuration for Defender deployment
- Deployment and upgrade scripts
- Step-by-step instructions

## Prerequisites

1. OpenZeppelin Defender account with API credentials
2. Testnet ETH for gas fees
3. Node.js 16+ and npm

## Setup

1. **Clone and Install Dependencies**
   ```bash
   cd examples/defender-deployment
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Defender credentials
   ```

3. **Review Diamond Configuration**
   ```bash
   cat diamond-config.json
   ```

## Diamond Structure

### Contracts

- `ExampleDiamond.sol`: Main diamond contract
- `ExampleFacet1.sol`: Basic functionality facet
- `ExampleFacet2.sol`: Advanced functionality facet
- `UpgradeFacet.sol`: New facet for upgrade demonstration

### Configuration

```json
{
  "protocolVersion": 0.0,
  "protocolInitFacet": "ExampleFacet1",
  "facets": {
    "DiamondCutFacet": {
      "priority": 10,
      "versions": { "0.0": {} }
    },
    "DiamondLoupeFacet": {
      "priority": 20,
      "versions": { "0.0": {} }
    },
    "ExampleFacet1": {
      "priority": 30,
      "versions": {
        "0.0": {
          "deployInit": "initialize()",
          "callbacks": ["logDeployment"]
        }
      }
    },
    "ExampleFacet2": {
      "priority": 40,
      "versions": {
        "0.0": {
          "deployInit": "setup()",
          "callbacks": ["validateSetup"]
        }
      }
    }
  }
}
```

## Deployment Steps

### 1. Initial Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Or deploy to local hardhat network
npm run deploy:local
```

This will:
1. Deploy DiamondCutFacet through Defender
2. Deploy the main Diamond contract
3. Deploy all configured facets
4. Create a Defender proposal for the diamond cut
5. Execute the proposal (if auto-approval is enabled)

### 2. Verify Deployment

```bash
# Check deployment status
npm run status

# Verify on block explorer
npm run verify
```

### 3. Upgrade Example

```bash
# This adds UpgradeFacet and upgrades ExampleFacet1 to v1.0
npm run upgrade
```

## Script Explanations

### deploy-script.ts

```typescript
import { ethers } from 'hardhat';
import { Diamond, DiamondDeployer, FileDeploymentRepository } from '@diamonds/core';
import { OZDefenderDeploymentStrategy } from '@diamonds/strategies';

async function main() {
  console.log('🚀 Starting Defender deployment...');

  // Load configuration
  const config = {
    diamondName: 'ExampleDiamond',
    networkName: 'sepolia',
    chainId: 11155111,
    deploymentsPath: './deployments',
    contractsPath: './contracts',
    callbacksPath: './callbacks',
    configFilePath: './diamond-config.json',
    deployedDiamondDataFilePath: './deployments/exampledianmond-sepolia-11155111.json'
  };

  // Create diamond instance
  const repository = new FileDeploymentRepository(config);
  const diamond = new Diamond(config, repository);
  
  // Setup provider and signer
  diamond.setProvider(ethers.provider);
  diamond.setSigner(await ethers.getSigners()[0]);

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

  // Execute deployment
  const deployer = new DiamondDeployer(diamond, strategy);
  await deployer.deployDiamond();

  console.log('✅ Deployment completed!');
  
  // Output deployment information
  const deployedData = diamond.getDeployedDiamondData();
  console.log('\n📊 Deployment Summary:');
  console.log(`Diamond Address: ${deployedData.DiamondAddress}`);
  console.log(`Deployer Address: ${deployedData.DeployerAddress}`);
  console.log('\n📋 Deployed Facets:');
  
  Object.entries(deployedData.DeployedFacets || {}).forEach(([name, facet]) => {
    console.log(`  ${name}: ${facet.address} (v${facet.version})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
```

### upgrade-script.ts

```typescript
import { ethers } from 'hardhat';
import { Diamond, DiamondDeployer, FileDeploymentRepository } from '@diamonds/core';
import { OZDefenderDeploymentStrategy } from '@diamonds/strategies';
import * as fs from 'fs-extra';

async function main() {
  console.log('♻️ Starting upgrade process...');

  // Load and update configuration
  const configPath = './diamond-config.json';
  const config = await fs.readJson(configPath);
  
  // Add new facet for upgrade
  config.protocolVersion = 1.0;
  config.facets['UpgradeFacet'] = {
    priority: 50,
    versions: {
      "1.0": {
        deployInit: "initialize()",
        callbacks: ["logUpgrade"]
      }
    }
  };
  
  // Upgrade existing facet
  config.facets['ExampleFacet1'].versions["1.0"] = {
    upgradeInit: "upgradeToV1()",
    callbacks: ["validateUpgrade"]
  };

  // Save updated configuration
  await fs.writeJson(configPath, config, { spaces: 2 });

  // Setup diamond with existing deployment data
  const diamondConfig = {
    diamondName: 'ExampleDiamond',
    networkName: 'sepolia',
    chainId: 11155111,
    deploymentsPath: './deployments',
    contractsPath: './contracts',
    callbacksPath: './callbacks',
    configFilePath: configPath,
    deployedDiamondDataFilePath: './deployments/exampledianmond-sepolia-11155111.json'
  };

  const repository = new FileDeploymentRepository(diamondConfig);
  const diamond = new Diamond(diamondConfig, repository);
  
  diamond.setProvider(ethers.provider);
  diamond.setSigner(await ethers.getSigners()[0]);

  // Create strategy and execute upgrade
  const strategy = new OZDefenderDeploymentStrategy(
    process.env.DEFENDER_API_KEY!,
    process.env.DEFENDER_API_SECRET!,
    process.env.DEFENDER_RELAYER_ADDRESS!,
    process.env.AUTO_APPROVE === 'true',
    process.env.DEFENDER_SAFE_ADDRESS!,
    'Safe',
    true
  );

  const deployer = new DiamondDeployer(diamond, strategy);
  await deployer.deployDiamond(); // Automatically detects upgrade scenario

  console.log('✅ Upgrade completed!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Upgrade failed:', error);
    process.exit(1);
  });
```

## Callback Examples

### callbacks/logDeployment.ts

```typescript
export async function logDeployment(args: any) {
  console.log('📝 Deployment callback executed');
  console.log('Diamond Address:', args.diamondAddress);
  console.log('Facet Address:', args.facetAddress);
  console.log('Timestamp:', new Date().toISOString());
}
```

### callbacks/validateSetup.ts

```typescript
import { ethers } from 'hardhat';

export async function validateSetup(args: any) {
  console.log('🔍 Validating setup...');
  
  // Connect to deployed diamond
  const diamond = await ethers.getContractAt('ExampleFacet2', args.diamondAddress);
  
  // Validate initialization
  const isSetup = await diamond.isSetupComplete();
  if (!isSetup) {
    throw new Error('Setup validation failed');
  }
  
  console.log('✅ Setup validation passed');
}
```

## Expected Output

### Successful Deployment

```
🚀 Starting Defender deployment...

🪓 Pre-deploy diamond tasks for ExampleDiamond from OZDefenderDeploymentStrategy...
📡 Submitted DiamondCutFacet deploy to Defender: defender-deploy-id-1
✅ Deployment succeeded for deploy-diamondcutfacet.
📡 Submitted Diamond deploy to Defender: defender-deploy-id-2
✅ Deployment succeeded for deploy-diamond.

🚀 Deploying facet: DiamondLoupeFacet to version 0
📡 Submitted deployment for facet DiamondLoupeFacet: defender-deploy-id-3
✅ Deployment succeeded for deploy-DiamondLoupeFacet.

🚀 Deploying facet: ExampleFacet1 to version 0
📡 Submitted deployment for facet ExampleFacet1: defender-deploy-id-4
✅ Deployment succeeded for deploy-ExampleFacet1.

🚀 Deploying facet: ExampleFacet2 to version 0
📡 Submitted deployment for facet ExampleFacet2: defender-deploy-id-5
✅ Deployment succeeded for deploy-ExampleFacet2.

🪓 Performing DiamondCut with 3 cut(s):
- Add for facet DiamondLoupeFacet at 0x3456789012345678901234567890123456789012
- Add for facet ExampleFacet1 at 0x4567890123456789012345678901234567890123
- Add for facet ExampleFacet2 at 0x5678901234567890123456789012345678901234

📡 Defender Proposal created: https://defender.openzeppelin.com/proposal/test-proposal-123
⏳ Auto-approval enabled. Waiting for proposal to be ready for execution...
✅ Proposal executed successfully.

📝 Deployment callback executed
🔍 Validating setup...
✅ Setup validation passed

✅ Deployment completed!

📊 Deployment Summary:
Diamond Address: 0x1234567890123456789012345678901234567890
Deployer Address: 0x742d35Cc6634C0532925a3b8D50d97e7

📋 Deployed Facets:
  DiamondCutFacet: 0x2345678901234567890123456789012345678901 (v0)
  DiamondLoupeFacet: 0x3456789012345678901234567890123456789012 (v0)
  ExampleFacet1: 0x4567890123456789012345678901234567890123 (v0)
  ExampleFacet2: 0x5678901234567890123456789012345678901234 (v0)
```

## Troubleshooting

### Common Issues

1. **API Authentication Error**
   ```
   Error: Invalid API credentials
   ```
   **Solution**: Verify your `DEFENDER_API_KEY` and `DEFENDER_API_SECRET` in `.env`

2. **Insufficient Balance**
   ```
   Error: insufficient funds for gas
   ```
   **Solution**: Add testnet ETH to your deployer address

3. **Network Configuration**
   ```
   Error: could not detect network
   ```
   **Solution**: Verify your RPC URL and network settings

4. **Multi-sig Approval Required**
   ```
   Warning: Proposal awaiting approval
   ```
   **Solution**: Check Defender dashboard for pending proposals

### Debug Mode

Enable verbose logging:
```bash
DEBUG=diamonds:* npm run deploy:sepolia
```

## Next Steps

1. **Customize Facets**: Modify the example facets for your use case
2. **Add More Facets**: Extend the diamond with additional functionality
3. **Production Deployment**: Configure for mainnet deployment
4. **Monitoring**: Set up monitoring and alerting through Defender
5. **Automation**: Create automated deployment pipelines

## Resources

- [OpenZeppelin Defender Documentation](https://docs.openzeppelin.com/defender/)
- [ERC-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Diamonds Module Documentation](../../docs/defender-integration.md)
