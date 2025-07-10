import { expect } from 'chai';
import hre from "hardhat";;
import { Diamond } from '../../../src/core/Diamond';
import { FileDeploymentRepository } from '../../../src/repositories/FileDeploymentRepository';
import { DiamondConfig, RegistryFacetCutAction } from '../../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import sinon from 'sinon';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { JsonRpcProvider } from '@ethersproject/providers';

describe('Diamond', () => {
  // Test constants
  const TEMP_DIR = path.join(__dirname, '../../../.tmp-test');
  const DIAMOND_NAME = 'TestDiamond';
  const NETWORK_NAME = 'hardhat';
  const CHAIN_ID = 31337;

  // Test variables
  let diamond: Diamond;
  let config: DiamondConfig;
  let repository: FileDeploymentRepository;
  let signers: HardhatEthersSigner[];
  let provider: JsonRpcProvider;

  before(async () => {
    // Create temporary directories for test artifacts
    await fs.ensureDir(TEMP_DIR);
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));

    // Create a sample config
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
              callbacks: ["testCallback"]
            }
          }
        }
      }
    };

    await fs.writeJson(
      path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
      sampleConfig,
      { spaces: 2 }
    );

    // Get hardhat signers and provider
    signers = await (hre as any).ethers.getSigners();
    provider = (hre as any).ethers.provider;
  });

  beforeEach(async () => {
    // Clean up any existing deployment files to ensure clean state
    const deploymentFile = path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`);
    if (await fs.pathExists(deploymentFile)) {
      await fs.remove(deploymentFile);
    }

    // Set up a new config and repository for each test
    config = {
      diamondName: DIAMOND_NAME,
      networkName: NETWORK_NAME,
      chainId: CHAIN_ID,
      deploymentsPath: TEMP_DIR,
      contractsPath: 'contracts',
      callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
      configFilePath: path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`),
      deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-${NETWORK_NAME}-${CHAIN_ID}.json`)
    };

    repository = new FileDeploymentRepository(config);
    diamond = new Diamond(config, repository);
  });

  after(async () => {
    // Clean up temp directory after tests
    await fs.remove(TEMP_DIR);
  });

  describe('initialization', () => {
    it('should initialize with the correct config values', () => {
      expect(diamond.diamondName).to.equal(DIAMOND_NAME);
      expect(diamond.networkName).to.equal(NETWORK_NAME);
      expect(diamond.chainId).to.equal(CHAIN_ID);
      expect(diamond.deploymentsPath).to.equal(TEMP_DIR);
      expect(diamond.contractsPath).to.equal('contracts');
    });

    it('should load the deployment config from the repository', () => {
      const deployConfig = diamond.getDeployConfig();
      expect(deployConfig.protocolVersion).to.equal(0);
      expect(deployConfig.facets).to.have.keys(['DiamondCutFacet', 'DiamondLoupeFacet', 'TestFacet']);
    });

    it('should initialize an empty function selector registry for a new diamond', () => {
      expect(diamond.functionSelectorRegistry.size).to.equal(0);
    });
  });

  describe('provider and signer management', () => {
    it('should set and get provider', () => {
      diamond.setProvider(provider);
      expect(diamond.getProvider()).to.equal(provider);
    });

    it('should set and get signer', () => {
      const signer = signers[0];
      diamond.setSigner(signer);
      expect(diamond.getSigner()).to.equal(signer);
    });
  });

  describe('function selector registry', () => {
    it('should register function selectors', () => {
      const selector = '0x12345678';
      diamond.registerFunctionSelectors({
        [selector]: {
          facetName: 'TestFacet',
          priority: 100,
          address: '0x1234567890123456789012345678901234567890',
          action: RegistryFacetCutAction.Add
        }
      });

      expect(diamond.isFunctionSelectorRegistered(selector)).to.be.true;
      const entry = diamond.functionSelectorRegistry.get(selector);
      expect(entry?.facetName).to.equal('TestFacet');
      expect(entry?.priority).to.equal(100);
      expect(entry?.action).to.equal(RegistryFacetCutAction.Add);
    });

    it('should update function selectors', () => {
      const selector = '0x12345678';
      diamond.registerFunctionSelectors({
        [selector]: {
          facetName: 'TestFacet',
          priority: 100,
          address: '0x1234567890123456789012345678901234567890',
          action: RegistryFacetCutAction.Add
        }
      });

      diamond.updateFunctionSelectorRegistry(selector, {
        facetName: 'UpdatedFacet',
        priority: 200,
        address: '0x1234567890123456789012345678901234567891',
        action: RegistryFacetCutAction.Replace
      });

      const entry = diamond.functionSelectorRegistry.get(selector);
      expect(entry?.facetName).to.equal('UpdatedFacet');
      expect(entry?.priority).to.equal(200);
      expect(entry?.action).to.equal(RegistryFacetCutAction.Replace);
    });
  });

  describe('deployed diamond data', () => {
    it('should get and update deployed diamond data', () => {
      const data = diamond.getDeployedDiamondData();
      expect(data.DiamondAddress).to.equal(''); // Empty string due to Zod validation

      data.DiamondAddress = '0x1234567890123456789012345678901234567890';
      diamond.updateDeployedDiamondData(data);

      const updatedData = diamond.getDeployedDiamondData();
      expect(updatedData.DiamondAddress).to.equal('0x1234567890123456789012345678901234567890');
    });

    it('should detect if it is an upgrade deployment', () => {
      expect(diamond.isUpgradeDeployment()).to.be.false;

      const data = diamond.getDeployedDiamondData();
      data.DiamondAddress = '0x1234567890123456789012345678901234567890';
      diamond.updateDeployedDiamondData(data);

      expect(diamond.isUpgradeDeployment()).to.be.true;
    });
  });

  describe('facet management', () => {
    it('should update new deployed facets', () => {
      const facetData = {
        priority: 30,
        address: '0x1234567890123456789012345678901234567890',
        tx_hash: '0x123456789abcdef',
        version: 1,
        initFunction: 'initialize()',
        funcSelectors: ['0x12345678', '0x87654321'],
        deployInclude: [],
        deployExclude: [],
        verified: false
      };

      diamond.updateNewDeployedFacets('TestFacet', facetData);

      const newFacets = diamond.getNewDeployedFacets();
      expect(newFacets).to.have.key('TestFacet');
      expect(newFacets.TestFacet).to.deep.equal(facetData);
    });

    it('should register initializers', () => {
      diamond.registerInitializers('TestFacet', 'initialize()');

      // Since initializerRegistry is a Map, we need to convert it to an object for testing
      const registry = Object.fromEntries(diamond.initializerRegistry.entries());
      expect(registry).to.deep.equal({ 'TestFacet': 'initialize()' });
    });
  });

  describe('init address management', () => {
    it('should set and get init address', () => {
      const address = '0x1234567890123456789012345678901234567890';
      diamond.setInitAddress(address);
      expect(diamond.getInitAddress()).to.equal(address);
    });
  });
});