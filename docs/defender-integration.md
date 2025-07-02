# OpenZeppelin Defender Integration for Diamonds Module

## Overview

The Diamonds module provides comprehensive integration with OpenZeppelin Defender, enabling enterprise-grade deployment and management of ERC-2535 Diamond Proxy contracts. This integration offers:

- **Secure Deployments**: Deploy contracts through Defender's secure infrastructure
- **Multi-signature Support**: Integrate with Gnosis Safe and other multi-sig wallets
- **Automated Execution**: Optional auto-approval for streamlined deployments
- **Transaction Monitoring**: Track deployment status and execution through Defender dashboard
- **Contract Verification**: Automatic contract verification through Defender
- **Robust Error Handling**: Comprehensive retry logic and error recovery

## Benefits of Using Defender

### Security
- Private key management through Defender's secure infrastructure
- Multi-signature approval workflows for critical operations
- Automated security scanning and monitoring
- Role-based access controls

### Reliability
- Built-in retry mechanisms for failed transactions
- Gas price optimization
- Network congestion handling
- Transaction monitoring and confirmation

### Transparency
- Complete audit trail of all deployment operations
- Real-time status updates through Defender dashboard
- Integration with monitoring and alerting systems
- Detailed transaction logs and analytics

## Setup and Configuration

### 1. Defender Account Setup

