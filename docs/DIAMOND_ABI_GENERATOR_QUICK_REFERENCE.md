# Diamond ABI Generator - Quick Reference

## Overview

Quick reference guide for the Diamond ABI Generator. Use this as a cheat sheet for common operations and configurations.

## Quick Start Commands

### Basic Usage

```bash
# Generate ABI for your diamond
npm run diamond-abi generate --diamond YourDiamond

# Generate with full options
npm run diamond-abi generate --diamond YourDiamond --network localhost --verbose --include-source

# Preview changes before deployment
npm run diamond-abi preview --diamond YourDiamond --verbose
```

### With TypeChain

```bash
# Generate ABI and TypeChain types
npm run diamond-abi generate --diamond YourDiamond
npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json
```

## API Reference

### generateDiamondAbi()

```typescript
import { generateDiamondAbi } from 'diamonds';

const result = await generateDiamondAbi(diamond, {
  outputDir: './artifacts/diamond-abi',     // Output directory
  includeSourceInfo: true,                 // Include source metadata
  validateSelectors: true,                 // Validate selector uniqueness
  verbose: true                            // Enable verbose logging
});
```

### DiamondAbiGenerator Class

```typescript
import { DiamondAbiGenerator } from 'diamonds';

const generator = new DiamondAbiGenerator({
  diamond: diamond,
  outputDir: './artifacts/diamond-abi',
  includeSourceInfo: true,
  validateSelectors: true,
  verbose: true
});

const result = await generator.generateAbi();
```

## Configuration Options

### DiamondAbiGenerationOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `diamond` | `Diamond` | Required | Diamond instance |
| `outputDir` | `string` | `'artifacts/diamond-abi'` | Output directory |
| `includeSourceInfo` | `boolean` | `true` | Include source metadata |
| `validateSelectors` | `boolean` | `true` | Validate selector uniqueness |
| `verbose` | `boolean` | `false` | Enable verbose logging |
| `customFacetCuts` | `FacetCuts` | `undefined` | Custom facet cuts for preview |

### CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--diamond` | `-d` | Diamond name | `'GeniusDiamond'` |
| `--network` | `-n` | Network name | `'localhost'` |
| `--chain-id` | `-c` | Chain ID | `'31337'` |
| `--output` | `-o` | Output directory | `'artifacts/diamond-abi'` |
| `--include-source` | | Include source info | `false` |
| `--validate-selectors` | | Validate selectors | `true` |
| `--verbose` | `-v` | Verbose output | `false` |

## Common Patterns

### Basic Integration

```typescript
import { generateDiamondAbi, Diamond } from 'diamonds';
import { FileDeploymentRepository } from 'diamonds/repositories';

// Setup
const config = {
  diamondName: 'GameDiamond',
  networkName: 'localhost',
  chainId: 31337,
  deploymentsPath: './diamonds',
  contractsPath: './contracts'
};

const repository = new FileDeploymentRepository(config);
const diamond = new Diamond(config, repository);

// Generate ABI
const result = await generateDiamondAbi(diamond);
```

### With Error Handling

```typescript
try {
  const result = await generateDiamondAbi(diamond, {
    validateSelectors: true,
    verbose: true
  });
  
  console.log(`✅ Generated ABI with ${result.stats.totalFunctions} functions`);
} catch (error) {
  console.error('❌ ABI generation failed:', error);
}
```

### Preview Mode

```typescript
const plannedCuts = [
  {
    name: 'NewFacet',
    facetAddress: '0x...',
    action: 0, // Add
    functionSelectors: ['0x12345678']
  }
];

const preview = await previewDiamondAbi(diamond, plannedCuts);
console.log(`Preview: ${preview.stats.totalFunctions} functions`);
```

## Frontend Integration

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import DiamondABI from './artifacts/diamond-abi/GameDiamond.json';

export function useDiamond(address: string, provider: ethers.providers.Provider) {
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const diamondContract = new ethers.Contract(address, DiamondABI.abi, provider);
    setContract(diamondContract);
  }, [address, provider]);

  return contract;
}
```

### Viem Integration

```typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import DiamondABI from './artifacts/diamond-abi/GameDiamond.json';

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

