// // Test removed because of redundancy and interference with other tests.

// import { expect } from 'chai';
// import { ethers } from 'hardhat';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import * as fs from 'fs-extra';
// import * as path from 'path';

// import { Diamond } from '../../src/core/Diamond';
// import { DiamondDeployer } from '../../src/core/DiamondDeployer';
// import { FileDeploymentRepository } from '../../src/repositories/FileDeploymentRepository';
// import { OZDefenderDeploymentStrategy } from '../../src/strategies/OZDefenderDeploymentStrategy';
// import { DiamondConfig } from '../../src/types/config';

// import {
//   createDefenderMocks,
//   setupSuccessfulDeploymentMocks,
//   DEFAULT_DEFENDER_CONFIG
// } from './defender/setup/defender-setup';

// describe('Defender Strategy Test', function () {
//   this.timeout(20000);

//   const TEMP_DIR = path.join(__dirname, '../.tmp-defender-strategy');
//   const DIAMOND_NAME = 'TestDiamond';

//   let signers: SignerWithAddress[];

//   before(async function () {
//     await fs.ensureDir(TEMP_DIR);
//     signers = await ethers.getSigners();
//   });

//   after(async function () {
//     await fs.remove(TEMP_DIR);
//   });

//   it('should deploy diamond using defender strategy with mocks', async function () {
//     // Create mocks
//     const mocks = createDefenderMocks();
//     setupSuccessfulDeploymentMocks(mocks);

//     // Create test directories and config
//     await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'deployments'));
//     await fs.ensureDir(path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'));

//     const sampleConfig = {
//       protocolVersion: 0.0,
//       protocolInitFacet: 'TestFacet',
//       facets: {
//         DiamondCutFacet: {
//           priority: 10,
//           versions: { "0.0": {} }
//         }
//       }
//     };

//     const configPath = path.join(TEMP_DIR, DIAMOND_NAME, `${DIAMOND_NAME.toLowerCase()}.config.json`);
//     await fs.writeJson(configPath, sampleConfig, { spaces: 2 });

//     // Create callback file
//     const callbackFile = path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks', 'TestFacet.js');
//     await fs.writeFile(callbackFile, 'module.exports = {};');

//     // Set up configuration
//     const config: DiamondConfig = {
//       diamondName: DIAMOND_NAME,
//       networkName: 'hardhat',
//       chainId: 31337,
//       deploymentsPath: TEMP_DIR,
//       contractsPath: 'test/mocks/contracts',
//       callbacksPath: path.join(TEMP_DIR, DIAMOND_NAME, 'callbacks'),
//       configFilePath: configPath,
//       deployedDiamondDataFilePath: path.join(TEMP_DIR, DIAMOND_NAME, 'deployments', `${DIAMOND_NAME.toLowerCase()}-hardhat-31337.json`)
//     };

//     const repository = new FileDeploymentRepository(config);
//     const diamond = new Diamond(config, repository);

//     diamond.setProvider(ethers.provider);
//     diamond.setSigner(signers[0]);

//     // Create strategy with mocked client
//     const strategy = new OZDefenderDeploymentStrategy(
//       DEFAULT_DEFENDER_CONFIG.API_KEY,
//       DEFAULT_DEFENDER_CONFIG.API_SECRET,
//       DEFAULT_DEFENDER_CONFIG.RELAYER_ADDRESS,
//       DEFAULT_DEFENDER_CONFIG.AUTO_APPROVE,
//       DEFAULT_DEFENDER_CONFIG.SAFE_ADDRESS,
//       'Safe',
//       true,
//       mocks.mockDefender // Pass the mocked client
//     );

//     // Create deployer
//     const deployer = new DiamondDeployer(diamond, strategy);

//     console.log('Starting deployment with mocked strategy...');

//     try {
//       // Set NODE_ENV to test to ensure shorter timeouts
//       process.env.NODE_ENV = 'test';

//       // Execute deployment
//       await deployer.deployDiamond();

//       console.log('Deployment completed successfully!');

//       // Verify calls were made
//       console.log('Deploy calls:', mocks.mockDeployClient.deployContract.callCount);
//       console.log('Proposal calls:', mocks.mockProposalClient.create.callCount);

//       expect(mocks.mockDeployClient.deployContract.callCount).to.be.at.least(1);

//     } catch (error) {
//       console.error('Deployment failed:', error);
//       throw error;
//     }
//   });
// });
