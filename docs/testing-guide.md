# Testing Guide for Diamonds Module

## Overview

This guide covers comprehensive testing strategies for the Diamonds module, including unit tests, integration tests, and end-to-end testing with OpenZeppelin Defender integration.

## Testing Architecture

### Test Structure

```bash
test/
├── unit/                           # Unit tests for individual components
│   ├── core/                       # Core module tests
│   │   ├── Diamond.test.ts
│   │   ├── DiamondDeployer.test.ts
│   │   └── DeploymentManager.test.ts
│   ├── strategies/                 # Strategy pattern tests
│   │   ├── BaseDeploymentStrategy.test.ts
│   │   ├── LocalDeploymentStrategy.test.ts
│   │   └── OZDefenderDeploymentStrategy.test.ts
│   ├── repositories/               # Repository pattern tests
│   │   └── FileDeploymentRepository.test.ts
│   └── utils/                      # Utility function tests
│       ├── common.test.ts
│       └── loupe.test.ts
├── integration/                    # Integration tests
│   ├── defender/                   # Defender integration tests
│   │   ├── setup/                  # Test setup utilities
│   │   │   ├── defender-setup.ts
│   │   │   ├── hardhat-fork.ts
│   │   │   └── mock-contracts.ts
│   │   ├── deployment.test.ts      # End-to-end deployment tests
│   │   ├── upgrade.test.ts         # Upgrade scenario tests
│   │   ├── multi-facet.test.ts     # Complex diamond tests
│   │   └── error-handling.test.ts  # Error scenario tests
│   ├── local/                      # Local deployment integration
│   │   └── localDeployment.test.ts
│   └── fixtures/                   # Test fixtures and data
│       ├── diamond-configs/
│       └── mock-facets/
├── helpers/                        # Test helper utilities
│   ├── defenderMock.ts
│   └── contractHelpers.ts
└── setup.ts                       # Global test setup
```

### Test Categories

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and workflows
3. **End-to-End Tests**: Test complete deployment scenarios
4. **Performance Tests**: Test deployment speed and resource usage
5. **Security Tests**: Test access controls and error handling

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your test configuration
```

### Basic Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific test file
npx mocha test/unit/core/Diamond.test.ts

# Run tests with verbose output
npm test -- --reporter spec

# Run tests with timeout adjustment
npm test -- --timeout 300000
```

### Environment-Specific Testing

```bash
# Test against local hardhat network
TEST_NETWORK=hardhat npm test

# Test against Sepolia testnet (requires RPC URL)
TEST_NETWORK=sepolia npm test

# Test with Defender mocking enabled
ENABLE_DEFENDER_MOCKING=true npm test

# Test with real Defender API (requires credentials)
ENABLE_DEFENDER_MOCKING=false npm test
```

## Unit Testing

### Testing Core Components

```typescript
// Example: Diamond.test.ts
describe('Diamond', () => {
  let diamond: Diamond;
  let config: DiamondConfig;
  let repository: FileDeploymentRepository;

  beforeEach(() => {
    config = {
      diamondName: 'TestDiamond',
      networkName: 'hardhat',
      chainId: 31337,
      // ... other config
    };
    
    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(diamond.diamondName).to.equal('TestDiamond');
      expect(diamond.getDiamondConfig().networkName).to.equal('hardhat');
    });
  });

  describe('state management', () => {
    it('should update deployed diamond data correctly', () => {
      const testData = {
        DiamondAddress: '0x123...',
        DeployerAddress: '0x456...',
        DeployedFacets: {}
      };
      
      diamond.updateDeployedDiamondData(testData);
      const retrieved = diamond.getDeployedDiamondData();
      
      expect(retrieved.DiamondAddress).to.equal(testData.DiamondAddress);
    });
  });
});
```

### Testing Strategy Pattern

