# Diamonds Module - OpenZeppelin Defender Integration

## Project Overview

This project provides a comprehensive implementation of the ERC-2535 Diamond Proxy Standard with full OpenZeppelin Defender integration for enterprise-grade smart contract deployment and management.

## ✨ Key Features

### Core Functionality

- **ERC-2535 Diamond Proxy**: Full implementation of the Diamond standard
- **Modular Facet System**: Add, replace, and remove functionality without changing the main contract
- **Version Management**: Sophisticated versioning system for facets and protocols
- **Strategy Pattern**: Pluggable deployment strategies (Local, Defender, Custom)
- **Repository Pattern**: Flexible data persistence (File-based, Database-ready)

### OpenZeppelin Defender Integration

- **Secure Deployments**: Deploy contracts through Defender's secure infrastructure
- **Multi-signature Support**: Integrate with Gnosis Safe and other multi-sig wallets
- **Automated Execution**: Optional auto-approval for streamlined deployments
- **Transaction Monitoring**: Real-time deployment tracking and status updates
- **Contract Verification**: Automatic contract verification through Defender
- **Robust Error Handling**: Comprehensive retry logic and error recovery

### Enterprise Features

- **TypeScript**: Full type safety with strict TypeScript configuration
- **Comprehensive Testing**: Unit, integration, and end-to-end test suites
- **Documentation**: Extensive documentation and examples
- **CI/CD Ready**: GitHub Actions integration and automated testing
- **Security Focused**: Best practices for production deployments

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # v18.0.0 or higher
npm --version   # 8.0.0 or higher

# Git
git --version
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/diamonds.git
cd diamonds

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration
```

### Basic Usage

```typescript
import { Diamond, DiamondDeployer, FileDeploymentRepository } from '@diamonds/core';
import { OZDefenderDeploymentStrategy } from '@diamonds/strategies';

// Create diamond configuration
const config = {
  diamondName: 'MyDiamond',
  networkName: 'sepolia',
  chainId: 11155111,
  deploymentsPath: './deployments',
  contractsPath: './contracts'
  // ... other configuration
};

// Setup diamond and strategy
const repository = new FileDeploymentRepository(config);
const diamond = new Diamond(config, repository);
const strategy = new OZDefenderDeploymentStrategy(
  process.env.DEFENDER_API_KEY!,
  process.env.DEFENDER_API_SECRET!,
  process.env.DEFENDER_RELAYER_ADDRESS!,
  false, // manual approval
  process.env.DEFENDER_SAFE_ADDRESS!,
  'Safe'
);

// Deploy diamond
const deployer = new DiamondDeployer(diamond, strategy);
await deployer.deployDiamond();
```

## 📁 Project Structure

```bash
diamonds/
├── src/                           # Source code
│   ├── core/                      # Core classes (Diamond, DiamondDeployer, etc.)
│   ├── strategies/                # Deployment strategies
│   ├── repositories/              # Data persistence layer
│   ├── schemas/                   # Zod validation schemas
│   ├── types/                     # TypeScript type definitions
│   └── utils/                     # Utility functions
├── test/                          # Test suites
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   └── helpers/                   # Test utilities
├── examples/                      # Complete examples
│   └── defender-deployment/       # Defender integration example
├── docs/                          # Documentation
│   ├── defender-integration.md    # Defender setup guide
│   └── testing-guide.md          # Testing documentation
└── artifacts/                     # Compiled contracts
```

## 🛡️ OpenZeppelin Defender Setup

### 1. Create Defender Account

1. Visit [OpenZeppelin Defender](https://defender.openzeppelin.com/)
2. Sign up or log in
3. Generate API credentials with Deploy and Admin permissions

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
DEFENDER_API_KEY=your_api_key_here
DEFENDER_API_SECRET=your_api_secret_here
DEFENDER_RELAYER_ADDRESS=0x1234567890123456789012345678901234567890
DEFENDER_SAFE_ADDRESS=0x0987654321098765432109876543210987654321
```

### 3. Deploy with Defender

