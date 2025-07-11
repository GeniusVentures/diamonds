// test/setup.ts
import hre from "hardhat";;
import { Contract, ContractFactory } from 'ethers';
import * as fs from 'fs-extra';
import * as path from 'path';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

/**
 * Test setup helper that deploys mock contracts for diamond testing
 */
export async function setupMockContracts() {
  const [deployer, ...accounts] = await (hre as any).ethers.getSigners();

  // Deploy mock diamond cut facet
  const DiamondCutFacet: ContractFactory = await (hre as any).ethers.getContractFactory('MockDiamondCutFacet');
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.waitForDeployment();

  // Deploy mock diamond loupe facet
  const DiamondLoupeFacet: ContractFactory = await (hre as any).ethers.getContractFactory('MockDiamondLoupeFacet');
  const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
  await diamondLoupeFacet.waitForDeployment();

  // Deploy mock test facet
  const TestFacet: ContractFactory = await (hre as any).ethers.getContractFactory('MockTestFacet');
  const testFacet = await TestFacet.deploy();
  await testFacet.waitForDeployment();

  // Deploy mock diamond
  const Diamond: ContractFactory = await (hre as any).ethers.getContractFactory('MockDiamond');
  const diamond = await Diamond.deploy(deployer.address, await diamondCutFacet.getAddress());
  await diamond.waitForDeployment();

  return {
    deployer,
    accounts,
    diamondCutFacet,
    diamondLoupeFacet,
    testFacet,
    diamond,
  };
}

/**
 * Create test files and directories
 */
export async function setupTestFiles(
  tempDir: string,
  diamondName: string,
  networkName: string,
  chainId: number
) {
  // Create temporary directories for test artifacts
  await fs.ensureDir(tempDir);
  await fs.ensureDir(path.join(tempDir, diamondName));
  await fs.ensureDir(path.join(tempDir, diamondName, 'deployments'));
  await fs.ensureDir(path.join(tempDir, diamondName, 'deployments', 'defender'));
  await fs.ensureDir(path.join(tempDir, diamondName, 'callbacks'));
  await fs.ensureDir(path.join(tempDir, diamondName, 'deployments', diamondName, 'callbacks'));

  // Create sample config file
  const configPath = path.join(tempDir, diamondName, `${diamondName.toLowerCase()}.config.json`);

  // Copy the mock config file instead of creating a new one
  const mockConfigPath = path.join(__dirname, 'mocks', 'testdiamond.config.json');
  await fs.copy(mockConfigPath, configPath);

  // Create empty deployment data file
  const deploymentPath = path.join(
    tempDir,
    diamondName,
    'deployments',
    `${diamondName.toLowerCase()}-${networkName.toLowerCase()}-${chainId}.json`
  );

  const emptyDeployment = {
    DiamondAddress: "",
    DeployerAddress: "",
    DeployedFacets: {},
    ExternalLibraries: {},
    protocolVersion: 0
  };

  await fs.writeJson(deploymentPath, emptyDeployment, { spaces: 2 });

  // Create sample callback file in both locations for compatibility
  const callbackPath1 = path.join(tempDir, diamondName, 'callbacks', 'TestFacet.js');
  const callbackPath2 = path.join(tempDir, diamondName, 'deployments', diamondName, 'callbacks', 'TestFacet.js');

  // Copy the mock callback file to both locations
  const mockCallbackPath = path.join(__dirname, 'mocks', 'callbacks', 'TestFacet.js');
  await fs.copy(mockCallbackPath, callbackPath1);
  await fs.copy(mockCallbackPath, callbackPath2);

  return {
    configPath,
    deploymentPath,
    callbackPath1,
    callbackPath2
  };
}

/**
 * Helper to create a temporary testing environment
 */
export async function setupTestEnvironment(
  tempDir: string,
  diamondName: string = 'TestDiamond',
  networkName: string = 'hardhat',
  chainId: number = 31337
) {
  const contracts = await setupMockContracts();
  const files = await setupTestFiles(tempDir, diamondName, networkName, chainId);

  return {
    ...contracts,
    ...files,
    tempDir,
    diamondName,
    networkName,
    chainId
  };
}

/**
 * Clean up test environment
 */
export async function cleanupTestEnvironment(tempDir: string) {
  await fs.remove(tempDir);
}