```typescript
// Example: OZDefenderDeploymentStrategy.test.ts
describe('OZDefenderDeploymentStrategy', () => {
  let strategy: OZDefenderDeploymentStrategy;
  let mocks: MockDefenderClients;

  beforeEach(() => {
    mocks = createDefenderMocks();
    
    // Mock the defender clients module
    sinon.stub(defenderClientsModule, 'deployClient').value(mocks.mockDeployClient);
    sinon.stub(defenderClientsModule, 'adminClient').value(mocks.mockDefender);
    
    strategy = new OZDefenderDeploymentStrategy(
      'test-api-key',
      'test-api-secret',
      '0x123...',
      true, // auto-approve
      '0x456...',
      'Safe'
    );
  });

  describe('deployment tasks', () => {
    it('should submit deployments to Defender correctly', async () => {
      setupSuccessfulDeploymentMocks(mocks);
      
      await strategy.deployDiamondTasks(diamond);
      
      expect(mocks.mockDeployClient.deployContract.callCount).to.equal(2); // DiamondCutFacet + Diamond
    });
  });
});
```

### Testing Repository Pattern

```typescript
// Example: FileDeploymentRepository.test.ts
describe('FileDeploymentRepository', () => {
  let repository: FileDeploymentRepository;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(__dirname, '.tmp-test');
    await fs.ensureDir(tempDir);
    
    const config = {
      diamondName: 'TestDiamond',
      deploymentsPath: tempDir,
      // ... other config
    };
    
    repository = new FileDeploymentRepository(config);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('configuration management', () => {
    it('should save and load deploy config correctly', async () => {
      const testConfig = {
        protocolVersion: 1.0,
        facets: {
          TestFacet: {
            priority: 100,
            versions: { "1.0": {} }
          }
        }
      };
      
      await repository.saveDeployConfig(testConfig);
      const loaded = repository.loadDeployConfig();
      
      expect(loaded.protocolVersion).to.equal(1.0);
      expect(loaded.facets.TestFacet.priority).to.equal(100);
    });
  });
});
```

## Integration Testing

### Defender Integration Tests

```typescript
// Example: deployment.test.ts
describe('Integration: Defender Deployment', () => {
  let diamond: Diamond;
  let strategy: OZDefenderDeploymentStrategy;
  let deployer: DiamondDeployer;
  let mocks: MockDefenderClients;

  beforeEach(async () => {
    // Setup test environment
    mocks = createDefenderMocks();
    setupSuccessfulDeploymentMocks(mocks);
    
    // Create diamond and strategy
    diamond = new Diamond(config, repository);
    diamond.setProvider(ethers.provider);
    diamond.setSigner(await ethers.getSigners()[0]);
    
    strategy = new OZDefenderDeploymentStrategy(/* config */);
    deployer = new DiamondDeployer(diamond, strategy);
  });

  describe('complete deployment flow', () => {
    it('should deploy diamond with all facets', async function () {
      this.timeout(60000); // Extended timeout for integration tests
      
      await deployer.deployDiamond();
      
      // Verify deployment sequence
      expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(4);
      expect(mocks.mockProposalClient.create.called).to.be.true;
      
      // Verify state persistence
      const deployedData = diamond.getDeployedDiamondData();
      expect(deployedData.DiamondAddress).to.not.be.undefined;
    });
  });

  describe('upgrade scenarios', () => {
    it('should handle facet upgrades correctly', async () => {
      // Setup existing deployment
      const existingData = {
        DiamondAddress: '0x123...',
        DeployedFacets: {
          TestFacet: { version: 0, address: '0x456...' }
        }
      };
      diamond.updateDeployedDiamondData(existingData);
      
      // Update configuration for upgrade
      const config = repository.loadDeployConfig();
      config.protocolVersion = 1.0;
      config.facets.TestFacet.versions["1.0"] = {
        upgradeInit: "upgradeToV1()"
      };
      await repository.saveDeployConfig(config);
      
      // Execute upgrade
      await deployer.deployDiamond();
      
      // Should only deploy new version
      expect(mocks.mockDeployClient.deployContract.callCount).to.equal(1);
    });
  });
});
```

### Network Fork Testing