```bash
# Run the complete example
cd examples/defender-deployment
npm install
npm run deploy:sepolia
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Test specific environment
TEST_NETWORK=sepolia npm test
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **Defender Integration**: End-to-end Defender testing
- **Network Fork Tests**: Real network state testing
- **Performance Tests**: Deployment speed and resource usage
- **Error Handling Tests**: Failure scenario testing

## 📖 Documentation

### Core Documentation

- [Defender Integration Guide](docs/defender-integration.md) - Complete setup and usage guide
- [Testing Guide](docs/testing-guide.md) - Comprehensive testing documentation

### Examples

- [Defender Deployment Example](examples/defender-deployment/) - Complete working example
- [Local Deployment Example](examples/local-deployment/) - Local development setup

### API Reference

- [Core Classes](src/core/) - Diamond, DiamondDeployer, DeploymentManager
- [Strategies](src/strategies/) - Deployment strategy implementations
- [Repositories](src/repositories/) - Data persistence implementations
- [Utilities](src/utils/) - Helper functions and utilities

## 🔧 Configuration

### Diamond Configuration

```json
{
  "protocolVersion": 1.0,
  "protocolInitFacet": "MyProtocolFacet",
  "facets": {
    "DiamondCutFacet": {
      "priority": 10,
      "versions": { "1.0": {} }
    },
    "DiamondLoupeFacet": {
      "priority": 20,
      "versions": { "1.0": {} }
    },
    "MyFacet": {
      "priority": 30,
      "versions": {
        "1.0": {
          "deployInit": "initialize()",
          "upgradeInit": "upgradeToV1()",
          "callbacks": ["postDeployCallback"]
        }
      }
    }
  }
}
```

### Deployment Strategies

```typescript
// Local deployment
const localStrategy = new LocalDeploymentStrategy(true);

// Defender deployment with auto-approval
const defenderStrategy = new OZDefenderDeploymentStrategy(
  apiKey,
  apiSecret,
  relayerAddress,
  true, // auto-approve
  safeAddress,
  'Safe'
);

// Defender deployment with manual approval
const manualDefenderStrategy = new OZDefenderDeploymentStrategy(
  apiKey,
  apiSecret,
  relayerAddress,
  false, // manual approval required
  safeAddress,
  'Safe'
);
```

## 🚀 Deployment Workflows

### Initial Deployment

1. Deploy DiamondCutFacet through Defender
2. Deploy main Diamond contract
3. Deploy all configured facets
4. Create Defender proposal for diamond cut
5. Execute proposal (auto or manual approval)
6. Run post-deployment callbacks

### Upgrade Process

1. Update diamond configuration with new versions
2. Deploy only modified/new facets
3. Create diamond cut proposal with changes
4. Execute upgrade proposal
5. Run upgrade callbacks and validation

### Monitoring and Management

- Real-time status tracking through Defender dashboard
- Automated transaction monitoring
- Gas optimization recommendations
- Error logging and alerting

## 🔒 Security Features

### Access Control

- Multi-signature support for critical operations
- Role-based deployment permissions
- API key security and rotation
- Network-specific configurations

### Best Practices

- Comprehensive input validation
- State corruption protection
- Transaction replay protection
- Gas optimization and limits

### Audit Trail

- Complete deployment history
- Transaction logging and monitoring
- Error tracking and recovery
- Verification and compliance reporting

## 🤝 Contributing

### Development Setup

```bash
# Clone and setup
git clone https://github.com/geniusventures/diamonds.git
cd diamonds
npm install

# Run tests
npm test

# Build project
npm run build

# Lint code
npm run lint
```

### Contribution Guidelines

1. Follow TypeScript best practices
2. Maintain 90%+ test coverage
3. Update documentation for new features
4. Follow conventional commit messages
5. Add comprehensive tests for new functionality

## 📋 Roadmap

### Current Version (1.0)

- ✅ Core Diamond implementation
- ✅ OpenZeppelin Defender integration
- ✅ Comprehensive testing suite
- ✅ Documentation and examples

### Upcoming Features (1.1)

- 🔄 Defender Autotasks integration
- 🔄 Defender Sentinel monitoring
- 🔄 Multi-network deployment support
- 🔄 Advanced upgrade patterns

### Future Enhancements (2.0)

- 📅 Database repository implementation
- 📅 GraphQL API for deployment data
- 📅 Web dashboard for deployment management
- 📅 Advanced analytics and reporting

## 🐛 Troubleshooting

### Common Issues

1. **API Authentication Errors**
   - Verify Defender API credentials
   - Check API key permissions
   - Ensure network connectivity

2. **Deployment Failures**
   - Check gas prices and limits
   - Verify contract compilation
   - Review Defender dashboard logs

3. **Network Issues**
   - Validate RPC endpoints
   - Check network connectivity
   - Verify chain ID configuration

### Getting Help

- Check [Documentation](docs/)
- Review [Examples](examples/)
- Open [GitHub Issue](https://github.com/genius/diamonds/issues)
- Join [Telegram Community](https://t.me/geniustokens)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for Defender platform
- [ERC-2535 Standard](https://eips.ethereum.org/EIPS/eip-2535) authors
- [Hardhat](https://hardhat.org/) development framework
- Diamond standard community and contributors

---

Built with ❤️ for the Ethereum ecosystem
