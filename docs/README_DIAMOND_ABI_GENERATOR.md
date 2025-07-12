# Diamond ABI Generator Documentation

## Overview

The Diamond ABI Generator is a comprehensive tool for generating unified Application Binary Interface (ABI) files for ERC-2535 Diamond Proxy contracts. This documentation provides everything you need to implement and utilize the Diamond ABI Generator in your projects.

## 📚 Documentation Structure

### 1. [Implementation Guide](./DIAMOND_ABI_GENERATOR_IMPLEMENTATION.md)

Complete implementation guide covering all aspects of the Diamond ABI Generator

- ✅ Installation and setup
- ✅ Command-line interface usage
- ✅ Programmatic API integration
- ✅ TypeChain integration for type generation
- ✅ Viem integration for modern Ethereum development
- ✅ AbityPe integration for type-safe ABI handling
- ✅ Configuration options and advanced features
- ✅ Best practices and troubleshooting

### 2. [Practical Examples](./DIAMOND_ABI_GENERATOR_EXAMPLES.md)

Real-world examples and patterns for common use cases

- ✅ Integration patterns for different project types
- ✅ Frontend framework integration (React, Next.js, Vue.js)
- ✅ Testing strategies and patterns
- ✅ CI/CD pipeline integration
- ✅ Performance optimization techniques
- ✅ Custom tooling and extensions
- ✅ Migration strategies

### 3. [Quick Reference](./DIAMOND_ABI_GENERATOR_QUICK_REFERENCE.md)

Cheat sheet for common operations and configurations

- ✅ Command reference
- ✅ API quick reference
- ✅ Configuration options
- ✅ Common patterns
- ✅ Troubleshooting guide
- ✅ Best practices checklist

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- Hardhat project with compiled contracts  
- Diamonds module setup with deployment configuration

### Basic Usage

```bash
# Generate ABI for your diamond
npm run diamond-abi generate --diamond YourDiamond --network localhost

# Generate with TypeChain types
npm run diamond-abi generate --diamond YourDiamond
npx typechain --target ethers-v5 --out-dir typechain-types artifacts/diamond-abi/*.json

# Preview ABI changes before deployment
npm run diamond-abi preview --diamond YourDiamond --verbose
```

## 🔧 Key Features

### Core Functionality

- **Unified ABI Generation**: Combine all facet ABIs into a single, cohesive interface
- **Function Selector Registry**: Seamless integration with diamond deployment system
- **Preview Mode**: Preview ABI changes before applying diamond cuts
- **Source Information**: Optional inclusion of source code metadata
- **Validation**: Function selector uniqueness validation

### Development Integration

- **TypeChain Support**: Generate type-safe TypeScript interfaces
- **Viem Integration**: Modern Ethereum development with type safety
- **AbityPe Support**: Type-safe ABI handling and validation
- **CLI Tools**: Professional command-line interface
- **Watch Mode**: Automatic regeneration during development

### Production Features

- **Performance Optimization**: Efficient processing of large diamond deployments
- **Caching**: Intelligent caching for improved performance
- **Error Handling**: Comprehensive error handling and recovery
- **CI/CD Integration**: Automated workflows for deployment pipelines
- **Multi-Network Support**: Support for different networks and chain IDs

## 🏗️ Architecture

### Core Components

```typescript
// Core ABI Generation
import { generateDiamondAbi, Diamond } from 'diamonds';

// Setup
const diamond = new Diamond(config, repository);
const result = await generateDiamondAbi(diamond, options);

// Advanced Usage
const generator = new DiamondAbiGenerator(options);
const result = await generator.generateAbi();
```

### Output Structure

```text
artifacts/diamond-abi/
├── YourDiamond.json          # Complete diamond artifact
├── YourDiamond.d.ts          # TypeScript interface
└── metadata.json             # Generation metadata
```

## 🛠️ Integration Examples

### Frontend Integration

```typescript
// React Hook
import { useDiamond } from './hooks/useDiamond';
import DiamondABI from './artifacts/diamond-abi/GameDiamond.json';

function GameComponent() {
  const { contract } = useDiamond(diamondAddress, provider);
  // Use contract with full ABI
}
```

### Viem Integration

```typescript
import { createPublicClient, http } from 'viem';
import DiamondABI from './artifacts/diamond-abi/GameDiamond.json';

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

const result = await client.readContract({
  address: diamondAddress,
  abi: DiamondABI.abi,
  functionName: 'someFunction'
});
```

### Testing Integration

```typescript
describe('Diamond ABI', () => {
  it('should generate valid ABI', async () => {
    const result = await generateDiamondAbi(diamond);
    expect(result.abi).to.be.an('array');
    expect(result.stats.totalFunctions).to.be.greaterThan(0);
  });
});
```

## 📋 Configuration

### Basic Configuration

```typescript
const options = {
  outputDir: './artifacts/diamond-abi',
  includeSourceInfo: true,
  validateSelectors: true,
  verbose: true
};
```

### CLI Configuration

```bash
npm run diamond-abi generate \
  --diamond YourDiamond \
  --network localhost \
  --output ./artifacts/diamond-abi \
  --include-source \
  --validate-selectors \
  --verbose
```

## 🧪 Testing

### Unit Tests

```bash
# Run ABI generation tests
npm run test:unit -- --grep "Diamond ABI"

# Run integration tests
npm run test:integration -- --grep "diamondAbiGeneration"
```

### Validation

```bash
# Validate generated ABI
npm run diamond-abi validate artifacts/diamond-abi/YourDiamond.json

# Compare ABIs
npm run diamond-abi compare old-abi.json new-abi.json
```

## 🚦 CI/CD Integration

### GitHub Actions

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

## 📦 Package.json Scripts

Recommended scripts for your project:

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

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "No artifacts found" | Run `npm run compile` first |
| "Function selector collision" | Enable `validateSelectors: true` |
| "Missing deployment data" | Check `diamonds/` directory exists |
| "TypeChain generation fails" | Validate ABI first |

### Debug Mode

```bash
# Enable verbose logging
npm run diamond-abi generate --verbose

# Or programmatically
const result = await generateDiamondAbi(diamond, { verbose: true });
```

## 📈 Performance

### Optimization Tips

1. **Use caching** for repeated operations
2. **Enable parallel processing** for multiple diamonds
3. **Filter facets** to include only necessary ones
4. **Use preview mode** to validate changes before generation

### Benchmarks

- **Small diamonds (1-5 facets)**: ~50-200ms
- **Medium diamonds (10-20 facets)**: ~100-300ms  
- **Large diamonds (50+ facets)**: ~500-1000ms

## 🤝 Best Practices

1. **Always validate selectors** in production
2. **Include in CI/CD pipeline** for automated testing
3. **Version control generated ABIs** for tracking changes
4. **Use TypeScript types** for better development experience
5. **Test integration** with actual contracts
6. **Monitor performance** for large diamonds

## 🔗 Related Documentation

- [Main Implementation Summary](./DIAMOND_ABI_GENERATION.md)
- [ERC-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)
- [TypeChain Documentation](https://github.com/dethcrypto/TypeChain)
- [Viem Documentation](https://viem.sh/)
- [AbityPe Documentation](https://abitype.dev/)

## 📄 License

This documentation is part of the diamonds module and is licensed under the MIT License.

---

**Need help?** Check the [troubleshooting section](./DIAMOND_ABI_GENERATOR_QUICK_REFERENCE.md#troubleshooting) or open an issue in the repository.
