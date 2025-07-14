# Test Setup and Execution Guide

This guide walks through setting up and running the test suite for the `diamonds` module.

## Prerequisites

- Node.js (v14+)
- Yarn or npm

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/diamonds.git
   cd diamonds
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

## Test Configuration

The test suite uses Hardhat for smart contract testing and includes mock implementations of:

- Diamond contracts and facets
- OpenZeppelin Defender API
- File system repositories

All test configuration is in `hardhat.config.ts`. The mock contracts are located in `test/mocks/contracts`.

## Running Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

## Test Structure

- **Unit Tests**: Test individual components in isolation
  - Core classes (Diamond, DiamondDeployer, etc.)
  - Strategy implementations
  - Repository implementations

- **Integration Tests**: Test end-to-end workflows
  - Local deployment
  - OZ Defender deployment
  - Facet upgrades

## Mock Contracts

The test suite includes mock implementations of:

- `MockDiamond.sol`: A simplified diamond contract
- `MockDiamondCutFacet.sol`: Diamond cut facet
- `MockDiamondLoupeFacet.sol`: Diamond loupe facet
- `MockTestFacet.sol`: Test facet with various functions

## Test Helpers

The `setup.ts` file provides helper functions for:

- Setting up the test environment
- Creating temporary configuration files
- Deploying mock contracts
- Cleaning up after tests

## Debugging Tests

When tests fail, check:

1. Console output for error messages
2. Temporary files in `.tmp-test*` directories
3. Hardhat error traces

You can add `console.log` statements in test files for debugging.

## Cleaning Up

To clean up temporary test files:

```bash
npm run clean
```

## Adding New Tests

1. Create a new test file in the appropriate directory
2. Import needed components and test helpers
3. Use the setup helper to initialize the environment
4. Write your tests using Mocha/Chai syntax
5. Clean up after tests using the cleanup helper

## Mocking External Services

The OZ Defender tests use sinon to mock the API:

```typescript
// Example mock setup
mockDeployClient.deployContract.resolves({
  deploymentId: 'defender-deploy-id',
  status: 'pending'
});
```

## Environment Variables

Set these environment variables for local testing:

```
DEFENDER_API_KEY=test-api-key
DEFENDER_API_SECRET=test-api-secret
DEFENDER_RELAYER_ADDRESS=0x1234...
DEFENDER_SAFE_ADDRESS=0x5678...
```