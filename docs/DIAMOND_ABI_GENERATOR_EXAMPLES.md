# Diamond ABI Generator - Practical Examples & Patterns

## Overview

This document provides practical examples and common patterns for implementing the Diamond ABI Generator in real-world projects. It complements the main implementation guide with focused examples for specific use cases.

## Table of Contents

1. [Common Integration Patterns](#common-integration-patterns)
2. [Frontend Framework Integration](#frontend-framework-integration)
3. [Testing Patterns](#testing-patterns)
4. [CI/CD Integration](#cicd-integration)
5. [Performance Optimization](#performance-optimization)
6. [Custom Tooling](#custom-tooling)
7. [Migration Strategies](#migration-strategies)

## Common Integration Patterns

### Pattern 1: Basic Project Setup

```typescript
// scripts/setup-diamond-abi.ts
import { generateDiamondAbi, Diamond } from 'diamonds';
import { FileDeploymentRepository } from 'diamonds/repositories';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ProjectConfig {
  diamondName: string;
  networkName: string;
  chainId: number;
  outputDir: string;
}

export class DiamondAbiManager {
  private diamond: Diamond;
  private config: ProjectConfig;

  constructor(config: ProjectConfig) {
    this.config = config;
    
    const diamondConfig = {
      diamondName: config.diamondName,
      networkName: config.networkName,
      chainId: config.chainId,
      deploymentsPath: './diamonds',
      contractsPath: './contracts'
    };
    
    const repository = new FileDeploymentRepository(diamondConfig);
    this.diamond = new Diamond(diamondConfig, repository);
  }

  async generateAbi() {
    const result = await generateDiamondAbi(this.diamond, {
      outputDir: this.config.outputDir,
      includeSourceInfo: true,
      validateSelectors: true,
      verbose: true
    });

    return result;
  }

  async generateTypes() {
    const result = await this.generateAbi();
    
    // Generate additional type files
    await this.generateViemTypes(result);
    await this.generateReactTypes(result);
    
    return result;
  }

  private async generateViemTypes(result: any) {
    const viemTypes = `
// Auto-generated Viem types for ${this.config.diamondName}
import { Abi } from 'viem';

export const ${this.config.diamondName}ABI = ${JSON.stringify(result.abi, null, 2)} as const;
export type ${this.config.diamondName}ABI = typeof ${this.config.diamondName}ABI;

// Selector mapping
export const selectorMap = ${JSON.stringify(result.selectorMap, null, 2)} as const;
`;

    const outputPath = join(this.config.outputDir, 'viem-types.ts');
    writeFileSync(outputPath, viemTypes);
  }

  private async generateReactTypes(result: any) {
    const reactTypes = `
// Auto-generated React types for ${this.config.diamondName}
import { Contract } from 'ethers';

export interface ${this.config.diamondName}Contract extends Contract {
  // Add your specific function signatures here
  // These would be generated from the ABI
}

export const ${this.config.diamondName}ABI = ${JSON.stringify(result.abi, null, 2)};
`;

    const outputPath = join(this.config.outputDir, 'react-types.ts');
    writeFileSync(outputPath, reactTypes);
  }
}

// Usage
const manager = new DiamondAbiManager({
  diamondName: 'GameDiamond',
  networkName: 'localhost',
  chainId: 31337,
  outputDir: './src/contracts'
});

manager.generateTypes().then(() => {
  console.log('✅ Diamond ABI and types generated');
});
```

### Pattern 2: Multi-Network Support

```typescript
// scripts/multi-network-abi.ts
import { DiamondAbiManager } from './setup-diamond-abi';

const networks = [
  { name: 'localhost', chainId: 31337 },
  { name: 'sepolia', chainId: 11155111 },
  { name: 'mainnet', chainId: 1 }
];

const diamonds = ['GameDiamond', 'TradingDiamond', 'GovernanceDiamond'];

async function generateAllAbis() {
  for (const network of networks) {
    for (const diamondName of diamonds) {
      try {
        const manager = new DiamondAbiManager({
          diamondName,
          networkName: network.name,
          chainId: network.chainId,
          outputDir: `./src/contracts/${network.name}`
        });

        await manager.generateTypes();
        console.log(`✅ Generated ABI for ${diamondName} on ${network.name}`);
      } catch (error) {
        console.error(`❌ Failed to generate ABI for ${diamondName} on ${network.name}:`, error);
      }
    }
  }
}

generateAllAbis();
```

### Pattern 3: Watch Mode for Development

```typescript
// scripts/watch-diamond-abi.ts
import { watch } from 'fs';
import { DiamondAbiManager } from './setup-diamond-abi';
import { debounce } from 'lodash';

class DiamondAbiWatcher {
  private manager: DiamondAbiManager;
  private regenerateAbi: () => Promise<void>;

  constructor(manager: DiamondAbiManager) {
    this.manager = manager;
    this.regenerateAbi = debounce(async () => {
      try {
        console.log('🔄 Regenerating Diamond ABI...');
        await this.manager.generateTypes();
        console.log('✅ Diamond ABI regenerated');
      } catch (error) {
        console.error('❌ Failed to regenerate ABI:', error);
      }
    }, 1000);
  }

  start() {
    // Watch for contract changes
    watch('./contracts', { recursive: true }, (eventType, filename) => {
      if (filename?.endsWith('.sol')) {
        console.log(`📝 Contract changed: ${filename}`);
        this.regenerateAbi();
      }
    });

    // Watch for diamond deployment changes
    watch('./diamonds', { recursive: true }, (eventType, filename) => {
      if (filename?.endsWith('.json')) {
        console.log(`💎 Diamond deployment changed: ${filename}`);
        this.regenerateAbi();
      }
    });

    console.log('👀 Watching for changes...');
  }
}

// Usage
const manager = new DiamondAbiManager({
  diamondName: 'GameDiamond',
  networkName: 'localhost',
  chainId: 31337,
  outputDir: './src/contracts'
});

const watcher = new DiamondAbiWatcher(manager);
watcher.start();
```

## Frontend Framework Integration

### React + Ethers.js Integration

```typescript
// src/hooks/useDiamond.ts
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { GameDiamondABI } from '../contracts/GameDiamond';

export function useDiamond(address: string, provider: ethers.providers.Provider) {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupContract() {
      try {
        setLoading(true);
        const diamondContract = new ethers.Contract(
          address,
          GameDiamondABI.abi,
          provider
        );
        setContract(diamondContract);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup contract');
      } finally {
        setLoading(false);
      }
    }

    setupContract();
  }, [address, provider]);

  return { contract, loading, error };
}

// Usage component
export function GameComponent() {
  const { contract, loading, error } = useDiamond(
    '0x...',
    new ethers.providers.Web3Provider(window.ethereum)
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => contract?.someFunction()}>
        Call Function
      </button>
    </div>
  );
}
```

### Next.js Integration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle JSON imports for ABI files
    config.module.rules.push({
      test: /\.json$/,
      type: 'json'
    });
    
    return config;
  }
};

module.exports = nextConfig;

// pages/api/diamond-abi.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { generateDiamondAbi } from 'diamonds';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { diamondName, network } = req.query;
    
    // Generate ABI on-demand
    const result = await generateDiamondAbi(diamond, {
      verbose: false
    });

    res.status(200).json({
      abi: result.abi,
      selectorMap: result.selectorMap,
      stats: result.stats
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate ABI',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### Vue.js Integration

```typescript
// src/composables/useDiamond.ts
import { ref, computed } from 'vue';
import { ethers } from 'ethers';
import { GameDiamondABI } from '../contracts/GameDiamond';

export function useDiamond(address: string) {
  const contract = ref<ethers.Contract | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isReady = computed(() => contract.value !== null);

  async function connect(provider: ethers.providers.Provider) {
    loading.value = true;
    error.value = null;

    try {
      contract.value = new ethers.Contract(
        address,
        GameDiamondABI.abi,
        provider
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect';
    } finally {
      loading.value = false;
    }
  }

  async function callFunction(functionName: string, ...args: any[]) {
    if (!contract.value) {
      throw new Error('Contract not connected');
    }

    return await contract.value[functionName](...args);
  }

  return {
    contract: computed(() => contract.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isReady,
    connect,
    callFunction
  };
}
```

## Testing Patterns

### Unit Testing Pattern

```typescript
// test/diamond-abi.test.ts
import { expect } from 'chai';
import { generateDiamondAbi, Diamond } from 'diamonds';
import { FileDeploymentRepository } from 'diamonds/repositories';
import { ethers } from 'hardhat';

describe('Diamond ABI Generation', () => {
  let diamond: Diamond;
  let repository: FileDeploymentRepository;

  beforeEach(async () => {
    const config = {
      diamondName: 'TestDiamond',
      networkName: 'localhost',
      chainId: 31337,
      deploymentsPath: './test/fixtures/diamonds',
      contractsPath: './contracts'
    };

    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);
  });

  describe('Basic ABI Generation', () => {
    it('should generate valid ABI', async () => {
      const result = await generateDiamondAbi(diamond, {
        validateSelectors: true,
        verbose: false
      });

      expect(result.abi).to.be.an('array');
      expect(result.abi.length).to.be.greaterThan(0);
      expect(result.stats.totalFunctions).to.be.greaterThan(0);
      expect(result.stats.duplicateSelectorsSkipped).to.equal(0);
    });

    it('should include metadata', async () => {
      const result = await generateDiamondAbi(diamond, {
        includeSourceInfo: true,
        outputDir: './test/output'
      });

      const artifact = JSON.parse(
        require('fs').readFileSync(result.outputPath!, 'utf8')
      );

      expect(artifact._diamondMetadata).to.exist;
      expect(artifact._diamondMetadata.diamondName).to.equal('TestDiamond');
      expect(artifact._diamondMetadata.selectorMap).to.exist;
    });
  });

  describe('Contract Integration', () => {
    it('should work with ethers.js', async () => {
      const result = await generateDiamondAbi(diamond);
      
      // Mock deployment
      const [deployer] = await ethers.getSigners();
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      // Create contract instance
      const contract = new ethers.Contract(
        mockAddress,
        result.abi,
        deployer
      );

      expect(contract.interface).to.exist;
      expect(contract.interface.functions).to.exist;
    });
  });

  describe('Error Handling', () => {
    it('should handle missing facets gracefully', async () => {
      // Test with diamond that has missing facet artifacts
      const result = await generateDiamondAbi(diamond, {
        verbose: true
      });

      expect(result.abi).to.be.an('array');
      // Should still generate ABI with available facets
    });

    it('should detect selector collisions', async () => {
      // Add duplicate selectors to registry
      diamond.registerFunctionSelectors({
        '0x12345678': {
          facetName: 'TestFacet1',
          priority: 100,
          address: '0x1111111111111111111111111111111111111111',
          action: 1
        },
        '0x12345678': {
          facetName: 'TestFacet2',
          priority: 100,
          address: '0x2222222222222222222222222222222222222222',
          action: 1
        }
      });

      const result = await generateDiamondAbi(diamond, {
        validateSelectors: true,
        verbose: true
      });

      expect(result.stats.duplicateSelectorsSkipped).to.be.greaterThan(0);
    });
  });
});
```

### Integration Testing Pattern

```typescript
// test/integration/diamond-abi-workflow.test.ts
import { expect } from 'chai';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Diamond ABI Workflow Integration', () => {
  const testOutputDir = './test/tmp/diamond-abi';

  beforeEach(async () => {
    // Clean up previous test outputs
    if (existsSync(testOutputDir)) {
      await import('fs').then(fs => fs.rmSync(testOutputDir, { recursive: true }));
    }
  });

  it('should complete full CLI workflow', async () => {
    // Test CLI command
    const cliResult = await runCLI([
      'generate',
      '--diamond', 'TestDiamond',
      '--network', 'localhost',
      '--output', testOutputDir,
      '--verbose'
    ]);

    expect(cliResult.exitCode).to.equal(0);
    expect(cliResult.stdout).to.include('✅ Diamond ABI generation completed');

    // Verify output files
    const artifactPath = join(testOutputDir, 'TestDiamond.json');
    const typesPath = join(testOutputDir, 'TestDiamond.d.ts');

    expect(existsSync(artifactPath)).to.be.true;
    expect(existsSync(typesPath)).to.be.true;

    // Verify artifact content
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
    expect(artifact.contractName).to.equal('TestDiamond');
    expect(artifact.abi).to.be.an('array');
    expect(artifact._diamondMetadata).to.exist;
  });

  it('should handle TypeChain generation', async () => {
    // Generate ABI first
    await runCLI([
      'generate',
      '--diamond', 'TestDiamond',
      '--output', testOutputDir
    ]);

    // Generate TypeChain types
    const typechainResult = await runCLI([
      'npx', 'typechain',
      '--target', 'ethers-v5',
      '--out-dir', join(testOutputDir, 'typechain'),
      join(testOutputDir, '*.json')
    ]);

    expect(typechainResult.exitCode).to.equal(0);
    expect(existsSync(join(testOutputDir, 'typechain'))).to.be.true;
  });

  async function runCLI(args: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve) => {
      const process = spawn('npm', ['run', 'diamond-abi', ...args], {
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr
        });
      });
    });
  }
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/diamond-abi.yml
name: Diamond ABI Generation and Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  generate-abi:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        network: [localhost, sepolia, mainnet]
        diamond: [GameDiamond, TradingDiamond]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Compile contracts
        run: npm run compile
        
      - name: Generate Diamond ABI
        run: |
          npm run diamond-abi generate \
            --diamond ${{ matrix.diamond }} \
            --network ${{ matrix.network }} \
            --output ./artifacts/diamond-abi/${{ matrix.network }} \
            --include-source \
            --validate-selectors \
            --verbose
            
      - name: Generate TypeChain types
        run: |
          npx typechain \
            --target ethers-v5 \
            --out-dir ./typechain-types/${{ matrix.network }} \
            ./artifacts/diamond-abi/${{ matrix.network }}/*.json
            
      - name: Validate ABI
        run: |
          npm run diamond-abi validate \
            ./artifacts/diamond-abi/${{ matrix.network }}/${{ matrix.diamond }}.json
            
      - name: Upload ABI artifacts
        uses: actions/upload-artifact@v3
        with:
          name: diamond-abi-${{ matrix.network }}-${{ matrix.diamond }}
          path: |
            ./artifacts/diamond-abi/${{ matrix.network }}/
            ./typechain-types/${{ matrix.network }}/
            
  validate-integration:
    needs: generate-abi
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Download ABI artifacts
        uses: actions/download-artifact@v3
        with:
          path: ./artifacts/
          
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Test TypeScript compilation
        run: npx tsc --noEmit --project tsconfig.json
```

### GitLab CI/CD Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - compile
  - generate-abi
  - validate
  - deploy

variables:
  NODE_VERSION: "18"

compile-contracts:
  stage: compile
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run compile
  artifacts:
    paths:
      - artifacts/contracts/
      - cache/
    expire_in: 1 hour

generate-diamond-abi:
  stage: generate-abi
  image: node:$NODE_VERSION
  needs: [compile-contracts]
  parallel:
    matrix:
      - NETWORK: [localhost, sepolia, mainnet]
        DIAMOND: [GameDiamond, TradingDiamond]
  script:
    - npm ci
    - |
      npm run diamond-abi generate \
        --diamond $DIAMOND \
        --network $NETWORK \
        --output ./artifacts/diamond-abi/$NETWORK \
        --include-source \
        --validate-selectors \
        --verbose
    - |
      npx typechain \
        --target ethers-v5 \
        --out-dir ./typechain-types/$NETWORK \
        ./artifacts/diamond-abi/$NETWORK/*.json
  artifacts:
    paths:
      - artifacts/diamond-abi/
      - typechain-types/
    expire_in: 1 day

validate-abi:
  stage: validate
  image: node:$NODE_VERSION
  needs: [generate-diamond-abi]
  script:
    - npm ci
    - npm run test:integration
    - npx tsc --noEmit
  artifacts:
    reports:
      junit: test-results.xml
```

## Performance Optimization

### Caching Strategy

```typescript
// src/utils/diamond-abi-cache.ts
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export class DiamondAbiCache {
  private cacheDir: string;
  
  constructor(cacheDir: string = './cache/diamond-abi') {
    this.cacheDir = cacheDir;
  }

  getCacheKey(diamond: Diamond, options: any): string {
    const hashInput = JSON.stringify({
      diamondName: diamond.diamondName,
      networkName: diamond.networkName,
      chainId: diamond.chainId,
      deploymentHash: this.getDeploymentHash(diamond),
      options
    });
    
    return createHash('sha256').update(hashInput).digest('hex');
  }

  async get(cacheKey: string): Promise<any | null> {
    const cachePath = join(this.cacheDir, `${cacheKey}.json`);
    
    if (!existsSync(cachePath)) {
      return null;
    }

    try {
      const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
      
      // Check if cache is still valid (e.g., less than 1 hour old)
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (Date.now() - cached.timestamp > maxAge) {
        return null;
      }
      
      return cached.data;
    } catch (error) {
      return null;
    }
  }

  async set(cacheKey: string, data: any): Promise<void> {
    const cachePath = join(this.cacheDir, `${cacheKey}.json`);
    
    const cacheData = {
      timestamp: Date.now(),
      data
    };

    writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  }

  private getDeploymentHash(diamond: Diamond): string {
    const deploymentData = diamond.getDeployedDiamondData();
    return createHash('sha256')
      .update(JSON.stringify(deploymentData))
      .digest('hex');
  }
}

// Usage with caching
export async function generateDiamondAbiWithCache(
  diamond: Diamond,
  options: any = {}
): Promise<any> {
  const cache = new DiamondAbiCache();
  const cacheKey = cache.getCacheKey(diamond, options);
  
  // Try to get from cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('✅ Using cached Diamond ABI');
    return cached;
  }

  // Generate fresh ABI
  const result = await generateDiamondAbi(diamond, options);
  
  // Cache the result
  await cache.set(cacheKey, result);
  
  return result;
}
```

### Parallel Processing

```typescript
// src/utils/parallel-abi-generator.ts
import { generateDiamondAbi } from 'diamonds';
import { Worker } from 'worker_threads';
import { cpus } from 'os';

export class ParallelAbiGenerator {
  private maxWorkers: number;

  constructor(maxWorkers: number = cpus().length) {
    this.maxWorkers = maxWorkers;
  }

  async generateMultiple(configs: DiamondConfig[]): Promise<any[]> {
    const chunks = this.chunkArray(configs, this.maxWorkers);
    const promises = chunks.map(chunk => this.processChunk(chunk));
    const results = await Promise.all(promises);
    
    return results.flat();
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async processChunk(configs: DiamondConfig[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort } = require('worker_threads');
        const { generateDiamondAbi, Diamond } = require('diamonds');
        const { FileDeploymentRepository } = require('diamonds/repositories');

        parentPort.on('message', async (configs) => {
          const results = [];
          
          for (const config of configs) {
            try {
              const repository = new FileDeploymentRepository(config);
              const diamond = new Diamond(config, repository);
              const result = await generateDiamondAbi(diamond);
              results.push({ config, result, success: true });
            } catch (error) {
              results.push({ config, error: error.message, success: false });
            }
          }
          
          parentPort.postMessage(results);
        });
      `, { eval: true });

      worker.postMessage(configs);
      
      worker.on('message', (results) => {
        worker.terminate();
        resolve(results);
      });
      
      worker.on('error', (error) => {
        worker.terminate();
        reject(error);
      });
    });
  }
}
```

## Custom Tooling

### VS Code Extension Integration

```typescript
// src/vscode-extension/diamond-abi-provider.ts
import * as vscode from 'vscode';
import { generateDiamondAbi } from 'diamonds';

export class DiamondAbiProvider {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.registerCommands();
  }

  private registerCommands() {
    const generateCommand = vscode.commands.registerCommand(
      'diamond-abi.generate',
      async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('No workspace folder found');
          return;
        }

        const diamondName = await vscode.window.showInputBox({
          prompt: 'Enter diamond name',
          value: 'GameDiamond'
        });

        if (!diamondName) return;

        const networkName = await vscode.window.showQuickPick(
          ['localhost', 'sepolia', 'mainnet'],
          { placeHolder: 'Select network' }
        );

        if (!networkName) return;

        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating Diamond ABI...',
            cancellable: false
          }, async (progress) => {
            progress.report({ increment: 0 });
            
            // Generate ABI
            const result = await generateDiamondAbi(diamond, {
              outputDir: './artifacts/diamond-abi',
              verbose: true
            });

            progress.report({ increment: 100 });
            
            vscode.window.showInformationMessage(
              `✅ Generated ABI with ${result.stats.totalFunctions} functions`
            );
          });
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to generate ABI: ${error}`
          );
        }
      }
    );

    this.context.subscriptions.push(generateCommand);
  }
}
```

### Custom CLI Tool

```typescript
// scripts/advanced-diamond-cli.ts
#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateDiamondAbi } from 'diamonds';

const program = new Command();

program
  .name('diamond-tools')
  .description('Advanced Diamond ABI tools')
  .version('1.0.0');

program
  .command('interactive')
  .description('Interactive ABI generation wizard')
  .action(async () => {
    console.log(chalk.blue('🔮 Diamond ABI Generation Wizard'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'diamondName',
        message: 'Diamond name:',
        default: 'GameDiamond'
      },
      {
        type: 'list',
        name: 'network',
        message: 'Select network:',
        choices: [
          { name: 'Localhost (31337)', value: 'localhost' },
          { name: 'Sepolia (11155111)', value: 'sepolia' },
          { name: 'Mainnet (1)', value: 'mainnet' }
        ]
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: [
          { name: 'Include source information', value: 'includeSource' },
          { name: 'Validate selectors', value: 'validateSelectors' },
          { name: 'Generate TypeChain types', value: 'generateTypes' },
          { name: 'Generate Viem types', value: 'generateViem' },
          { name: 'Verbose output', value: 'verbose' }
        ]
      }
    ]);

    try {
      const options = {
        outputDir: './artifacts/diamond-abi',
        includeSourceInfo: answers.features.includes('includeSource'),
        validateSelectors: answers.features.includes('validateSelectors'),
        verbose: answers.features.includes('verbose')
      };

      const result = await generateDiamondAbi(diamond, options);
      
      console.log(chalk.green('\n✅ ABI generation completed!'));
      console.log(chalk.cyan(`Functions: ${result.stats.totalFunctions}`));
      console.log(chalk.cyan(`Events: ${result.stats.totalEvents}`));
      console.log(chalk.cyan(`Facets: ${result.stats.facetCount}`));

      if (answers.features.includes('generateTypes')) {
        console.log(chalk.blue('\n🔄 Generating TypeChain types...'));
        // Generate TypeChain types
        const { exec } = require('child_process');
        exec('npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json');
      }

      if (answers.features.includes('generateViem')) {
        console.log(chalk.blue('\n🔄 Generating Viem types...'));
        // Generate Viem types
        // Implementation here
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
    }
  });

program.parse();
```

## Migration Strategies

### From Hardhat to Diamond ABI

```typescript
// scripts/migrate-to-diamond-abi.ts
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

export class MigrationTool {
  async migrateFromHardhat() {
    console.log('🔄 Migrating from Hardhat artifacts to Diamond ABI...');
    
    // Find all existing contract artifacts
    const artifactPaths = glob.sync('./artifacts/contracts/**/*.json');
    
    for (const artifactPath of artifactPaths) {
      if (artifactPath.includes('.dbg.json')) continue;
      
      const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
      
      // Check if this is a diamond-related contract
      if (this.isDiamondContract(artifact)) {
        await this.convertArtifact(artifact, artifactPath);
      }
    }
    
    console.log('✅ Migration completed');
  }

  private isDiamondContract(artifact: any): boolean {
    // Check for diamond-specific patterns
    const diamondPatterns = [
      'Diamond',
      'Facet',
      'Loupe',
      'Cut'
    ];
    
    return diamondPatterns.some(pattern => 
      artifact.contractName.includes(pattern)
    );
  }

  private async convertArtifact(artifact: any, originalPath: string) {
    // Convert to diamond ABI format
    const diamondArtifact = {
      ...artifact,
      _diamondMetadata: {
        generatedAt: new Date().toISOString(),
        migratedFrom: originalPath,
        originalFormat: 'hardhat-artifact'
      }
    };

    // Write to new location
    const newPath = originalPath.replace('/artifacts/contracts/', '/artifacts/diamond-abi/');
    writeFileSync(newPath, JSON.stringify(diamondArtifact, null, 2));
    
    console.log(`✅ Converted ${artifact.contractName}`);
  }
}
```

### Version Upgrade Strategy

```typescript
// scripts/upgrade-diamond-abi.ts
export class UpgradeManager {
  async upgradeToLatestVersion() {
    console.log('🔄 Upgrading Diamond ABI to latest version...');
    
    // Backup existing ABIs
    await this.backupExistingAbis();
    
    // Regenerate with latest features
    await this.regenerateAbis();
    
    // Validate upgrade
    await this.validateUpgrade();
    
    console.log('✅ Upgrade completed');
  }

  private async backupExistingAbis() {
    const backupDir = `./artifacts/diamond-abi-backup-${Date.now()}`;
    // Copy existing ABIs to backup directory
  }

  private async regenerateAbis() {
    // Regenerate all ABIs with latest version
  }

  private async validateUpgrade() {
    // Run tests to ensure upgrade was successful
  }
}
```

## Conclusion

These practical examples and patterns provide a comprehensive foundation for implementing the Diamond ABI Generator in real-world projects. The patterns cover:

- **Integration Patterns**: Basic setup, multi-network support, and development workflows
- **Frontend Integration**: React, Next.js, and Vue.js examples
- **Testing**: Unit and integration testing strategies
- **CI/CD**: Automated workflows for different platforms
- **Performance**: Caching and parallel processing optimizations
- **Custom Tooling**: VS Code extensions and CLI tools
- **Migration**: Strategies for adopting the Diamond ABI system

Choose the patterns that best fit your project's needs and customize them according to your specific requirements.
