import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Diamond } from '../../src/core/Diamond';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { DiamondDeployer } from '../../src/core/DiamondDeployer';
import { LocalDeploymentStrategy } from '../../src/strategies/LocalDeploymentStrategy';
import { DiamondConfig } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import sinon from 'sinon';

describe('Integration: LocalDeploymentStrategy', function () {
  // This test might take longer due to contract deployments
  this.timeout(30000);

  // Test constants
  const TEMP_DIR = path.join(__dirname, '../../.tmp-test-integration');
  const DIAMOND_NAME = 'TestDiamond';
  const NETWORK_NAME = 'hardhat';
  const CHAIN_ID = 31337;

  // Test variables
  let config: DiamondConfig;
  let repository: FileDeploymentRepository;
  let diamond: Diamond;
  let deployer: SignerWithAddress;
  let accounts: SignerWithAddress[];
  let diamondCutFacet: Contract;
  let diamondLoupeFacet: Contract;
  let testFacet: Contract;
  let mockDiamond: Contract;

  before(async function () {
    // Set up test environment
    const setup = await setupTestEnvironment(TEMP_DIR, DIAMOND_NAME, NETWORK_NAME, CHAIN_ID);

    deployer = setup.deployer;
    accounts = setup.accounts;
    diamondCutFacet = setup.diamondCutFacet;
    diamondLoupeFacet = setup.diamondLoupeFacet;
    testFacet = setup.testFacet;
    mockDiamond = setup.diamond;

    // Spy on console.log for assertions
    sinon.spy(console, 'log');
  });

  beforeEach(async function () {
    // Set up a fresh config and repository for each test
    config = {
      diamondName: DIAMOND_NAME,
      networkName: NETWORK_NAME,
      chainId: CHAIN_ID,
      deploymentsPath: TEMP_DIR,
      contractsPath: 'contracts', // This will be mocked
      callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
      configFilePath: path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
      deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`)
    };

    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);

    // Set provider and signer
    diamond.setProvider(ethers.provider);
    diamond.setSigner(deployer);

    // Reset sinon spies
    sinon.resetHistory();
  });

  after(async function () {
    // Clean up temp directory
    await cleanupTestEnvironment(TEMP_DIR);
    // Restore console.log
    (console.log as sinon.SinonSpy).restore();
  });

  // Mock function to simulate contract deployments
  async function mockContractFactory(name: string) {
    if (name === 'DiamondCutFacet' || name === 'MockDiamondCutFacet') {
      return {
        deploy: async () => diamondCutFacet,
        connect: () => ({ deploy: async () => diamondCutFacet })
      };
    } else if (name === 'DiamondLoupeFacet' || name === 'MockDiamondLoupeFacet') {
      return {
        deploy: async () => diamondLoupeFacet,
        connect: () => ({ deploy: async () => diamondLoupeFacet })
      };
    } else if (name === 'TestFacet' || name === 'MockTestFacet') {
      return {
        deploy: async () => testFacet,
        connect: () => ({ deploy: async () => testFacet })
      };
    } else if (name.includes(DIAMOND_NAME) || name.includes('Mock' + DIAMOND_NAME)) {
      return {
        deploy: async () => mockDiamond,
        connect: () => ({ deploy: async () => mockDiamond })
      };
    }
    throw new Error(`Unexpected contract name: ${name}`);
  }

  describe('End-to-end deployment', () => {
    it('should deploy a diamond with facets using LocalDeploymentStrategy', async function () {
      // Mock ethers.getContractFactory
      const originalGetContractFactory = ethers.getContractFactory;
      // @ts-ignore - We need to mock this
      ethers.getContractFactory = mockContractFactory;

      try {
        // Create strategy
        const strategy = new LocalDeploymentStrategy();

        // Create deployer
        const deployer = new DiamondDeployer(diamond, strategy);

        // Deploy the diamond
        await deployer.deployDiamond();

        // Verify deployment succeeded
        const deployedData = diamond.getDeployedDiamondData();

        // Diamond address should be set
        expect(deployedData.DiamondAddress).to.not.be.empty;

        // TODO Fix this test 
        // // Deployer address should match our signer
        // expect(deployedData.DeployerAddress.toLowerCase()).to.equal(deployer.address.toLowerCase());

        // Should have deployed facets
        expect(deployedData.DeployedFacets).to.have.keys(['DiamondCutFacet', 'DiamondLoupeFacet', 'TestFacet']);

        // Should have run callback
        expect((console.log as sinon.SinonSpy).calledWith(sinon.match(/Running test callback/))).to.be.true;

      } finally {
        // Restore original function
        ethers.getContractFactory = originalGetContractFactory;
      }
    });

    it('should handle facet upgrades correctly', async function () {
      // First deploy the diamond
      // Mock ethers.getContractFactory
      const originalGetContractFactory = ethers.getContractFactory;
      // @ts-ignore - We need to mock this
      ethers.getContractFactory = mockContractFactory;

      try {
        // Create and deploy with initial strategy
        const initialStrategy = new LocalDeploymentStrategy();
        const initialDeployer = new DiamondDeployer(diamond, initialStrategy);
        await initialDeployer.deployDiamond();

        // Get initial deployment data
        const initialData = diamond.getDeployedDiamondData();

        // Now simulate an upgrade
        // Create new facet version
        const config = repository.loadDeployConfig();
        if (!config.facets.TestFacet.versions) {
          config.facets.TestFacet.versions = {} as Record<number, any>;
        }
        config.facets.TestFacet.versions[1.0] = {
          deployInit: "initialize()",
          upgradeInit: "reinitialize()",
          callbacks: ["testCallback"],
          deployInclude: [],
          deployExclude: []
        };

        // Write updated config
        await fs.writeJson(
          path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
          config,
          { spaces: 2 }
        );

        // Create new strategy and deployer for upgrade
        const upgradeStrategy = new LocalDeploymentStrategy();
        const upgradeDeployer = new DiamondDeployer(diamond, upgradeStrategy);

        // Perform upgrade
        await upgradeDeployer.deployDiamond();

        // Get upgraded deployment data
        const upgradedData = diamond.getDeployedDiamondData();

        // Diamond address should be the same
        expect(upgradedData.DiamondAddress).to.equal(initialData.DiamondAddress);

        // TestFacet should be updated
        expect(upgradedData.DeployedFacets?.TestFacet.version).to.equal(1.0);

        // Callback should have been called again
        expect((console.log as sinon.SinonSpy).calledWith(sinon.match(/Running test callback/))).to.be.true;

      } finally {
        // Restore original function
        ethers.getContractFactory = originalGetContractFactory;
      }
    });
  });
});