const result = await client.readContract({
  address: '0x...',
  abi: DiamondABI.abi,
  functionName: 'someFunction'
});
```

## Output Structure

### Generated Files

```text
artifacts/diamond-abi/
├── YourDiamond.json          # Complete diamond artifact
├── YourDiamond.d.ts          # TypeScript interface
└── metadata.json             # Generation metadata
```

### Artifact Structure

```typescript
{
  "_format": "hh-sol-artifact-1",
  "contractName": "YourDiamond",
  "abi": [...],                    // Combined ABI
  "_diamondMetadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "diamondName": "YourDiamond",
    "selectorMap": {               // Selector to facet mapping
      "0x01ffc9a7": "DiamondLoupeFacet"
    },
    "stats": {                     // Generation statistics
      "totalFunctions": 15,
      "totalEvents": 5,
      "totalErrors": 2,
      "facetCount": 4
    }
  }
}
```

## Common Use Cases

### 1. Development Workflow

```bash
# 1. Compile contracts
npm run compile

# 2. Generate ABI
npm run diamond-abi generate --diamond YourDiamond --verbose

# 3. Generate types
npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json

# 4. Use in frontend
import { YourDiamond } from './typechain-types/YourDiamond';
```

### 2. CI/CD Pipeline

```yaml
- name: Generate Diamond ABI
  run: |
    npm run diamond-abi generate --diamond ${{ matrix.diamond }} --network ${{ matrix.network }}
    npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json

- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: diamond-abi
    path: artifacts/diamond-abi/
```

### 3. Testing

```typescript
describe('Diamond ABI', () => {
  it('should generate valid ABI', async () => {
    const result = await generateDiamondAbi(diamond);
    expect(result.abi).to.be.an('array');
    expect(result.stats.totalFunctions).to.be.greaterThan(0);
  });
});
```

### 4. Multi-Network Deployment

```typescript
const networks = ['localhost', 'sepolia', 'mainnet'];
const diamonds = ['GameDiamond', 'TradingDiamond'];

for (const network of networks) {
  for (const diamondName of diamonds) {
    await generateDiamondAbi(diamond, {
      outputDir: `./artifacts/diamond-abi/${network}`
    });
  }
}
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "diamond:abi": "npm run diamond-abi generate",
    "diamond:types": "npm run diamond:abi && npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json",
    "diamond:preview": "npm run diamond-abi preview --verbose",
    "diamond:validate": "npm run diamond-abi validate artifacts/diamond-abi/*.json",
    "diamond:clean": "rimraf artifacts/diamond-abi typechain-types"
  }
}
```

## Environment Variables

```bash
# Optional environment variables
DIAMOND_ABI_OUTPUT_DIR=./artifacts/diamond-abi
DIAMOND_ABI_VERBOSE=true
DIAMOND_ABI_VALIDATE_SELECTORS=true
DIAMOND_ABI_INCLUDE_SOURCE=true
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "No artifacts found" | Run `npm run compile` first |
| "Function selector collision" | Enable `validateSelectors: true` |
| "Missing deployment data" | Check `diamonds/` directory |
| "TypeChain generation fails" | Validate ABI with `npm run diamond-abi validate` |

### Debug Mode

```bash
# Enable verbose logging
npm run diamond-abi generate --verbose

# Or programmatically
const result = await generateDiamondAbi(diamond, { verbose: true });
```

## Best Practices

1. **Always validate selectors** in production
2. **Use caching** for better performance
3. **Generate types** for TypeScript projects
4. **Include in CI/CD** pipeline
5. **Version control** generated ABIs
6. **Test integration** with contracts

## Links

- [Main Implementation Guide](./DIAMOND_ABI_GENERATOR_IMPLEMENTATION.md)
- [Practical Examples](./DIAMOND_ABI_GENERATOR_EXAMPLES.md)
- [API Documentation](../src/utils/diamondAbiGenerator.ts)
- [CLI Source](../scripts/diamond-abi-cli.ts)