```typescript
// Example: hardhat-fork.ts
export async function setupForkTest(network: string, blockNumber?: number) {
  const forkConfig = {
    url: getNetworkUrl(network),
    blockNumber
  };
  
  await network.provider.request({
    method: "hardhat_reset",
    params: [{
      forking: forkConfig
    }]
  });
  
  // Setup test accounts with realistic balances
  const signers = await ethers.getSigners();
  for (const signer of signers.slice(0, 3)) {
    await network.provider.send("hardhat_setBalance", [
      signer.address,
      "0x1000000000000000000000" // 1000 ETH
    ]);
  }
  
  return signers;
}

// Usage in tests
describe('Fork Integration Tests', () => {
  beforeEach(async () => {
    if (process.env.TEST_NETWORK !== 'hardhat') {
      await setupForkTest(process.env.TEST_NETWORK);
    }
  });
  
  it('should deploy on forked network', async () => {
    // Test with real network state
  });
});
```

## Mock Testing

### Defender API Mocking

```typescript
// Example: defenderMock.ts
export function createRealisticDefenderMocks() {
  const mocks = createDefenderMocks();
  
  // Add realistic delays
  addNetworkDelay(mocks, 100);
  
  // Add occasional failures for robustness testing
  let callCount = 0;
  const originalDeploy = mocks.mockDeployClient.deployContract;
  
  mocks.mockDeployClient.deployContract.callsFake(async (...args) => {
    callCount++;
    
    // Simulate 5% failure rate
    if (callCount % 20 === 0) {
      throw new Error('Simulated network error');
    }
    
    return originalDeploy.apply(mocks.mockDeployClient, args);
  });
  
  return mocks;
}
```

### Contract Mocking

```typescript
// Example: mock-contracts.ts
export function createMockFacetContracts() {
  const mockContracts = {
    DiamondCutFacet: {
      interface: new ethers.utils.Interface([
        'function diamondCut((address,uint8,bytes4[])[],address,bytes)'
      ]),
      address: '0x1234567890123456789012345678901234567890'
    },
    
    DiamondLoupeFacet: {
      interface: new ethers.utils.Interface([
        'function facets() external view returns ((address,bytes4[])[])'
      ]),
      address: '0x2345678901234567890123456789012345678901'
    },
    
    TestFacet: {
      interface: new ethers.utils.Interface([
        'function setValue(uint256)',
        'function getValue() view returns (uint256)'
      ]),
      address: '0x3456789012345678901234567890123456789012'
    }
  };
  
  return mockContracts;
}
```

## Performance Testing

### Deployment Speed Tests

```typescript
describe('Performance Tests', () => {
  it('should complete deployment within reasonable time', async function () {
    this.timeout(120000); // 2 minutes max
    
    const startTime = Date.now();
    await deployer.deployDiamond();
    const endTime = Date.now();
    
    const deploymentTime = endTime - startTime;
    expect(deploymentTime).to.be.lessThan(60000); // Should complete in under 1 minute
    
    console.log(`Deployment completed in ${deploymentTime}ms`);
  });
  
  it('should handle concurrent deployments efficiently', async function () {
    this.timeout(300000); // 5 minutes for concurrent tests
    
    const deployments = Array(3).fill(null).map(() => 
      createIndependentDeployer().deployDiamond()
    );
    
    const results = await Promise.allSettled(deployments);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    expect(successCount).to.equal(3);
  });
});
```

### Memory Usage Tests

```typescript
describe('Memory Usage Tests', () => {
  it('should not leak memory during large deployments', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Deploy large diamond with many facets
    await deployLargeDiamond();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable
    expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024); // 50MB max
  });
});
```

## Error Testing

### Network Error Simulation

```typescript
describe('Error Handling Tests', () => {
  it('should retry on network errors', async () => {
    let attempts = 0;
    
    mocks.mockDeployClient.deployContract.callsFake(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network timeout');
      }
      return Promise.resolve({ deploymentId: 'success', status: 'pending' });
    });
    
    await deployer.deployDiamond();
    
    expect(attempts).to.equal(3);
  });
  
  it('should fail gracefully on persistent errors', async () => {
    mocks.mockDeployClient.deployContract.rejects(new Error('Persistent failure'));
    
    try {
      await deployer.deployDiamond();
      expect.fail('Expected deployment to fail');
    } catch (error) {
      expect(error.message).to.include('Persistent failure');
    }
  });
});
```

