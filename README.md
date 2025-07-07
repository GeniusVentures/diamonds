# Diamonds Module

[![npm version](https://badge.fury.io/js/@geniusventures%2Fdiamonds.svg)](https://badge.fury.io/js/@geniusventures%2Fdiamonds)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19+-orange.svg)](https://hardhat.org/)

A comprehensive TypeScript framework for deploying, upgrading, and managing ERC-2535 Diamond Proxy contracts with enterprise-grade features including OpenZeppelin Defender integration, sophisticated version management, and flexible deployment strategies.

## ✨ Key Features

### 🏗️ **Complete Diamond Implementation**

- Full ERC-2535 Diamond Proxy Standard support
- Modular facet architecture with automated function selector management
- Smart collision detection and resolution
- Comprehensive state management and validation

### 🛡️ **Enterprise Security**

- **OpenZeppelin Defender Integration**: Secure deployments through Defender's infrastructure
- **Multi-signature Support**: Gnosis Safe and custom multisig workflows
- **Automated Verification**: Contract verification on Etherscan and other explorers
- **Access Control**: Role-based deployment permissions

### 🔄 **Advanced Deployment Management**

- **Strategy Pattern**: Pluggable deployment strategies (Local, Defender, Custom)
- **Version Control**: Sophisticated versioning for facets and protocols
- **Upgrade Automation**: Intelligent upgrade detection and execution
- **Rollback Support**: Safe rollback mechanisms

### 🏭 **Production Ready**

- **Repository Pattern**: Flexible data persistence (File-based, Database-ready)
- **Configuration Management**: JSON-based configuration with validation
- **Comprehensive Testing**: Unit, integration, and end-to-end test suites
- **CLI Tools**: Command-line interface for deployment operations

## 🚀 Quick Start

### Installation

```bash
npm install @geniusventures/diamonds
```

### Basic Usage

```typescript
import { Diamond, DiamondDeployer, FileDeploymentRepository } from '@geniusventures/diamonds';
import { LocalDeploymentStrategy } from '@geniusventures/diamonds/strategies';
import { ethers } from 'hardhat';

// Create diamond configuration
const config = {
  diamondName: 'MyDiamond',
  networkName: 'localhost',
  chainId: 31337,
  deploymentsPath: './diamonds',
  contractsPath: './contracts'
};

// Setup diamond and deployment components
const repository = new FileDeploymentRepository(config);
const diamond = new Diamond(config, repository);

// Set provider and signer
diamond.setProvider(ethers.provider);
diamond.setSigner(await ethers.getSigners()[0]);

// Deploy using local strategy
const strategy = new LocalDeploymentStrategy(true); // verbose logging
const deployer = new DiamondDeployer(diamond, strategy);

await deployer.deployDiamond();
```

## 📋 Project Structure

```bash
diamonds/
├── src/                           # Source code
│   ├── core/                      # Core classes
│   │   ├── Diamond.ts             # Main diamond management
│   │   ├── DiamondDeployer.ts     # Deployment orchestration
│   │   ├── DeploymentManager.ts   # Deployment lifecycle
│   │   └── CallbackManager.ts     # Post-deployment callbacks
│   ├── strategies/                # Deployment strategies
│   │   ├── BaseDeploymentStrategy.ts
│   │   ├── LocalDeploymentStrategy.ts
│   │   └── OZDefenderDeploymentStrategy.ts
│   ├── repositories/              # Data persistence
│   │   ├── DeploymentRepository.ts
│   │   ├── FileDeploymentRepository.ts
│   │   └── jsonFileHandler.ts
│   ├── schemas/                   # Zod validation schemas
│   │   └── DeploymentSchema.ts
│   ├── types/                     # TypeScript definitions
│   ├── utils/                     # Utility functions
│   └── helpers/                   # Helper functions
├── docs/                          # Documentation
├── examples/                      # Usage examples
├── test/                          # Test suites
└── scripts/                       # CLI and utility scripts
```

## 🔧 Configuration

### Diamond Configuration

Create a diamond configuration file (`myDiamond.config.json`):

```json
{
  "protocolVersion": 1.0,
  "protocolInitFacet": "MyProtocolFacet",
  "facets": {
    "DiamondCutFacet": {
      "priority": 10,
      "versions": {
        "1.0": {}
      }
    },
    "DiamondLoupeFacet": {
      "priority": 20,
      "versions": {
        "1.0": {}
      }
    },
    "MyCustomFacet": {
      "priority": 30,
      "versions": {
        "1.0": {
          "deployInit": "initialize()",
          "upgradeInit": "upgradeToV1()",
          "callbacks": ["postDeployCallback"],
          "deployInclude": ["0x12345678"],
          "deployExclude": ["0x87654321"]
        }
      }
    }
  }
}
```

### Environment Configuration

```bash
# Network Configuration
NETWORK_NAME=sepolia
CHAIN_ID=11155111
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# OpenZeppelin Defender (Optional)
DEFENDER_API_KEY=your_api_key
DEFENDER_API_SECRET=your_api_secret
DEFENDER_RELAYER_ADDRESS=0x...
DEFENDER_SAFE_ADDRESS=0x...

# Deployment Options
AUTO_APPROVE_DEFENDER_PROPOSALS=false
VERBOSE_DEPLOYMENT=true
```

## 🛡️ OpenZeppelin Defender Integration

The Diamonds module provides seamless integration with OpenZeppelin Defender for enterprise-grade deployments.

### Setup Defender

1. **Create Defender Account**: Visit [OpenZeppelin Defender](https://defender.openzeppelin.com/)
2. **Generate API Credentials**: Create API keys with Deploy and Admin permissions
3. **Configure Environment**: Set your API credentials in `.env`

### Deploy with Defender

```typescript
import { OZDefenderDeploymentStrategy } from '@geniusventures/diamonds/strategies';

const strategy = new OZDefenderDeploymentStrategy(
  process.env.DEFENDER_API_KEY!,
  process.env.DEFENDER_API_SECRET!,
  process.env.DEFENDER_RELAYER_ADDRESS!,
  false, // manual approval for production
  process.env.DEFENDER_SAFE_ADDRESS!,
  'Safe'
);

const deployer = new DiamondDeployer(diamond, strategy);
await deployer.deployDiamond();
```

### Features

- **Secure Deployments**: All deployments go through Defender's secure infrastructure
- **Multi-signature Support**: Integrate with Gnosis Safe for production deployments
- **Automated Monitoring**: Real-time deployment tracking and status updates
- **Gas Optimization**: Automatic gas price optimization and retry logic

## 🔄 Deployment Strategies

### Local Strategy

For development and testing:

```typescript
import { LocalDeploymentStrategy } from '@geniusventures/diamonds/strategies';

const strategy = new LocalDeploymentStrategy(true); // verbose logging
```

### Defender Strategy

For production deployments:

```typescript
import { OZDefenderDeploymentStrategy } from '@geniusventures/diamonds/strategies';

const strategy = new OZDefenderDeploymentStrategy(
  apiKey,
  apiSecret,
  relayerAddress,
  autoApprove,
  viaAddress,
  viaType,
  verbose
);
```

### Custom Strategy

Implement your own deployment strategy:

```typescript
import { BaseDeploymentStrategy } from '@geniusventures/diamonds/strategies';

export class CustomDeploymentStrategy extends BaseDeploymentStrategy {
  protected async deployDiamondTasks(diamond: Diamond): Promise<void> {
    // Custom deployment logic
  }
  
  protected async performDiamondCutTasks(diamond: Diamond): Promise<void> {
    // Custom diamond cut logic
  }
}
```

## 📊 Advanced Features

### Version Management

The Diamonds module provides sophisticated version management:

```json
{
  "facets": {
    "MyFacet": {
      "priority": 100,
      "versions": {
        "1.0": {
          "deployInit": "initialize()",
          "upgradeInit": "upgradeToV1()"
        },
        "2.0": {
          "deployInit": "initialize()",
          "upgradeInit": "upgradeToV2()",
          "fromVersions": [1.0]
        }
      }
    }
  }
}
```

### Function Selector Management

Automatic function selector management with collision detection:

- **Priority-based Resolution**: Higher priority facets take precedence
- **Include/Exclude Lists**: Fine-grained control over function selectors
- **Collision Detection**: Automatic detection and resolution of selector conflicts
- **Orphaned Selector Prevention**: Validation to prevent deployment issues

### Post-Deployment Callbacks

Execute custom logic after deployment:

```typescript
// In your callbacks directory
export async function postDeployCallback(args: CallbackArgs) {
  const { diamond } = args;
  console.log(`Post-deployment callback executed for ${diamond.diamondName}`);
  
  // Custom post-deployment logic
  await customInitialization();
}
```

## 🧪 Testing

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Test specific network
TEST_NETWORK=sepolia npm test
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **Defender Integration**: End-to-end Defender testing
- **Performance Tests**: Deployment speed and resource usage

### Example Test

```typescript
describe('Diamond Deployment', () => {
  let diamond: Diamond;
  let strategy: LocalDeploymentStrategy;

  beforeEach(() => {
    const config = {
      diamondName: 'TestDiamond',
      networkName: 'hardhat',
      chainId: 31337,
      deploymentsPath: './test-diamonds',
      contractsPath: './contracts'
    };
    
    const repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);
    strategy = new LocalDeploymentStrategy();
  });

  it('should deploy diamond successfully', async () => {
    const deployer = new DiamondDeployer(diamond, strategy);
    await deployer.deployDiamond();
    
    const deployedData = diamond.getDeployedDiamondData();
    expect(deployedData.DiamondAddress).to.not.be.undefined;
  });
});
```

## 🛠️ CLI Tools

The Diamonds module includes a comprehensive CLI for deployment management:

```bash
# Install CLI globally
npm install -g @geniusventures/diamonds

# Deploy a diamond
diamonds deploy --diamond MyDiamond --network sepolia

# Upgrade a diamond
diamonds upgrade --diamond MyDiamond

# Check deployment status
diamonds status --diamond MyDiamond

# Verify contracts
diamonds verify --diamond MyDiamond

# Initialize new project
diamonds init --diamond MyNewDiamond --network mainnet
```

### CLI Options

- `--diamond <name>`: Diamond name
- `--network <name>`: Target network
- `--config <path>`: Configuration file path
- `--auto-approve`: Auto-approve Defender proposals
- `--verbose`: Verbose output
- `--batch <path>`: Batch deployment configuration

## 📖 Examples

### Basic Diamond Deployment

```typescript
import { Diamond, DiamondDeployer, FileDeploymentRepository } from '@geniusventures/diamonds';
import { LocalDeploymentStrategy } from '@geniusventures/diamonds/strategies';

async function deployBasicDiamond() {
  const config = {
    diamondName: 'BasicDiamond',
    networkName: 'localhost',
    chainId: 31337,
    deploymentsPath: './diamonds',
    contractsPath: './contracts'
  };

  const repository = new FileDeploymentRepository(config);
  const diamond = new Diamond(config, repository);
  
  diamond.setProvider(ethers.provider);
  diamond.setSigner(await ethers.getSigners()[0]);

  const strategy = new LocalDeploymentStrategy();
  const deployer = new DiamondDeployer(diamond, strategy);

  await deployer.deployDiamond();
  console.log('Diamond deployed successfully!');
}
```

### Production Deployment with Defender

```typescript
import { OZDefenderDeploymentStrategy } from '@geniusventures/diamonds/strategies';

async function deployProductionDiamond() {
  const config = {
    diamondName: 'ProductionDiamond',
    networkName: 'mainnet',
    chainId: 1,
    deploymentsPath: './diamonds',
    contractsPath: './contracts'
  };

  const repository = new FileDeploymentRepository(config);
  const diamond = new Diamond(config, repository);
  
  // Setup provider and signer for mainnet
  diamond.setProvider(mainnetProvider);
  diamond.setSigner(productionSigner);

  const strategy = new OZDefenderDeploymentStrategy(
    process.env.DEFENDER_API_KEY!,
    process.env.DEFENDER_API_SECRET!,
    process.env.DEFENDER_RELAYER_ADDRESS!,
    false, // manual approval for production
    process.env.DEFENDER_SAFE_ADDRESS!,
    'Safe'
  );

  const deployer = new DiamondDeployer(diamond, strategy);
  await deployer.deployDiamond();
}
```

### Complex Multi-Facet Upgrade

```typescript
async function performComplexUpgrade() {
  // Load existing diamond
  const diamond = await loadExistingDiamond('MyDiamond');
  
  // Update configuration for new version
  const config = diamond.repository.loadDeployConfig();
  config.protocolVersion = 2.0;
  
  // Add new facet
  config.facets.NewFeatureFacet = {
    priority: 150,
    versions: {
      "2.0": {
        deployInit: "initialize()",
        callbacks: ["setupNewFeature"]
      }
    }
  };
  
  // Upgrade existing facet
  config.facets.ExistingFacet.versions["2.0"] = {
    upgradeInit: "upgradeToV2()",
    fromVersions: [1.0]
  };
  
  await diamond.repository.saveDeployConfig(config);
  
  // Execute upgrade
  const strategy = new OZDefenderDeploymentStrategy(/* config */);
  const deployer = new DiamondDeployer(diamond, strategy);
  await deployer.deployDiamond();
}
```

## 🔍 Monitoring and Debugging

### Enable Verbose Logging

```typescript
const strategy = new LocalDeploymentStrategy(true); // Enable verbose mode
```

### Debug Function Selectors

```typescript
import { getSighash } from '@geniusventures/diamonds/utils';

// Get function selector
const selector = getSighash('transfer(address,uint256)');
console.log('Selector:', selector);

// Check if selector is registered
const isRegistered = diamond.isFunctionSelectorRegistered(selector);
console.log('Is registered:', isRegistered);
```

### Monitor Deployment State

```typescript
// Check deployment status
const deployedData = diamond.getDeployedDiamondData();
console.log('Diamond address:', deployedData.DiamondAddress);
console.log('Deployed facets:', Object.keys(deployedData.DeployedFacets || {}));

// Validate on-chain state
import { diffDeployedFacets } from '@geniusventures/diamonds/utils';
const isConsistent = await diffDeployedFacets(deployedData, ethers.provider, true);
```

## 🔐 Security Considerations

### Production Best Practices

1. **Use Multi-signature Wallets**: Always use multi-sig for mainnet deployments
2. **Test Thoroughly**: Test all upgrades on testnets first
3. **Verify Contracts**: Ensure all contracts are verified on Etherscan
4. **Monitor Deployments**: Use Defender monitoring for production systems
5. **Access Control**: Implement proper role-based access controls

### Secure Configuration

```typescript
// Production configuration example
const productionConfig = {
  diamondName: 'ProductionDiamond',
  networkName: 'mainnet',
  chainId: 1,
  deploymentsPath: './production-diamonds',
  contractsPath: './contracts',
  writeDeployedDiamondData: true
};

const strategy = new OZDefenderDeploymentStrategy(
  process.env.PROD_DEFENDER_API_KEY!,
  process.env.PROD_DEFENDER_API_SECRET!,
  process.env.PROD_RELAYER_ADDRESS!,
  false, // Never auto-approve in production
  process.env.PROD_SAFE_ADDRESS!,
  'Safe'
);
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/geniusventures/diamonds.git
cd diamonds

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run linting
npm run lint
```

### Coding Standards

- Follow TypeScript best practices
- Maintain 90%+ test coverage
- Use conventional commit messages
- Update documentation for new features
- Add comprehensive tests for new functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for Defender platform and security tools
- [ERC-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535) authors
- [Hardhat](https://hardhat.org/) development framework
- The Ethereum community for continuous innovation

## 📞 Support

- **Documentation**: [Full Documentation](https://docs.geniusventures.com/diamonds)
- **GitHub Issues**: [Report Issues](https://github.com/geniusventures/diamonds/issues)
- **Discord**: [Join our Community](https://discord.gg/geniusventures)
- **Email**: <support@geniusventures.com>

---

**Built with ❤️ for the Ethereum ecosystem by [Genius Ventures](https://geniusventures.com)**
