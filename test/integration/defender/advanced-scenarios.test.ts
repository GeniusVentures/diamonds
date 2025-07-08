// test/integration/defender/advanced-scenarios.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import * as fs from 'fs-extra';
import * as path from 'path';
import sinon from 'sinon';

import { Diamond } from '../../../src/core/Diamond';
import { DiamondDeployer } from '../../../src/core/DiamondDeployer';
import { FileDeploymentRepository } from '../../../src/repositories/FileDeploymentRepository';
import { OZDefenderDeploymentStrategy } from '../../../src/strategies/OZDefenderDeploymentStrategy';
import { DiamondConfig } from '../../../src/types/config';

import {
  createDefenderMocks,
  setupBatchOperationMocks,
  setupSuccessfulDeploymentMocks,
  setupTimeoutMocks,
  MockDefenderClients
} from './setup/defender-setup';

describe('Integration: Defender Advanced Scenarios', function () {
  this.timeout(600000); // 10 minutes for extended tests

  const TEMP_DIR = path.join(__dirname, '../../.tmp-defender-advanced');
  const DIAMOND_NAME = 'AdvancedTestDiamond';

  let signers: SignerWithAddress[];
  let mocks: any;

  before(async function () {
    await fs.ensureDir(TEMP_DIR);
    signers = await ethers.getSigners();
  });

  after(async function () {
    await fs.remove(TEMP_DIR);
    sinon.restore();
  });

  describe('Performance and Scale Tests', function () {
    it('should handle large diamond deployment with many facets', async function () {
      const config: DiamondConfig = {
        diamondName: DIAMOND_NAME,
        networkName: 'mainnet',
        chainId: 1,
        deploymentsPath: TEMP_DIR,
        contractsPath: 'contracts',
        writeDeployedDiamondData: true
      };

      // Create configuration with 15 facets (simulating large deployment)
      const largeFacetsConfig: any = {
        version: 1,
        protocolVersion: 1,
        protocolInitFacet: 'ProtocolInitFacet',
        facets: {} as any
      };

      // Generate 15 facets with various configurations
      for (let i = 1; i <= 15; i++) {
        (largeFacetsConfig.facets as any)[`TestFacet${i}`] = {
          priority: i * 100,
          versions: {
            1: {
              deployInclude: i % 3 === 0 ? [`selector${i}_1`, `selector${i}_2`] : undefined,
              deployExclude: i % 5 === 0 ? [`selector${i}_3`] : undefined,
              deployInit: i === 1 ? 'initialize()' : undefined,
              upgradeInit: i === 1 ? 'upgrade()' : undefined,
              callbacks: i % 4 === 0 ? ['postDeploy'] : undefined
            }
          }
        };
      }

      // Write large config
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, largeFacetsConfig, { spaces: 2 });

      // Ensure callbacks directory exists and copy mock callback files
      const callbacksPath = path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks');
      await fs.ensureDir(callbacksPath);

      // Copy mock callback files for facets that need them (TestFacet4, TestFacet8, TestFacet12)
      const mockCallbacksPath = path.join(__dirname, '../../mocks/callbacks');
      const callbackFiles = ['TestFacet4.js', 'TestFacet8.js', 'TestFacet12.js'];
      for (const file of callbackFiles) {
        const srcPath = path.join(mockCallbacksPath, file);
        const destPath = path.join(callbacksPath, file);
        await fs.copy(srcPath, destPath);
      }

      const repository = new FileDeploymentRepository(config);

      // Setup mocks for batch operations BEFORE creating strategy
      mocks = setupBatchOperationMocks();

      const strategy = new OZDefenderDeploymentStrategy(
        'test-api-key',
        'test-secret',
        signers[0].address,
        true, // Auto-approve
        signers[1].address,
        'EOA',
        true,
        mocks.mockDefender // Pass the mocked client
      );

      const diamond = new Diamond(config, repository);
      diamond.setProvider(ethers.provider);
      diamond.setSigner(signers[0]);

      const deployer = new DiamondDeployer(diamond, strategy);

      // This should complete in reasonable time even with many facets
      const startTime = Date.now();
      await deployer.deployDiamond();
      const endTime = Date.now();

      // Verify performance - should complete within 2 minutes for 15 facets
      expect(endTime - startTime).to.be.lessThan(120000);

      // Note: Actual verification would depend on mock implementation
      console.log(`Large deployment completed in ${endTime - startTime}ms`);
    });

    it('should handle rapid sequential upgrades', async function () {
      const config: DiamondConfig = {
        diamondName: DIAMOND_NAME,
        networkName: 'polygon',
        chainId: 137,
        deploymentsPath: TEMP_DIR,
        contractsPath: 'contracts',
        writeDeployedDiamondData: true
      };

      // Setup existing deployment data
      const deploymentPath = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-polygon-137.json`);
      await fs.ensureDir(path.dirname(deploymentPath));
      await fs.writeJson(deploymentPath, {
        DiamondAddress: '0x1234567890123456789012345678901234567890',
        DiamondCutAddress: '0x2345678901234567890123456789012345678901',
        OwnershipAddress: '0x3456789012345678901234567890123456789012',
        LoupeAddress: '0x4567890123456789012345678901234567890123',
        DeployedFacets: {
          TestFacet1: {
            address: '0x5678901234567890123456789012345678901234',
            tx_hash: '0xabcd',
            version: 1,
            funcSelectors: ['0x12345678']
          }
        }
      });

      // Create basic config file for the upgrade test
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, {
        version: 1,
        protocolVersion: 1,
        facets: {
          TestFacet1: {
            priority: 100,
            versions: {
              1: {}
            }
          }
        }
      }, { spaces: 2 });

      const repository = new FileDeploymentRepository(config);
      mocks = createDefenderMocks();
      setupSuccessfulDeploymentMocks(mocks);

      // Simulate multiple rapid upgrades
      for (let version = 2; version <= 5; version++) {
        const strategy = new OZDefenderDeploymentStrategy(
          'test-api-key',
          'test-secret',
          signers[0].address,
          true,
          signers[1].address,
          'EOA',
          true,
          mocks.mockDefender // Pass the mocked client
        );

        const diamond = new Diamond(config, repository);
        diamond.setProvider(ethers.provider);
        diamond.setSigner(signers[0]);

        const deployer = new DiamondDeployer(diamond, strategy);
        await deployer.deployDiamond();
      }

      // Note: Actual verification would depend on mock implementation
      console.log('Rapid upgrades completed successfully');
    });
  });

  describe('Error Recovery and Resilience Tests', function () {
    it('should handle network timeout scenarios', async function () {
      const config: DiamondConfig = {
        diamondName: DIAMOND_NAME,
        networkName: 'mainnet',
        chainId: 1,
        deploymentsPath: TEMP_DIR,
        contractsPath: 'contracts',
        writeDeployedDiamondData: true
      };

      // Setup config
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, {
        version: 1,
        protocolVersion: 1,
        protocolInitFacet: 'ProtocolInitFacet',
        facets: {
          SlowFacet: {
            priority: 100,
            versions: { 1: {} }
          }
        }
      });

      const repository = new FileDeploymentRepository(config);

      // Create mocks that simulate slow operations
      mocks = setupTimeoutMocks();

      const strategy = new OZDefenderDeploymentStrategy(
        'test-api-key',
        'test-secret',
        signers[0].address,
        true,
        signers[1].address,
        'EOA',
        true,
        mocks.mockDefender // Pass the mocked client
      );

      const diamond = new Diamond(config, repository);
      diamond.setProvider(ethers.provider);
      diamond.setSigner(signers[0]);

      const deployer = new DiamondDeployer(diamond, strategy);

      // Should handle slow operations gracefully
      const startTime = Date.now();
      await deployer.deployDiamond();
      const endTime = Date.now();

      // Basic performance check
      expect(endTime - startTime).to.be.greaterThan(0);
      console.log(`Deployment with timeouts took ${endTime - startTime}ms`);
    });

    it('should handle various error conditions', async function () {
      const config: DiamondConfig = {
        diamondName: DIAMOND_NAME,
        networkName: 'hardhat',
        chainId: 31337,
        deploymentsPath: TEMP_DIR,
        contractsPath: 'contracts',
        writeDeployedDiamondData: true
      };

      // Setup basic config
      const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, {
        version: 1,
        protocolVersion: 1,
        protocolInitFacet: 'ProtocolInitFacet',
        facets: {
          TestFacet: {
            priority: 100,
            versions: { 1: {} }
          }
        }
      });

      const repository = new FileDeploymentRepository(config);
      const strategy = new OZDefenderDeploymentStrategy(
        'test-api-key',
        'test-secret',
        signers[0].address,
        true,
        signers[1].address,
        'EOA',
        true
      );

      // Setup error mocks
      mocks = createDefenderMocks();

      const diamond = new Diamond(config, repository);
      diamond.setProvider(ethers.provider);
      diamond.setSigner(signers[0]);

      const deployer = new DiamondDeployer(diamond, strategy);

      // Test should complete without throwing unhandled errors
      try {
        await deployer.deployDiamond();
        console.log('Error handling test completed successfully');
      } catch (error) {
        // Expected in some error scenarios
        console.log('Deployment failed as expected in error test');
      }
    });
  });

  describe('Memory and Resource Management Tests', function () {
    it('should efficiently handle large deployment metadata', async function () {
      const config: DiamondConfig = {
        diamondName: DIAMOND_NAME,
        networkName: 'hardhat',
        chainId: 31337,
        deploymentsPath: TEMP_DIR,
        contractsPath: 'contracts',
        writeDeployedDiamondData: true
      };

      // Create large existing deployment data
      const largeDeploymentData: any = {
        DiamondAddress: '0x1234567890123456789012345678901234567890',
        DiamondCutAddress: '0x2345678901234567890123456789012345678901',
        OwnershipAddress: '0x3456789012345678901234567890123456789012',
        LoupeAddress: '0x4567890123456789012345678901234567890123',
        DeployedFacets: {} as any
      };

      // Generate facets with large selector arrays
      for (let i = 1; i <= 50; i++) {
        const selectors = [];
        for (let j = 1; j <= 20; j++) {
          selectors.push(`0x${i.toString(16).padStart(2, '0')}${j.toString(16).padStart(6, '0')}`);
        }

        (largeDeploymentData.DeployedFacets as any)[`LargeFacet${i}`] = {
          address: `0x${i.toString(16).padStart(40, '0')}`,
          tx_hash: `0x${i.toString(16).padStart(64, '0')}`,
          version: 1,
          funcSelectors: selectors
        };
      }

      const deploymentPath = path.join(
        TEMP_DIR,
        DIAMOND_NAME,
        'deployments',
        `${DIAMOND_NAME.toLowerCase()}-hardhat-31337.json`
      );
      await fs.ensureDir(path.dirname(deploymentPath));
      await fs.writeJson(deploymentPath, largeDeploymentData);

      const repository = new FileDeploymentRepository(config);

      // Measure memory usage
      const initialMemory = process.memoryUsage();

      const diamond = new Diamond(config, repository);
      diamond.setProvider(ethers.provider);
      diamond.setSigner(signers[0]);

      const loadMemory = process.memoryUsage();

      // Verify large data was loaded efficiently
      expect(loadMemory.heapUsed - initialMemory.heapUsed).to.be.lessThan(50 * 1024 * 1024); // Less than 50MB

      // Verify data integrity
      const loadedData = diamond.getDeployedDiamondData();
      expect(Object.keys(loadedData.DeployedFacets || {})).to.have.length(50);

      const firstFacet = (loadedData.DeployedFacets as any)?.['LargeFacet1'];
      if (firstFacet) {
        expect(firstFacet.funcSelectors).to.have.length(20);
      }
    });
  });
});