### State Corruption Testing

```typescript
describe('State Corruption Tests', () => {
  it('should recover from corrupted deployment data', async () => {
    // Simulate corrupted state
    const corruptedData = {
      DiamondAddress: 'invalid-address',
      DeployedFacets: null
    };
    
    diamond.updateDeployedDiamondData(corruptedData);
    
    // Should detect and recover
    await deployer.deployDiamond();
    
    const finalData = diamond.getDeployedDiamondData();
    expect(finalData.DiamondAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
```

## Test Configuration

### Environment Variables

```bash
# .env.test
TEST_NETWORK=hardhat
ENABLE_DEFENDER_MOCKING=true
TEST_TIMEOUT=300000
VERBOSE_TESTING=true
LOG_LEVEL=debug

# For real API testing
DEFENDER_API_KEY=test_api_key
DEFENDER_API_SECRET=test_api_secret
TEST_SAFE_ADDRESS=0x123...
```

### Custom Test Configuration

```typescript
// test/setup.ts
import { config } from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

// Load test environment
config({ path: '.env.test' });

// Setup chai
chai.use(chaiAsPromised);

// Global test timeout
const timeout = parseInt(process.env.TEST_TIMEOUT || '60000');
beforeEach(function() {
  this.timeout(timeout);
});

// Setup global test utilities
global.testUtils = {
  createTempDir: () => {
    return path.join(__dirname, '.tmp', `test-${Date.now()}`);
  },
  
  cleanupTempDirs: async () => {
    const tempBase = path.join(__dirname, '.tmp');
    if (await fs.pathExists(tempBase)) {
      await fs.remove(tempBase);
    }
  }
};
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
        test-type: [unit, integration]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
        env:
          ENABLE_DEFENDER_MOCKING: true
          TEST_NETWORK: hardhat
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.test-type == 'unit'
```

## Best Practices

### Test Organization

1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Test Isolation**: Each test should be independent
3. **Setup/Teardown**: Proper cleanup after each test
4. **Mock Management**: Restore mocks after each test

### Performance Considerations

1. **Timeout Management**: Set appropriate timeouts for different test types
2. **Resource Cleanup**: Clean up temporary files and directories
3. **Memory Management**: Monitor memory usage in long-running tests
4. **Parallel Execution**: Use parallel test execution where safe

### Security Testing

1. **Access Control**: Test role-based permissions
2. **Input Validation**: Test with malformed inputs
3. **State Manipulation**: Test with corrupted state
4. **Network Security**: Test with simulated attacks

## Troubleshooting Tests

### Common Issues

1. **Timeout Errors**

   ```bash
   # Increase timeout for specific tests
   npx mocha test/integration/deployment.test.ts --timeout 300000
   ```

2. **Network Connectivity**

   ```bash
   # Test with local network only
   TEST_NETWORK=hardhat npm test
   ```

3. **Resource Conflicts**

   ```bash
   # Run tests sequentially
   npm test -- --parallel=false
   ```

4. **Mock State Issues**

   ```bash
   # Reset all mocks
   beforeEach(() => {
     sinon.restore();
     sinon.resetHistory();
   });
   ```

### Debugging Failed Tests

1. **Enable Verbose Logging**

   ```typescript
   process.env.DEBUG = 'diamonds:*';
   process.env.VERBOSE_TESTING = 'true';
   ```

2. **Inspect Test State**

   ```typescript
   // Add debugging output
   console.log('Diamond state:', diamond.getDeployedDiamondData());
   console.log('Mock calls:', mocks.mockDeployClient.deployContract.getCalls());
   ```

3. **Use Test-Specific Timeouts**

   ```typescript
   it('slow test', async function() {
     this.timeout(120000); // 2 minutes for this specific test
     // ... test code
   });
   ```

This comprehensive testing guide ensures robust validation of the Diamonds module functionality across all scenarios and environments.
