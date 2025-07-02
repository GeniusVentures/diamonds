// test/integration/performance/benchmark.test.ts
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
import { LocalDeploymentStrategy } from '../../../src/strategies/LocalDeploymentStrategy';
import { DiamondConfig } from '../../../src/types/config';

import {
  createDefenderMocks,
  setupBatchOperationMocks,
  MockDefenderClients
} from '../defender/setup/defender-setup';

interface BenchmarkResult {
  strategy: string;
  operation: string;
  facetCount: number;
  duration: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    peak: number;
  };
  txCount: number;
  proposalCount?: number;
}

describe('Performance Benchmarks', function () {
  this.timeout(300000); // 5 minutes for performance tests

  const TEMP_DIR = path.join(__dirname, '../../.tmp-benchmark');
  const DIAMOND_NAME = 'BenchmarkDiamond';

  let signers: SignerWithAddress[];
  let benchmarkResults: BenchmarkResult[] = [];

  before(async function () {
    await fs.ensureDir(TEMP_DIR);
    signers = await ethers.getSigners();

    // Setup performance monitoring
    if (global.gc) {
      global.gc();
    }
  });

  after(async function () {
    await fs.remove(TEMP_DIR);
    sinon.restore();

    // Output benchmark results
    console.log('\n📊 PERFORMANCE BENCHMARK RESULTS:');
    console.log('='.repeat(80));

    benchmarkResults.forEach(result => {
      const memoryDelta = (result.memoryUsage.after.heapUsed - result.memoryUsage.before.heapUsed) / 1024 / 1024;
      console.log(`${result.strategy} - ${result.operation}:`);
      console.log(`  Facets: ${result.facetCount}`);
      console.log(`  Duration: ${result.duration}ms`);
      console.log(`  Memory Delta: ${memoryDelta.toFixed(2)}MB`);
      console.log(`  Peak Memory: ${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Transactions: ${result.txCount}`);
      if (result.proposalCount !== undefined) {
        console.log(`  Proposals: ${result.proposalCount}`);
      }
      console.log('');
    });
  });

  async function runBenchmark(
    strategy: string,
    operation: string,
    facetCount: number,
    strategyInstance: any,
    config: DiamondConfig
  ): Promise<BenchmarkResult> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memoryBefore = process.memoryUsage();
    let peakMemory = memoryBefore.heapUsed;

    // Monitor peak memory usage
    const memoryMonitor = setInterval(() => {
      const current = process.memoryUsage().heapUsed;
      if (current > peakMemory) {
        peakMemory = current;
      }
    }, 100);

    const repository = new FileDeploymentRepository(config);
    const diamond = new Diamond(config, repository);
    diamond.setProvider(ethers.provider);
    diamond.setSigner(signers[0]);

    const deployer = new DiamondDeployer(diamond, strategyInstance);

    const startTime = Date.now();

    if (operation === 'deploy' || operation === 'upgrade') {
      await deployer.deployDiamond();
    }

    const endTime = Date.now();
    clearInterval(memoryMonitor);

    const memoryAfter = process.memoryUsage();

    // Count transactions and proposals
    let txCount = 0;
    let proposalCount = 0;

    if (strategy === 'Defender') {
      const mocks = (global as any).defenderMocks as any;
      if (mocks?.adminClient?.createProposal?.callCount) {
        proposalCount = mocks.adminClient.createProposal.callCount;
      }
      if (mocks?.mockDeployClient?.deployContract?.callCount) {
        txCount = mocks.mockDeployClient.deployContract.callCount;
      }
    } else {
      // For local deployment, estimate tx count based on facets
      txCount = facetCount + 1; // One per facet + diamond cut
    }

    const result: BenchmarkResult = {
      strategy,
      operation,
      facetCount,
      duration: endTime - startTime,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: peakMemory
      },
      txCount,
      proposalCount: strategy === 'Defender' ? proposalCount : undefined
    };

    benchmarkResults.push(result);
    return result;
  }

  function createBenchmarkConfig(facetCount: number, networkName: string = 'hardhat'): DiamondConfig {
    const config: DiamondConfig = {
      diamondName: DIAMOND_NAME,
      networkName,
      chainId: networkName === 'hardhat' ? 31337 : 1,
      deploymentsPath: TEMP_DIR,
      contractsPath: 'contracts',
      writeDeployedDiamondData: true
    };

    // Create facets configuration
    const facetsConfig: any = {
      version: 1,
      protocolVersion: 1,
      protocolInitFacet: 'ProtocolInitFacet',
      facets: {} as any
    };

    for (let i = 1; i <= facetCount; i++) {
      (facetsConfig.facets as any)[`BenchmarkFacet${i}`] = {
        priority: i * 100,
        versions: {
          1: {
            deployInit: i === 1 ? 'initialize()' : undefined,
            upgradeInit: i === 1 ? 'upgrade()' : undefined,
            deployInclude: i % 3 === 0 ? [`selector${i}_1`, `selector${i}_2`] : undefined,
            deployExclude: i % 5 === 0 ? [`selector${i}_3`] : undefined
          }
        }
      };
    }

    // Write configuration
    const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeJsonSync(configPath, facetsConfig, { spaces: 2 });

    return config;
  }

  describe('Local Deployment Strategy Benchmarks', function () {
    const facetCounts = [1, 5, 10, 20];

    facetCounts.forEach(facetCount => {
      it(`should benchmark local deployment with ${facetCount} facets`, async function () {
        const config = createBenchmarkConfig(facetCount);
        const strategy = new LocalDeploymentStrategy(true);

        const result = await runBenchmark('Local', 'deploy', facetCount, strategy, config);

        // Performance assertions
        expect(result.duration).to.be.lessThan(60000); // Should complete within 1 minute
        expect(result.memoryUsage.peak - result.memoryUsage.before.heapUsed).to.be.lessThan(100 * 1024 * 1024); // Less than 100MB
      });

      it(`should benchmark local upgrade with ${facetCount} facets`, async function () {
        const config = createBenchmarkConfig(facetCount);

        // Create existing deployment
        const deploymentPath = path.join(
          TEMP_DIR,
          DIAMOND_NAME,
          'deployments',
          `${DIAMOND_NAME.toLowerCase()}-hardhat-31337.json`
        );
        fs.ensureDirSync(path.dirname(deploymentPath));

        const existingDeployment: any = {
          DiamondAddress: '0x1234567890123456789012345678901234567890',
          DiamondCutAddress: '0x2345678901234567890123456789012345678901',
          OwnershipAddress: '0x3456789012345678901234567890123456789012',
          LoupeAddress: '0x4567890123456789012345678901234567890123',
          DeployedFacets: {} as any
        };

        for (let i = 1; i <= facetCount; i++) {
          (existingDeployment.DeployedFacets as any)[`BenchmarkFacet${i}`] = {
            address: `0x${i.toString(16).padStart(40, '0')}`,
            tx_hash: `0x${i.toString(16).padStart(64, '0')}`,
            version: 1,
            funcSelectors: [`0x${i.toString(16).padStart(8, '0')}`]
          };
        }

        fs.writeJsonSync(deploymentPath, existingDeployment);

        const strategy = new LocalDeploymentStrategy(true);
        const result = await runBenchmark('Local', 'upgrade', facetCount, strategy, config);

        // Upgrade should be faster than initial deployment
        expect(result.duration).to.be.lessThan(30000); // Should complete within 30 seconds
      });
    });
  });

  describe('Defender Deployment Strategy Benchmarks', function () {
    const facetCounts = [1, 5, 10, 15];

    beforeEach(function () {
      // Setup Defender mocks for benchmarking
      const mocks = setupBatchOperationMocks();
      (global as any).defenderMocks = mocks;
    });

    facetCounts.forEach(facetCount => {
      it(`should benchmark Defender deployment with ${facetCount} facets`, async function () {
        const config = createBenchmarkConfig(facetCount, 'mainnet');
        const strategy = new OZDefenderDeploymentStrategy(
          'benchmark-api-key',
          'benchmark-secret',
          signers[0].address,
          true, // Auto-approve for faster benchmarking
          signers[1].address,
          'EOA',
          true
        );

        const result = await runBenchmark('Defender', 'deploy', facetCount, strategy, config);

        // Defender should handle larger deployments efficiently
        expect(result.duration).to.be.lessThan(120000); // Should complete within 2 minutes
        expect(result.proposalCount).to.be.greaterThan(facetCount); // Should create proposals for each facet
      });

      it(`should benchmark Defender upgrade with ${facetCount} facets`, async function () {
        const config = createBenchmarkConfig(facetCount, 'mainnet');

        // Create existing deployment
        const deploymentPath = path.join(
          TEMP_DIR,
          DIAMOND_NAME,
          'deployments',
          `${DIAMOND_NAME.toLowerCase()}-mainnet-1.json`
        );
        fs.ensureDirSync(path.dirname(deploymentPath));

        const existingDeployment: any = {
          DiamondAddress: '0x1234567890123456789012345678901234567890',
          DiamondCutAddress: '0x2345678901234567890123456789012345678901',
          OwnershipAddress: '0x3456789012345678901234567890123456789012',
          LoupeAddress: '0x4567890123456789012345678901234567890123',
          DeployedFacets: {} as any
        };

        for (let i = 1; i <= facetCount; i++) {
          (existingDeployment.DeployedFacets as any)[`BenchmarkFacet${i}`] = {
            address: `0x${i.toString(16).padStart(40, '0')}`,
            tx_hash: `0x${i.toString(16).padStart(64, '0')}`,
            version: 1,
            funcSelectors: [`0x${i.toString(16).padStart(8, '0')}`]
          };
        }

        fs.writeJsonSync(deploymentPath, existingDeployment);

        const strategy = new OZDefenderDeploymentStrategy(
          'benchmark-api-key',
          'benchmark-secret',
          signers[0].address,
          true,
          signers[1].address,
          'EOA',
          true
        );

        const result = await runBenchmark('Defender', 'upgrade', facetCount, strategy, config);

        // Defender upgrades should be efficient
        expect(result.duration).to.be.lessThan(90000); // Should complete within 1.5 minutes
      });
    });
  });

  describe('Memory Efficiency Tests', function () {
    it('should handle very large diamond configurations efficiently', async function () {
      const LARGE_FACET_COUNT = 50;
      const config = createBenchmarkConfig(LARGE_FACET_COUNT);

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();

      const repository = new FileDeploymentRepository(config);
      const diamond = new Diamond(config, repository);

      const afterLoadMemory = process.memoryUsage();
      const memoryDelta = afterLoadMemory.heapUsed - initialMemory.heapUsed;

      // Should not use excessive memory for large configs
      expect(memoryDelta).to.be.lessThan(50 * 1024 * 1024); // Less than 50MB

      // Verify all facets were loaded
      const deployConfig = diamond.getDeployConfig();
      expect(Object.keys(deployConfig.facets)).to.have.length(LARGE_FACET_COUNT);
    });

    it('should efficiently handle repeated diamond instantiations', async function () {
      const config = createBenchmarkConfig(10);

      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();

      // Create multiple diamond instances
      const diamonds = [];
      for (let i = 0; i < 20; i++) {
        const repository = new FileDeploymentRepository(config);
        const diamond = new Diamond(config, repository);
        diamonds.push(diamond);
      }

      const finalMemory = process.memoryUsage();
      const totalMemoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerDiamond = totalMemoryDelta / diamonds.length;

      // Each diamond instance should use reasonable memory
      expect(memoryPerDiamond).to.be.lessThan(5 * 1024 * 1024); // Less than 5MB per instance

      // Cleanup
      diamonds.length = 0;
    });
  });

  describe('Throughput Tests', function () {
    it('should handle concurrent deployment operations', async function () {
      const concurrentCount = 5;
      const facetCount = 5;

      const configs = Array.from({ length: concurrentCount }, (_, i) => ({
        ...createBenchmarkConfig(facetCount),
        diamondName: `ConcurrentDiamond${i}`
      }));

      // Setup mocks for concurrent operations
      const mocks = setupBatchOperationMocks();
      (global as any).defenderMocks = mocks;

      const startTime = Date.now();

      // Run deployments concurrently
      const deploymentPromises = configs.map(async (config, index) => {
        const strategy = new OZDefenderDeploymentStrategy(
          'concurrent-api-key',
          'concurrent-secret',
          signers[0].address,
          true,
          signers[1].address,
          'EOA',
          true
        );

        const repository = new FileDeploymentRepository(config);
        const diamond = new Diamond(config, repository);
        diamond.setProvider(ethers.provider);
        diamond.setSigner(signers[0]);

        const deployer = new DiamondDeployer(diamond, strategy);
        return deployer.deployDiamond();
      });

      await Promise.all(deploymentPromises);

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Concurrent operations should be more efficient than sequential
      const sequentialEstimate = concurrentCount * 20000; // 20 seconds per deployment
      expect(totalDuration).to.be.lessThan(sequentialEstimate * 0.7); // At least 30% faster

      console.log(`Concurrent deployment of ${concurrentCount} diamonds took ${totalDuration}ms`);
    });
  });

  describe('Scalability Tests', function () {
    it('should maintain performance with increasing facet complexity', async function () {
      const complexityLevels = [
        { facets: 5, selectorsPerFacet: 10 },
        { facets: 10, selectorsPerFacet: 20 },
        { facets: 15, selectorsPerFacet: 30 },
        { facets: 20, selectorsPerFacet: 40 }
      ];

      const results = [];

      for (const level of complexityLevels) {
        const config = createBenchmarkConfig(level.facets);

        // Create complex facet configuration
        const complexConfig = JSON.parse(fs.readFileSync(
          path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
          'utf8'
        ));

        // Add complex selector configurations
        Object.values(complexConfig.facets).forEach((facet: any, index) => {
          const selectors = [];
          for (let i = 0; i < level.selectorsPerFacet; i++) {
            selectors.push(`0x${index.toString(16).padStart(2, '0')}${i.toString(16).padStart(6, '0')}`);
          }
          facet.versions[1].deployInclude = selectors.slice(0, level.selectorsPerFacet / 2);
          facet.versions[1].deployExclude = selectors.slice(-2);
        });

        fs.writeJsonSync(
          path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
          complexConfig,
          { spaces: 2 }
        );

        const strategy = new LocalDeploymentStrategy(true);
        const result = await runBenchmark('Local-Complex', 'deploy', level.facets, strategy, config);

        results.push({
          complexity: level.facets * level.selectorsPerFacet,
          duration: result.duration,
          memory: result.memoryUsage.peak - result.memoryUsage.before.heapUsed
        });
      }

      // Verify performance scales reasonably
      for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const previous = results[i - 1];

        const complexityRatio = current.complexity / previous.complexity;
        const durationRatio = current.duration / previous.duration;

        // Duration should not increase exponentially with complexity
        expect(durationRatio).to.be.lessThan(complexityRatio * 1.5);
      }

      console.log('Scalability test results:', results);
    });
  });
});
