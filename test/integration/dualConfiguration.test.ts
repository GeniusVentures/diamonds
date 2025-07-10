import { expect } from 'chai';
import hre from "hardhat";;
import { Diamond } from '../../src/core/Diamond';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { DiamondDeployer } from '../../src/core/DiamondDeployer';
import { LocalDeploymentStrategy } from '../../src/strategies/LocalDeploymentStrategy';
import { DiamondConfig } from '../../src/types';
import { ConfigurationResolver } from '../../src/utils/configurationResolver';
import * as fs from 'fs-extra';
import * as path from 'path';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('Integration: Dual Configuration Support', function () {
  this.timeout(30000);

  const TEMP_DIR = path.join(__dirname, '../../.tmp-test-dual-config');
  const DIAMOND_NAME = 'ConfigTestDiamond';
  const NETWORK_NAME = 'hardhat';
  const CHAIN_ID = 31337;

  let deployer: HardhatEthersSigner;
  let accounts: HardhatEthersSigner[];

  before(async function () {
    const setupData = await setupTestEnvironment(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);
    deployer = setupData.deployer;
    accounts = setupData.accounts;
  });

  after(async function () {
    await cleanupTestEnvironment(TEMP_DIR);
  });

  describe('Standalone JSON Configuration', () => {
    it('should resolve configuration from JSON file in diamonds directory', async function () {
      // Create a standalone config file
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);

      const config = await ConfigurationResolver.resolveDiamondConfig(
        DIAMOND_NAME,
        configPath,
        NETWORK_NAME,
        CHAIN_ID
      );

      expect(config.diamondName).to.equal(DIAMOND_NAME);
      expect(config.networkName).to.equal(NETWORK_NAME);
      expect(config.chainId).to.equal(CHAIN_ID);
      expect(config.configFilePath).to.equal(configPath);
      expect(config.contractsPath).to.include('contracts');
      expect(config.deploymentsPath).to.include('deployments');
    });

    it('should create directory structure for standalone configuration', async function () {
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);

      const config = await ConfigurationResolver.resolveDiamondConfig(
        DIAMOND_NAME,
        configPath,
        NETWORK_NAME,
        CHAIN_ID
      );

      await ConfigurationResolver.ensureDirectoryStructure(config);

      // Verify directories were created
      expect(await fs.pathExists(config.deploymentsPath!)).to.be.true;
      expect(await fs.pathExists(config.callbacksPath!)).to.be.true;
    });
  });

  describe('Default Configuration', () => {
    it('should use default paths when no configuration is found', async function () {
      const config = await ConfigurationResolver.resolveDiamondConfig(
        'NonExistentDiamond',
        undefined,
        NETWORK_NAME,
        CHAIN_ID
      );

      expect(config.diamondName).to.equal('NonExistentDiamond');
      expect(config.contractsPath).to.include('contracts');
      expect(config.deploymentsPath).to.include('diamonds');
      expect(config.configFilePath).to.include('diamonds/NonExistentDiamond/nonexistentdiamond.config.json');
    });
  });

  describe('Full Deployment with Dual Configuration', () => {
    it('should deploy diamond using standalone JSON configuration', async function () {
      // Use the ConfigurationResolver to get config
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
      const resolvedConfig = await ConfigurationResolver.resolveDiamondConfig(
        DIAMOND_NAME,
        configPath,
        NETWORK_NAME,
        CHAIN_ID
      );

      // Ensure directory structure exists
      await ConfigurationResolver.ensureDirectoryStructure(resolvedConfig);

      // Create repository and diamond using resolved config
      const repository = new FileDeploymentRepository(resolvedConfig);
      const diamond = new Diamond(resolvedConfig, repository);

      // Set provider and signer
      diamond.setProvider((hre as any).ethers.provider);
      diamond.setSigner(deployer);

      // Mock ethers.getContractFactory for this test
      const originalGetContractFactory = (hre as any).ethers.getContractFactory;
      // @ts-ignore
      (hre as any).ethers.getContractFactory = async (name: string) => {
        // Simple mock that returns a deployable contract
        return {
          deploy: async () => ({
            address: '0x' + Math.random().toString(16).substring(2, 42).padStart(40, '0'),
            deployed: async () => ({}),
            deployTransaction: { hash: '0x' + Math.random().toString(16).substring(2) },
            interface: {
              functions: {},
              getSighash: () => '0x12345678'
            }
          }),
          interface: {
            functions: {},
            getSighash: () => '0x12345678'
          }
        };
      };

      try {
        // Create strategy and deployer
        const strategy = new LocalDeploymentStrategy();
        const diamondDeployer = new DiamondDeployer(diamond, strategy);

        // Deploy the diamond
        await diamondDeployer.deployDiamond();

        // Verify deployment succeeded
        const deployedData = diamond.getDeployedDiamondData();
        expect(deployedData.DiamondAddress).to.not.be.empty;

        // Verify the configuration was used correctly
        expect(diamond.diamondName).to.equal(DIAMOND_NAME);
        expect(diamond.networkName).to.equal(NETWORK_NAME);
        expect(diamond.chainId).to.equal(CHAIN_ID);

      } finally {
        // Restore original function
        (hre as any).ethers.getContractFactory = originalGetContractFactory;
      }
    });
  });

  describe('Configuration Priority', () => {
    it('should prioritize provided config path over defaults', async function () {
      const customConfigPath = path.join(TEMP_DIR, 'custom-config.json');

      // Create a custom config file
      await fs.writeJson(customConfigPath, {
        protocolVersion: 0.0,
        facets: {
          TestFacet: {
            priority: 30,
            versions: { "0.0": {} }
          }
        }
      });

      const config = await ConfigurationResolver.resolveDiamondConfig(
        DIAMOND_NAME,
        customConfigPath,
        NETWORK_NAME,
        CHAIN_ID
      );

      expect(config.configFilePath).to.equal(customConfigPath);
    });
  });
});
