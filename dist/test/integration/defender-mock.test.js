"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const defender_setup_1 = require("./defender/setup/defender-setup");
describe('Defender Mock Test', function () {
    this.timeout(10000);
    it('should create and use defender mocks successfully', async function () {
        // Create mocks
        const mocks = (0, defender_setup_1.createDefenderMocks)();
        (0, defender_setup_1.setupSuccessfulDeploymentMocks)(mocks);
        // Test deploy client
        const deployResult = await mocks.mockDeployClient.deployContract({
            contractName: 'TestContract',
            network: 'hardhat'
        });
        (0, chai_1.expect)(deployResult.deploymentId).to.contain('defender-deploy-id');
        (0, chai_1.expect)(deployResult.status).to.equal('pending');
        // Test getDeployedContract
        const getResult = await mocks.mockDeployClient.getDeployedContract(deployResult.deploymentId);
        (0, chai_1.expect)(getResult.status).to.equal('completed');
        (0, chai_1.expect)(getResult.contractAddress).to.match(/^0x[a-fA-F0-9]{40}$/);
        // Test proposal client
        const proposalResult = await mocks.mockProposalClient.create({
            title: 'Test Proposal'
        });
        (0, chai_1.expect)(proposalResult.proposalId).to.contain('test-proposal');
        // Test mock defender structure
        (0, chai_1.expect)(mocks.mockDefender.deploy).to.equal(mocks.mockDeployClient);
        (0, chai_1.expect)(mocks.mockDefender.proposal).to.equal(mocks.mockProposalClient);
        console.log('All mock tests passed successfully!');
    });
});
//# sourceMappingURL=defender-mock.test.js.map