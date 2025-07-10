import { expect } from 'chai';
import hre from "hardhat";;
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as fs from 'fs-extra';
import * as path from 'path';

import { Diamond } from '../../src/core/Diamond';
import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
import { DiamondConfig } from '../../src/types/config';

describe('Diamond Setup Test', function () {
  this.timeout(10000);

  const TEMP_DIR = path.join(__dirname, '../.tmp-diamond-setup');
  const DIAMOND_NAME = 'SetupTestDiamond';

  let signers: HardhatEthersSigner[];

  before(async function () {
    await fs.ensureDir(TEMP_DIR);
    signers = await (hre as any).ethers.getSigners();
  });

  after(async function () {
    await fs.remove(TEMP_DIR);
  });

  it('should create and configure diamond successfully', async function () {
    // Create test directories
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
    await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));

    // Create a simple config
    const sampleConfig = {
      protocolVersion: 0.0,
      protocolInitFacet: 'TestFacet',
      facets: {
        DiamondCutFacet: {
          priority: 10,
          versions: { "0.0": {} }
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

    const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
    await fs.writeJson(configPath, sampleConfig, { spaces: 2 });

    // Create callback file
    const callbackFile = path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks', 'TestFacet.js');
    const callbackContent = `
module.exports = {
  testCallback: function() {
    console.log('Test callback executed');
  }
};
`;
    await fs.writeFile(callbackFile, callbackContent);

    // Set up configuration
    const config: DiamondConfig = {
      diamondName: DIAMOND_NAME,
      networkName: 'hardhat',
      chainId: 31337,
      deploymentsPath: TEMP_DIR,
      contractsPath: 'test/mocks/contracts',
      callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
      configFilePath: configPath,
      deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-hardhat-31337.json`)
    };

    // Create diamond
    const repository = new FileDeploymentRepository(config);
    const diamond = new Diamond(config, repository);

    // Setup the diamond
    diamond.setProvider((hre as any).ethers.provider);
    diamond.setSigner(signers[0]);

    // Test basic functionality
    expect(diamond.diamondName).to.equal(DIAMOND_NAME);
    expect(diamond.getDiamondConfig()).to.deep.equal(config);

    // Test loading configuration
    const deployConfig = diamond.getDeployConfig();
    expect(deployConfig.facets).to.have.property('DiamondCutFacet');
    expect(deployConfig.facets).to.have.property('TestFacet');

    console.log('Diamond configuration test passed!');
  });
});
