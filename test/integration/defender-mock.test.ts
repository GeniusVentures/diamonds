import { expect } from 'chai';
import { createDefenderMocks, setupSuccessfulDeploymentMocks } from './defender/setup/defender-setup';

describe('Defender Mock Test', function () {
  this.timeout(10000);

  it('should create and use defender mocks successfully', async function () {
    // Create mocks
    const mocks = createDefenderMocks();
    setupSuccessfulDeploymentMocks(mocks);

    // Test deploy client
    const deployResult = await mocks.mockDeployClient.deployContract({
      contractName: 'TestContract',
      network: 'hardhat'
    });

    expect(deployResult.deploymentId).to.contain('defender-deploy-id');
    expect(deployResult.status).to.equal('pending');

    // Test getDeployedContract
    const getResult = await mocks.mockDeployClient.getDeployedContract(deployResult.deploymentId);
    expect(getResult.status).to.equal('completed');
    expect(getResult.contractAddress).to.match(/^0x[a-fA-F0-9]{40}$/);

    // Test proposal client
    const proposalResult = await mocks.mockProposalClient.create({
      title: 'Test Proposal'
    });
    expect(proposalResult.proposalId).to.contain('test-proposal');

    // Test mock defender structure
    expect(mocks.mockDefender.deploy).to.equal(mocks.mockDeployClient);
    expect(mocks.mockDefender.proposal).to.equal(mocks.mockProposalClient);

    console.log('All mock tests passed successfully!');
  });
});