1. **Create Defender Account**
   - Visit [OpenZeppelin Defender](https://defender.openzeppelin.com/)
   - Sign up or log in to your account
   - Navigate to the API section

2. **Generate API Credentials**
   ```bash
   # In Defender dashboard:
   # 1. Go to "API Keys" section
   # 2. Click "Create API Key"
   # 3. Select appropriate permissions:
   #    - Deploy (for contract deployments)
   #    - Admin (for proposal management)
   # 4. Copy API Key and Secret
   ```

3. **Setup Relayer (Optional)**
   ```bash
   # For automated transaction execution:
   # 1. Go to "Relay" section
   # 2. Create new Relayer
   # 3. Fund relayer with appropriate gas tokens
   # 4. Copy relayer address
   ```

4. **Setup Multi-sig (Recommended)**
   ```bash
   # For production deployments:
   # 1. Deploy or import existing Gnosis Safe
   # 2. Configure signers and threshold
   # 3. Add Safe address to Defender
   ```

### 2. Environment Configuration

Create a `.env` file in your project root:

```bash
# OpenZeppelin Defender Configuration
DEFENDER_API_KEY=your_api_key_here
DEFENDER_API_SECRET=your_api_secret_here
DEFENDER_RELAYER_ADDRESS=0x1234567890123456789012345678901234567890
DEFENDER_SAFE_ADDRESS=0x0987654321098765432109876543210987654321

# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Deployment Settings
AUTO_APPROVE_DEFENDER_PROPOSALS=false
AUTO_VERIFY_CONTRACTS=true
VERBOSE_DEPLOYMENT=true
```

### 3. Project Configuration

Update your `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  },
  // ... other configuration
};

export default config;
```

## Deployment Workflow

### Basic Deployment

```typescript
import { ethers } from 'hardhat';
import { Diamond, DiamondDeployer, FileDeploymentRepository } from '@diamonds/core';
import { OZDefenderDeploymentStrategy } from '@diamonds/strategies';

async function deployWithDefender() {
  // Setup configuration
  const config = {
    diamondName: 'MyDiamond',
    networkName: 'sepolia',
    chainId: 11155111,
    deploymentsPath: './deployments',
    contractsPath: './contracts',
    // ... other config
  };

  // Create repository and diamond
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
    process.env.AUTO_APPROVE_DEFENDER_PROPOSALS === 'true',
    process.env.DEFENDER_SAFE_ADDRESS!,
    'Safe'
  );

  // Deploy diamond
  const deployer = new DiamondDeployer(diamond, strategy);
  await deployer.deployDiamond();
  
  console.log('✅ Diamond deployed successfully through Defender!');
}
```

### Advanced Configuration

```typescript
// Custom polling configuration
const strategy = new OZDefenderDeploymentStrategy(
  apiKey,
  apiSecret,
  relayerAddress,
  false, // Manual approval
  safeAddress,
  'Safe',
  true   // Verbose logging
);

// Deploy with custom timeout
const deployer = new DiamondDeployer(diamond, strategy);
await deployer.deployDiamond();
```

## Upgrade Process

The upgrade process automatically detects existing deployments and only deploys changed facets:

```typescript
// Update your diamond configuration
const config = repository.loadDeployConfig();
config.protocolVersion = 2.0;
config.facets['MyFacet'].versions['2.0'] = {
  deployInit: "initialize()",
  upgradeInit: "upgradeToV2()",
  callbacks: ["postUpgradeCallback"]
};

// Save configuration
await repository.saveDeployConfig(config);

// Deploy upgrade (automatically detected)
await deployer.deployDiamond();
```

### Upgrade Features

- **Selective Deployment**: Only modified facets are redeployed
- **Version Management**: Automatic version detection and management
- **State Migration**: Support for upgrade initialization functions
- **Rollback Support**: Maintain deployment history for rollback scenarios

## Multi-Signature Integration

### Gnosis Safe Configuration

```typescript
const strategy = new OZDefenderDeploymentStrategy(
  apiKey,
  apiSecret,
  relayerAddress,
  false, // Disable auto-approval for multi-sig
  safeAddress,
  'Safe'
);

// Deployment will create proposals requiring Safe approval
await deployer.deployDiamond();
```

### Approval Workflow

1. **Proposal Creation**: Defender creates proposal for diamond cut
2. **Multi-sig Review**: Safe owners review and approve proposal
3. **Execution**: Once threshold met, proposal executes automatically
4. **Confirmation**: Deployment status updated in local state

## Monitoring and Status

### Deployment Status Tracking

```typescript
// Check deployment status
const deployedData = diamond.getDeployedDiamondData();
console.log('Diamond Address:', deployedData.DiamondAddress);
console.log('Deployed Facets:', Object.keys(deployedData.DeployedFacets || {}));

// Check Defender store
const store = new DefenderDeploymentStore(
  diamond.diamondName,
  `${diamond.diamondName}-${networkName}-${chainId}`
);

const steps = store.list();
steps.forEach(step => {
  console.log(`${step.stepName}: ${step.status}`);
});
```

### Real-time Monitoring

Access the Defender dashboard to monitor:
- Deployment progress in real-time
- Transaction status and confirmations
- Gas usage and optimization recommendations
- Error logs and debugging information

## Error Handling and Recovery

### Automatic Retry Logic

The Defender strategy includes comprehensive error handling:

```typescript
// Built-in retry with exponential backoff
const pollOptions = {
  maxAttempts: 10,
  initialDelayMs: 8000,
  maxDelayMs: 60000,
  jitter: true
};
```

### Common Error Scenarios

1. **Network Congestion**
   - Automatic retry with increased gas prices
   - Exponential backoff for polling

2. **Deployment Failures**
   - Detailed error reporting
   - State preservation for resumption

3. **Proposal Failures**
   - Clear error messages
   - Manual intervention guidance

### Recovery Procedures

```typescript
// Resume failed deployment
const strategy = new OZDefenderDeploymentStrategy(/* config */);

// Check existing state
const deployedData = diamond.getDeployedDiamondData();
if (deployedData.DiamondAddress) {
  console.log('Resuming from existing deployment...');
}

// Continue deployment
await deployer.deployDiamond();
```

## Security Considerations

### Production Best Practices

1. **API Key Management**
   - Store API keys in secure environment variables
   - Use different keys for different environments
   - Regularly rotate API credentials

2. **Multi-signature Setup**
   - Always use multi-sig for mainnet deployments
   - Set appropriate signing thresholds
   - Regularly audit signer access

3. **Network Security**
   - Use secure RPC endpoints
   - Enable transaction monitoring
   - Set up alerting for unusual activity

4. **Contract Verification**
   - Enable automatic verification
   - Verify source code matches deployed bytecode
   - Maintain verification records

### Access Controls

```typescript
// Role-based deployment configuration
const productionStrategy = new OZDefenderDeploymentStrategy(
  process.env.PROD_DEFENDER_API_KEY!,
  process.env.PROD_DEFENDER_API_SECRET!,
  process.env.PROD_RELAYER_ADDRESS!,
  false, // Never auto-approve in production
  process.env.PROD_SAFE_ADDRESS!,
  'Safe'
);
```

## Troubleshooting

### Common Issues

1. **API Authentication Errors**
   ```bash
   Error: Invalid API credentials
   Solution: Verify DEFENDER_API_KEY and DEFENDER_API_SECRET
   ```

2. **Network Connection Issues**
   ```bash
   Error: Request timeout
   Solution: Check network connectivity and RPC endpoint
   ```

3. **Insufficient Gas**
   ```bash
   Error: Transaction underpriced
   Solution: Increase gas price or use gas optimization
   ```

4. **Multi-sig Threshold Not Met**
   ```bash
   Warning: Proposal awaiting approval
   Solution: Additional Safe signers need to approve
   ```

### Debugging Steps

1. **Enable Verbose Logging**
   ```typescript
   const strategy = new OZDefenderDeploymentStrategy(
     // ... config
     true // Enable verbose logging
   );
   ```

2. **Check Defender Dashboard**
   - Review deployment status
   - Check transaction logs
   - Verify proposal status

3. **Validate Configuration**
   ```typescript
   // Verify network settings
   console.log('Network:', diamond.getDiamondConfig().networkName);
   console.log('Chain ID:', diamond.getDiamondConfig().chainId);
   ```

## Performance Optimization

### Gas Optimization

- Use appropriate gas limits
- Monitor gas prices
- Implement batch operations where possible

### Network Efficiency

- Minimize redundant API calls
- Use connection pooling
- Implement request caching

### Deployment Speed

- Parallel facet deployments where safe
- Optimized polling intervals
- Efficient state management

## Integration Examples

See the `examples/defender-deployment/` directory for complete working examples including:

- Basic diamond deployment
- Multi-facet upgrade scenarios
- Multi-signature workflow
- Error handling patterns
- Production deployment scripts

## Support and Resources

- [OpenZeppelin Defender Documentation](https://docs.openzeppelin.com/defender/)
- [ERC-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)
- [Diamonds Module GitHub](https://github.com/your-org/diamonds)
- [Community Discord](https://discord.gg/your-server)
