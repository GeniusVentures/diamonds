# OpenZeppelin Defender Monitoring and Troubleshooting Guide

This guide provides comprehensive instructions for monitoring Diamond deployments and troubleshooting common issues when using OpenZeppelin Defender integration.

## Table of Contents

1. [Monitoring Diamond Deployments](#monitoring-diamond-deployments)
2. [Common Issues and Solutions](#common-issues-and-solutions)
3. [Performance Optimization](#performance-optimization)
4. [Debugging Techniques](#debugging-techniques)
5. [Emergency Procedures](#emergency-procedures)
6. [Best Practices](#best-practices)

## Monitoring Diamond Deployments

### 1. Defender Dashboard Monitoring

#### Setting Up Monitoring

```bash
# Check deployment status
npm run defender:status

# Monitor specific diamond
npx defender-cli status --diamond MyDiamond --verbose
```

#### Key Metrics to Monitor

- **Proposal Status**: Track proposal creation, approval, and execution
- **Gas Usage**: Monitor gas consumption for diamond cuts
- **Transaction Confirmations**: Ensure transactions are properly confirmed
- **Contract Verification**: Verify all contracts are verified on Etherscan

### 2. Real-time Monitoring Scripts

Create monitoring scripts for continuous deployment tracking:

```typescript
// scripts/monitor-deployment.ts
import { Diamond } from '../src/core/Diamond';
import { FileDeploymentRepository } from '../src/repositories/FileDeploymentRepository';
import { diffDeployedFacets } from '../src/utils/diffDeployedFacets';
import { ethers } from 'hardhat';

async function monitorDiamond(diamondName: string) {
  const config = {
    diamondName,
    networkName: process.env.NETWORK_NAME!,
    chainId: parseInt(process.env.CHAIN_ID!),
    deploymentsPath: 'diamonds',
    contractsPath: 'contracts',
    writeDeployedDiamondData: true
  };

  const repository = new FileDeploymentRepository(config);
  const diamond = new Diamond(config, repository);
  const deployedData = diamond.getDeployedDiamondData();

  if (!deployedData.DiamondAddress) {
    console.log('❌ Diamond not deployed');
    return;
  }

  // Check on-chain state vs local deployment data
  const provider = ethers.provider;
  const isConsistent = await diffDeployedFacets(deployedData, provider, true);

  if (isConsistent) {
    console.log('✅ Diamond state is consistent');
  } else {
    console.log('⚠️ Diamond state inconsistency detected');
  }
}

// Run monitoring
monitorDiamond(process.argv[2] || 'MyDiamond');
```

### 3. Automated Health Checks

```typescript
// scripts/health-check.ts
import { AdminClient } from '@openzeppelin/defender-sdk';

async function performHealthCheck() {
  const client = new AdminClient({
    apiKey: process.env.DEFENDER_API_KEY!,
    apiSecret: process.env.DEFENDER_API_SECRET!
  });

  try {
    // Check API connectivity
    const proposals = await client.listProposals();
    console.log(`✅ API Connection: ${proposals.length} proposals found`);

    // Check recent proposals
    const recentProposals = proposals.filter(p => 
      Date.now() - new Date(p.createdAt).getTime() < 24 * 60 * 60 * 1000
    );
    
    console.log(`📊 Recent Proposals (24h): ${recentProposals.length}`);

    // Check failed proposals
    const failedProposals = proposals.filter(p => p.status === 'failed');
    if (failedProposals.length > 0) {
      console.log(`⚠️ Failed Proposals: ${failedProposals.length}`);
      failedProposals.forEach(p => {
        console.log(`   - ${p.title}: ${p.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }
}

performHealthCheck();
```

## Common Issues and Solutions

### 1. Proposal Creation Failures

#### Issue: "Insufficient permissions" Error

```bash
Error: Insufficient permissions to create proposal
```

**Solution:**

1. Verify API key permissions in Defender dashboard
2. Ensure relayer has sufficient ETH balance
3. Check that the Safe/multisig has proper signers

```bash
# Check relayer balance
npx hardhat run scripts/check-relayer-balance.ts

# Verify API permissions
curl -H "Authorization: Bearer $DEFENDER_API_KEY" \
     https://defender-api.openzeppelin.com/admin/proposals
```

#### Issue: "Contract not found" Error

```bash
Error: Contract not found at address 0x...
```

**Solution:**

1. Verify contract address in deployment files
2. Ensure contract is deployed on correct network
3. Check if contract is verified on Etherscan

```typescript
// Verify contract exists
const code = await ethers.provider.getCode(contractAddress);
if (code === '0x') {
  console.error('Contract not deployed at address');
}
```

### 2. Diamond Cut Execution Issues

#### Issue: Diamond Cut Fails with "Selector Collision"

```bash
Error: Function selector collision detected
```

**Solution:**

1. Check for duplicate function selectors across facets
2. Use `deployExclude` to remove conflicting selectors
3. Verify function selector registry

```typescript
// Debug selector collisions
import { getSighash } from '../src/utils/common';

function checkSelectorCollisions(facets: any[]) {
  const selectors = new Map();
  
  for (const facet of facets) {
    for (const selector of facet.funcSelectors) {
      if (selectors.has(selector)) {
        console.error(`Collision: ${selector} in ${facet.name} and ${selectors.get(selector)}`);
      } else {
        selectors.set(selector, facet.name);
      }
    }
  }
}
```

#### Issue: "Orphaned Selectors" Error

```bash
Error: Orphaned selectors found for facet TestFacet
```

**Solution:**

1. Ensure all function selectors are properly mapped
2. Remove old facet addresses from registry
3. Use the validation utility to check state

```typescript
// Check for orphaned selectors
await strategy.validateNoOrphanedSelectors(facetCuts);
```

### 3. Network and Connectivity Issues

#### Issue: "Network timeout" Error

```bash
Error: Network timeout - operation took too long
```

**Solution:**

1. Increase timeout values in strategy configuration
2. Check network congestion and gas prices
3. Use retry mechanisms

```typescript
// Configure timeouts
const strategy = new OZDefenderDeploymentStrategy(
  apiKey,
  apiSecret,
  relayerAddress,
  autoApprove,
  via,
  viaType,
  verbose,
  {
    timeout: 300000, // 5 minutes
    retries: 3,
    retryDelay: 5000 // 5 seconds
  }
);
```

#### Issue: Rate Limiting

```bash
Error: Rate limit exceeded (429)
```

**Solution:**

1. Implement exponential backoff
2. Reduce concurrent operations
3. Contact OpenZeppelin for rate limit increases

```typescript
// Implement rate limiting handling
async function withRetry(operation: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### 4. Gas and Transaction Issues

#### Issue: "Gas estimation failed"

```bash
Error: Gas estimation failed for diamond cut
```

**Solution:**

1. Check if all facets are properly deployed
2. Verify initialization parameters
3. Test with hardhat fork before mainnet

```typescript
// Debug gas estimation
try {
  const gasEstimate = await contract.estimateGas.diamondCut(
    facetCuts,
    initAddress,
    initCalldata
  );
  console.log(`Estimated gas: ${gasEstimate.toString()}`);
} catch (error) {
  console.error('Gas estimation failed:', error);
}
```

## Performance Optimization

### 1. Batch Operations

Optimize large deployments by batching operations:

```typescript
// Batch facet deployments
async function batchDeployFacets(facets: string[], batchSize = 5) {
  const batches = [];
  for (let i = 0; i < facets.length; i += batchSize) {
    batches.push(facets.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const deploymentPromises = batch.map(facet => deployFacet(facet));
    await Promise.all(deploymentPromises);
    
    // Wait between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### 2. Parallel Proposal Creation

```typescript
// Create proposals in parallel with rate limiting
async function createProposalsInParallel(proposals: any[], concurrency = 3) {
  const semaphore = new Semaphore(concurrency);
  
  return Promise.all(proposals.map(async (proposal) => {
    await semaphore.acquire();
    try {
      return await adminClient.createProposal(proposal);
    } finally {
      semaphore.release();
    }
  }));
}
```

### 3. Caching and State Management

```typescript
// Cache deployment state
class DeploymentCache {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async get(key: string) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.ttl) {
      return entry.value;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, value: any) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}
```

## Debugging Techniques

### 1. Enable Detailed Logging

```typescript
// Enable verbose logging
process.env.DEBUG = 'diamonds:*';

// Custom debug logging
import debug from 'debug';
const log = debug('diamonds:deployment');

log('Starting deployment process');
log('Configuration: %O', config);
```

### 2. Transaction Tracing

```typescript
// Trace transaction execution
async function traceTransaction(txHash: string) {
  const trace = await ethers.provider.send('debug_traceTransaction', [
    txHash,
    { tracer: 'callTracer' }
  ]);
  
  console.log('Transaction trace:', JSON.stringify(trace, null, 2));
}
```

### 3. State Inspection

```typescript
// Inspect diamond state
async function inspectDiamondState(diamondAddress: string) {
  const loupeContract = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress);
  
  const facets = await loupeContract.facets();
  console.log('Current facets:', facets);
  
  const interfaces = await loupeContract.supportsInterface('0x48e2b093'); // ERC165
  console.log('Supports ERC165:', interfaces);
}
```

## Emergency Procedures

### 1. Emergency Stop

If a deployment goes wrong, you can implement emergency stops:

```typescript
// Emergency stop script
async function emergencyStop(diamondAddress: string) {
  const ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress);
  
  // Transfer ownership to emergency multisig
  const emergencyMultisig = process.env.EMERGENCY_MULTISIG_ADDRESS;
  await ownershipFacet.transferOwnership(emergencyMultisig);
  
  console.log(`Ownership transferred to emergency multisig: ${emergencyMultisig}`);
}
```

### 2. Rollback Procedures

```typescript
// Rollback to previous state
async function rollbackDeployment(diamondName: string, targetVersion: number) {
  const backupPath = `./backups/${diamondName}-v${targetVersion}.json`;
  const backupData = await fs.readJson(backupPath);
  
  // Restore previous deployment state
  const repository = new FileDeploymentRepository(config);
  await repository.saveDeployedDiamondData(backupData);
  
  console.log(`Rolled back to version ${targetVersion}`);
}
```

### 3. Recovery Scripts

```typescript
// Recover from partial deployment
async function recoverPartialDeployment(diamondName: string) {
  const diamond = await createDiamond(config);
  const deployedData = diamond.getDeployedDiamondData();
  
  // Check which facets are missing
  const expectedFacets = Object.keys(diamond.getDeployConfig().facets);
  const deployedFacets = Object.keys(deployedData.DeployedFacets || {});
  const missingFacets = expectedFacets.filter(f => !deployedFacets.includes(f));
  
  if (missingFacets.length > 0) {
    console.log('Missing facets:', missingFacets);
    // Deploy missing facets
    for (const facet of missingFacets) {
      await deployFacet(facet);
    }
  }
}
```

## Best Practices

### 1. Pre-deployment Checks

Always run comprehensive checks before deployment:

```bash
# Pre-deployment checklist
npm run compile                    # Ensure contracts compile
npm run test                      # Run all tests
npm run lint                      # Check code quality
npx defender-cli status           # Check current state
npm run test:integration          # Run integration tests
```

### 2. Monitoring Setup

Set up continuous monitoring:

```typescript
// Continuous monitoring
setInterval(async () => {
  try {
    await performHealthCheck();
    await monitorDiamond('MyDiamond');
  } catch (error) {
    console.error('Monitoring error:', error);
    // Send alert to monitoring system
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

### 3. Backup Strategies

Implement regular backups:

```typescript
// Automated backup
async function createBackup(diamondName: string) {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = `./backups/${diamondName}-${timestamp}.json`;
  
  const diamond = await createDiamond(config);
  const deployedData = diamond.getDeployedDiamondData();
  
  await fs.writeJson(backupPath, deployedData, { spaces: 2 });
  console.log(`Backup created: ${backupPath}`);
}
```

### 4. Documentation and Change Management

- Document all configuration changes
- Use version control for all diamond configurations
- Maintain change logs for each deployment
- Create runbooks for common operations

### 5. Testing in Production-like Environments

Always test in environments that closely mirror production:

```bash
# Test on mainnet fork
npm run hardhat:fork:mainnet
npm run test:integration

# Test with realistic gas prices
export GAS_PRICE=30000000000  # 30 gwei
npm run defender:deploy
```

## Conclusion

Proper monitoring and troubleshooting procedures are essential for successful Diamond deployments with OpenZeppelin Defender. This guide provides the foundation for maintaining robust, reliable diamond proxy deployments in production environments.

For additional support:

- OpenZeppelin Defender Documentation: <https://docs.openzeppelin.com/defender/>
- Diamond Standard (ERC-2535): <https://eips.ethereum.org/EIPS/eip-2535>
- Community Support: <https://forum.openzeppelin.com/>
