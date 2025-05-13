// test/setup.ts
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import * as fs from 'fs-extra';
import * as path from 'path';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

/**
 * Test setup helper that deploys mock contracts for diamond testing
 */
export async function setupMockContracts() {
  const [deployer, ...accounts] = await ethers.getSigners();

  // Deploy mock diamond cut facet
  const DiamondCutFacet: ContractFactory = await ethers.getContractFactory('MockDiamondCutFacet');
  const diamondCutFacet: Contract = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();

  // Deploy mock diamond loupe facet
  const DiamondLoupeFacet: ContractFactory = await ethers.getContractFactory('MockDiamondLoupeFacet');
  const diamondLoupeFacet: Contract = await DiamondLoupeFacet.deploy();
  await diamondLoupeFacet.deployed();

  // Deploy mock test facet
  const TestFacet: ContractFactory = await ethers.getContractFactory('MockTestFacet');
  const testFacet: Contract = await TestFacet.deploy();
  await testFacet.deployed();

  // Deploy mock diamond
  const Diamond: ContractFactory = await ethers.getContractFactory('MockDiamond');
  const diamond: Contract = await Diamond.deploy(deployer.address, diamondCutFacet.address);
  await diamond.deployed();

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

  // Create sample config file
  const configPath = path.join(tempDir, diamondName, `${diamondName.toLowerCase()}.config.json`);

  // Sample configuration
  const sampleConfig = {
    protocolVersion: 0.0,
    facets: {
      DiamondCutFacet: {
        priority: 10,
        versions: {
          "0.0": {}
        }
      },
      DiamondLoupeFacet: {
        priority: 20,
        versions: {
          "0.0": {}
        }
      },
      TestFacet: {
        priority: 30,
        versions: {
          "0.0": {
            callbacks: ["testCallback"],
            deployInit: "initialize()",
            upgradeInit: "reinitialize()"
          }
        }
      }
    }
  };

  await fs.writeJson(configPath, sampleConfig, { spaces: 2 });

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

  // Create sample callback file
  const callbackPath = path.join(tempDir, diamondName, 'callbacks', 'TestFacet.ts');

  const callbackContent = `
import { CallbackArgs } from "../../../src/types";

export async function testCallback(args: CallbackArgs) {
  const { diamond } = args;
  console.log(\`Running test callback for \${diamond.diamondName} on \${diamond.networkName}\`);
  // Add any test callback logic here
}
`;

  await fs.writeFile(callbackPath, callbackContent);

  return {
    configPath,
    deploymentPath,
    callbackPath
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