# Diamond ABI Generator - Implementation Guide

## Overview

The Diamond ABI Generator is a comprehensive tool for generating unified ABI (Application Binary Interface) files for ERC-2535 Diamond Proxy contracts. It combines the ABIs of all deployed and planned facets into a single, cohesive interface that can be used with frontend frameworks, TypeScript projects, and development tools.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation & Setup](#installation--setup)
3. [Command Line Interface](#command-line-interface)
4. [Programmatic Usage](#programmatic-usage)
5. [TypeChain Integration](#typechain-integration)
6. [Viem Integration](#viem-integration)
7. [AbityPe Integration](#abitype-integration)
8. [Configuration Options](#configuration-options)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Examples](#examples)

## Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- Hardhat project with compiled contracts
- Diamonds module setup with deployment configuration

### Basic Usage

```bash
# Generate ABI for your diamond
npm run diamond-abi generate --diamond YourDiamond --network localhost

# Preview ABI changes before deployment
npm run diamond-abi preview --diamond YourDiamond --verbose
```

## Installation & Setup

### 1. Ensure Diamonds Module is Configured

Your project should already have the diamonds module configured with:

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "diamonds";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};

export default config;
```

### 2. Verify Deployment Configuration

Ensure your diamond deployment configuration exists:

```typescript
// diamonds/YourDiamond.localhost.config.json
{
  "protocolVersion": "1.0.0",
  "facets": [
    {
      "name": "DiamondCutFacet",
      "priority": 1,
      "libraries": []
    },
    {
      "name": "DiamondLoupeFacet", 
      "priority": 2,
      "libraries": []
    }
  ]
}
```

### 3. Install Additional Dependencies (if needed)

```bash
npm install --save-dev @types/node typescript
```

## Command Line Interface

### Generate Command

Generate a complete ABI for your deployed diamond:

```bash
npm run diamond-abi generate [options]
```

**Options:**

- `-d, --diamond <name>`: Diamond name (default: "GeniusDiamond")
- `-n, --network <name>`: Network name (default: "localhost")
- `-c, --chain-id <id>`: Chain ID (default: "31337")
- `-o, --output <dir>`: Output directory (default: "artifacts/diamond-abi")
- `--deployments-path <path>`: Deployments path (default: "./diamonds")
- `--contracts-path <path>`: Contracts path (default: "./contracts")
- `--include-source`: Include source information in ABI
- `--validate-selectors`: Validate function selector uniqueness
- `-v, --verbose`: Verbose output

**Examples:**

```bash
# Basic generation
npm run diamond-abi generate --diamond MyDiamond

# Generate with source info and validation
npm run diamond-abi generate --diamond MyDiamond --include-source --validate-selectors -v

# Generate for specific network
npm run diamond-abi generate --diamond MyDiamond --network sepolia --chain-id 11155111
```

### Preview Command

Preview ABI changes before applying diamond cuts:

```bash
npm run diamond-abi preview [options]
```

**Options:**

- Same as generate command
- Shows what the ABI would look like with planned cuts

**Example:**

```bash
# Preview changes with detailed output
npm run diamond-abi preview --diamond MyDiamond --verbose
```

### Compare Command

Compare two ABI files to see differences:

```bash
npm run diamond-abi compare <file1> <file2>
```

### Validate Command

Validate an ABI file:

```bash
npm run diamond-abi validate <file>
```

## Programmatic Usage

### Basic Usage

```typescript
import { generateDiamondAbi, Diamond } from 'diamonds';
import { FileDeploymentRepository } from 'diamonds/repositories';

// Setup
const config = {
  diamondName: 'YourDiamond',
  networkName: 'localhost',
  chainId: 31337,
  deploymentsPath: './diamonds',
  contractsPath: './contracts'
};

const repository = new FileDeploymentRepository(config);
const diamond = new Diamond(config, repository);

// Generate ABI
const result = await generateDiamondAbi(diamond, {
  outputDir: './artifacts/diamond-abi',
  includeSourceInfo: true,
  validateSelectors: true,
  verbose: true
});

console.log(`Generated ABI with ${result.stats.totalFunctions} functions`);
```

### Advanced Usage

```typescript
import { 
  DiamondAbiGenerator, 
  DiamondAbiGenerationOptions,
  previewDiamondAbi 
} from 'diamonds';

// Create generator instance for multiple operations
const generator = new DiamondAbiGenerator({
  diamond: diamond,
  outputDir: './artifacts/diamond-abi',
  includeSourceInfo: true,
  validateSelectors: true,
  verbose: true
});

// Generate current ABI
const currentAbi = await generator.generateAbi();

// Preview with planned cuts
const plannedCuts = [
  {
    name: 'NewFacet',
    facetAddress: '0x...',
    action: 0, // Add
    functionSelectors: ['0x12345678', '0x87654321']
  }
];

const previewResult = await previewDiamondAbi(diamond, plannedCuts, {
  verbose: true
});
```

### Using Generated ABI

```typescript
import { ethers } from 'ethers';
import DiamondABI from './artifacts/diamond-abi/YourDiamond.json';

// Create contract instance
const provider = new ethers.providers.JsonRpcProvider();
const diamond = new ethers.Contract(
  diamondAddress,
  DiamondABI.abi,
  provider
);

// Call functions
const result = await diamond.someFunction();
```

## TypeChain Integration

### 1. Install TypeChain

```bash
npm install --save-dev typechain @typechain/ethers-v5 @typechain/hardhat
```

### 2. Configure Hardhat

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "diamonds";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
    discriminateTypes: true,
    dontOverrideCompile: false
  }
};

export default config;
```

### 3. Generate Types

```bash
# Generate diamond ABI first
npm run diamond-abi generate --diamond YourDiamond

# Generate TypeChain types
npx typechain --target ethers-v5 --out-dir typechain-types 'artifacts/diamond-abi/*.json'
```

### 4. Use Generated Types

```typescript
import { YourDiamond } from '../typechain-types/YourDiamond';
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider();
const diamond = YourDiamond__factory.connect(diamondAddress, provider);

// Type-safe function calls
const result: string = await diamond.someFunction();
```

### 5. Automated Integration

Create a script to automate the process:

```typescript
// scripts/generate-diamond-types.ts
import { generateDiamondAbi, Diamond } from 'diamonds';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function generateTypes() {
  // Generate diamond ABI
  const result = await generateDiamondAbi(diamond, {
    outputDir: './artifacts/diamond-abi'
  });
  
  // Generate TypeChain types
  await execAsync('npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json');
  
  console.log('✅ Types generated successfully');
}

generateTypes().catch(console.error);
```

## Viem Integration

### 1. Installation

```bash
npm install viem
```

### 2. Use Generated ABI with Viem

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import DiamondABI from './artifacts/diamond-abi/YourDiamond.json';

// Create clients
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http()
});

// Read functions
const result = await publicClient.readContract({
  address: diamondAddress,
  abi: DiamondABI.abi,
  functionName: 'someFunction',
  args: []
});

// Write functions
const hash = await walletClient.writeContract({
  address: diamondAddress,
  abi: DiamondABI.abi,
  functionName: 'someWriteFunction',
  args: [arg1, arg2]
});
```

### 3. Type-Safe Viem Usage

```typescript
import { Abi } from 'viem';
import DiamondABI from './artifacts/diamond-abi/YourDiamond.json';

const abi = DiamondABI.abi as Abi;

// Type-safe contract interactions
const result = await publicClient.readContract({
  address: diamondAddress,
  abi,
  functionName: 'someFunction' // TypeScript will provide autocompletion
});
```

### 4. Generate Viem Types

```typescript
// scripts/generate-viem-types.ts
import { generateDiamondAbi } from 'diamonds';
import { writeFileSync } from 'fs';

async function generateViemTypes() {
  const result = await generateDiamondAbi(diamond);
  
  // Generate Viem-specific type definitions
  const viemTypes = `
// Auto-generated Viem types for ${diamond.diamondName}
import { Abi } from 'viem';

export const ${diamond.diamondName}ABI = ${JSON.stringify(result.abi, null, 2)} as const;

export type ${diamond.diamondName}ABI = typeof ${diamond.diamondName}ABI;
`;

  writeFileSync('./types/diamond-viem.ts', viemTypes);
}
```

## AbityPe Integration

### 1. Installation

```bash
npm install abitype
```

### 2. Generate AbityPe Types

```typescript
// scripts/generate-abitype.ts
import { generateDiamondAbi } from 'diamonds';
import { writeFileSync } from 'fs';

async function generateAbiTypes() {
  const result = await generateDiamondAbi(diamond);
  
  const abiTypesContent = `
// Auto-generated AbityPe types for ${diamond.diamondName}
import { Abi } from 'abitype';

export const ${diamond.diamondName}ABI = ${JSON.stringify(result.abi, null, 2)} as const satisfies Abi;

export type ${diamond.diamondName}ABI = typeof ${diamond.diamondName}ABI;

// Extract function names
export type ${diamond.diamondName}FunctionNames = ${diamond.diamondName}ABI[number]['name'];

// Extract events
export type ${diamond.diamondName}Events = Extract<${diamond.diamondName}ABI[number], { type: 'event' }>;
`;

  writeFileSync('./types/diamond-abitype.ts', abiTypesContent);
}
```

### 3. Use AbityPe Types

```typescript
import { YourDiamondABI, YourDiamondFunctionNames } from './types/diamond-abitype';

// Type-safe function name usage
const functionName: YourDiamondFunctionNames = 'someFunction';

// Use with other libraries
import { parseAbi } from 'abitype';
const parsedAbi = parseAbi(YourDiamondABI);
```

## Configuration Options

### DiamondAbiGenerationOptions

```typescript
interface DiamondAbiGenerationOptions {
  /** Diamond instance to generate ABI for */
  diamond: Diamond;
  
  /** Output directory for generated ABI files */
  outputDir?: string;
  
  /** Whether to include source information in ABI */
  includeSourceInfo?: boolean;
  
  /** Whether to validate function selector uniqueness */
  validateSelectors?: boolean;
  
  /** Whether to log verbose output */
  verbose?: boolean;
  
  /** Custom facet cuts to include (for preview/planning) */
  customFacetCuts?: FacetCuts;
}
```

### Generated Output Structure

```text
artifacts/diamond-abi/
├── YourDiamond.json          # Complete diamond artifact
├── YourDiamond.d.ts          # TypeScript interface
└── metadata.json             # Generation metadata
```

**YourDiamond.json Structure:**

```json
{
  "_format": "hh-sol-artifact-1",
  "contractName": "YourDiamond",
  "sourceName": "diamond-abi/DiamondABI.sol",
  "abi": [...],
  "bytecode": "",
  "deployedBytecode": "",
  "linkReferences": {},
  "deployedLinkReferences": {},
  "_diamondMetadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "diamondName": "YourDiamond",
    "networkName": "localhost",
    "chainId": 31337,
    "selectorMap": {
      "0x01ffc9a7": "DiamondLoupeFacet",
      "0x52ef6b2c": "DiamondLoupeFacet"
    },
    "stats": {
      "totalFunctions": 15,
      "totalEvents": 5,
      "totalErrors": 2,
      "facetCount": 4,
      "duplicateSelectorsSkipped": 0
    }
  }
}
```

## Advanced Features

### 1. Custom Facet Filters

```typescript
const generator = new DiamondAbiGenerator({
  diamond: diamond,
  outputDir: './artifacts/diamond-abi'
});

// Only include specific facets
const result = await generator.generateAbi({
  facetFilter: (facetName: string) => {
    return !facetName.includes('Test'); // Exclude test facets
  }
});
```

### 2. Preview Mode

```typescript
// Preview ABI changes before applying cuts
const plannedCuts = [
  {
    name: 'NewFacet',
    facetAddress: '0x...',
    action: 0, // Add
    functionSelectors: ['0x12345678']
  }
];

const preview = await previewDiamondAbi(diamond, plannedCuts, {
  verbose: true
});

console.log(`Preview: ${preview.stats.totalFunctions} functions`);
```

### 3. Batch Operations

```typescript
// Generate ABIs for multiple diamonds
const diamonds = ['Diamond1', 'Diamond2', 'Diamond3'];

const results = await Promise.all(
  diamonds.map(diamondName => {
    const config = { ...baseConfig, diamondName };
    const diamond = new Diamond(config, repository);
    return generateDiamondAbi(diamond, { outputDir: `./artifacts/${diamondName}` });
  })
);
```

### 4. Custom Output Formats

```typescript
// Generate custom output formats
const result = await generateDiamondAbi(diamond);

// Generate React hooks
const reactHooks = generateReactHooks(result.abi);
writeFileSync('./src/hooks/useDiamond.ts', reactHooks);

// Generate GraphQL schema
const graphqlSchema = generateGraphQLSchema(result.abi);
writeFileSync('./schema.graphql', graphqlSchema);
```

## Best Practices

### 1. Automation

Create npm scripts for common tasks:

```json
{
  "scripts": {
    "diamond:abi": "npm run diamond-abi generate",
    "diamond:types": "npm run diamond:abi && npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json",
    "diamond:preview": "npm run diamond-abi preview --verbose",
    "diamond:validate": "npm run diamond-abi validate artifacts/diamond-abi/*.json"
  }
}
```

### 2. CI/CD Integration

```yaml
# .github/workflows/diamond-abi.yml
name: Diamond ABI Generation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  generate-abi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run compile
      - run: npm run diamond:abi
      - run: npm run diamond:types
      - uses: actions/upload-artifact@v3
        with:
          name: diamond-abi
          path: artifacts/diamond-abi/
```

### 3. Version Control

```gitignore
# Include generated ABIs in version control
!artifacts/diamond-abi/
artifacts/diamond-abi/*.json
artifacts/diamond-abi/*.d.ts

# But exclude temporary files
artifacts/diamond-abi/tmp/
```

### 4. Error Handling

```typescript
async function generateAbiSafely() {
  try {
    const result = await generateDiamondAbi(diamond, {
      validateSelectors: true,
      verbose: true
    });
    
    // Validate result
    if (result.stats.totalFunctions === 0) {
      throw new Error('No functions found in generated ABI');
    }
    
    return result;
  } catch (error) {
    console.error('ABI generation failed:', error);
    
    // Fallback to previous version
    const fallbackPath = './artifacts/diamond-abi/YourDiamond.json';
    if (existsSync(fallbackPath)) {
      console.log('Using fallback ABI');
      return JSON.parse(readFileSync(fallbackPath, 'utf8'));
    }
    
    throw error;
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "No artifacts found"

**Problem:** Contract artifacts not found during ABI generation.

**Solution:**

```bash
# Compile contracts first
npm run compile

# Check artifacts directory
ls artifacts/contracts/

# Generate ABI with verbose output
npm run diamond-abi generate --verbose
```

#### 2. "Function selector collision"

**Problem:** Multiple functions with the same selector.

**Solution:**

```typescript
// Enable selector validation
const result = await generateDiamondAbi(diamond, {
  validateSelectors: true,
  verbose: true
});

// Check for duplicates in output
if (result.stats.duplicateSelectorsSkipped > 0) {
  console.warn('Duplicate selectors found');
}
```

#### 3. "Missing deployment data"

**Problem:** Diamond deployment data not found.

**Solution:**

```bash
# Check deployment files
ls diamonds/

# Verify deployment configuration
cat diamonds/YourDiamond.localhost.config.json

# Check deployment data
cat diamonds/YourDiamond.localhost.json
```

#### 4. "TypeChain generation fails"

**Problem:** TypeChain cannot process generated ABI.

**Solution:**

```bash
# Generate ABI first
npm run diamond-abi generate

# Check ABI validity
npm run diamond-abi validate artifacts/diamond-abi/YourDiamond.json

# Generate types with debug
npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json --show-stack-traces
```

### Debug Mode

Enable verbose logging for detailed debugging:

```typescript
const result = await generateDiamondAbi(diamond, {
  verbose: true,
  validateSelectors: true,
  includeSourceInfo: true
});
```

This will output:

- Facet processing details
- Selector calculations
- ABI item additions
- Statistics and warnings

## Examples

### Example 1: Basic Integration

```typescript
// scripts/generate-diamond-abi.ts
import { generateDiamondAbi, Diamond } from 'diamonds';
import { FileDeploymentRepository } from 'diamonds/repositories';

async function main() {
  const config = {
    diamondName: 'GameDiamond',
    networkName: 'localhost',
    chainId: 31337,
    deploymentsPath: './diamonds',
    contractsPath: './contracts'
  };

  const repository = new FileDeploymentRepository(config);
  const diamond = new Diamond(config, repository);

  const result = await generateDiamondAbi(diamond, {
    outputDir: './artifacts/diamond-abi',
    includeSourceInfo: true,
    verbose: true
  });

  console.log(`✅ Generated ABI with ${result.stats.totalFunctions} functions`);
}

main().catch(console.error);
```

### Example 2: Frontend Integration

```typescript
// src/contracts/diamond.ts
import { ethers } from 'ethers';
import DiamondABI from '../artifacts/diamond-abi/GameDiamond.json';

export class DiamondContract {
  private contract: ethers.Contract;

  constructor(address: string, provider: ethers.Provider) {
    this.contract = new ethers.Contract(
      address,
      DiamondABI.abi,
      provider
    );
  }

  async getPlayerStats(playerId: string) {
    return await this.contract.getPlayerStats(playerId);
  }

  async createGame(gameParams: any) {
    return await this.contract.createGame(gameParams);
  }
}
```

### Example 3: Testing Integration

```typescript
// test/diamond-abi.test.ts
import { expect } from 'chai';
import { generateDiamondAbi } from 'diamonds';
import { ethers } from 'hardhat';

describe('Diamond ABI Generation', () => {
  it('should generate valid ABI', async () => {
    const result = await generateDiamondAbi(diamond, {
      validateSelectors: true
    });

    expect(result.abi).to.be.an('array');
    expect(result.stats.totalFunctions).to.be.greaterThan(0);
    expect(result.stats.duplicateSelectorsSkipped).to.equal(0);
  });

  it('should work with ethers.js', async () => {
    const result = await generateDiamondAbi(diamond);
    
    const contract = new ethers.Contract(
      diamondAddress,
      result.abi,
      ethers.provider
    );

    const isValidInterface = ethers.utils.Interface.isInterface(contract.interface);
    expect(isValidInterface).to.be.true;
  });
});
```

### Example 4: Advanced Workflow

```typescript
// scripts/diamond-deployment-workflow.ts
import { generateDiamondAbi, previewDiamondAbi } from 'diamonds';

async function deploymentWorkflow() {
  // 1. Generate current ABI
  const currentAbi = await generateDiamondAbi(diamond, {
    outputDir: './artifacts/diamond-abi/current',
    verbose: true
  });

  // 2. Preview changes
  const plannedCuts = [
    {
      name: 'NewFeatureFacet',
      facetAddress: '0x...',
      action: 0,
      functionSelectors: ['0x12345678', '0x87654321']
    }
  ];

  const preview = await previewDiamondAbi(diamond, plannedCuts, {
    outputDir: './artifacts/diamond-abi/preview',
    verbose: true
  });

  // 3. Compare and validate
  const functionDiff = preview.stats.totalFunctions - currentAbi.stats.totalFunctions;
  console.log(`📊 Function count will change by: ${functionDiff}`);

  // 4. Generate types
  await generateTypes(preview.outputPath!);

  // 5. Run tests
  await runTests();

  console.log('✅ Deployment workflow completed');
}

async function generateTypes(abiPath: string) {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(`npx typechain --target ethers-v5 --out-dir typechain-types ${abiPath}`, (error: any) => {
      if (error) reject(error);
      else resolve(true);
    });
  });
}

async function runTests() {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec('npm test', (error: any) => {
      if (error) reject(error);
      else resolve(true);
    });
  });
}
```

## Conclusion

The Diamond ABI Generator provides a comprehensive solution for managing ERC-2535 Diamond Proxy ABIs. By following this implementation guide, you can:

- Generate unified ABIs for complex diamond contracts
- Integrate with modern development tools (TypeChain, Viem, AbityPe)
- Automate ABI generation in your development workflow
- Maintain type safety across your entire application stack
- Preview and validate changes before deployment

For additional support and advanced use cases, refer to the API documentation and examples in the repository.
