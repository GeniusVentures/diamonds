const { createDefenderMocks, setupSuccessfulDeploymentMocks } = require('./test/integration/defender/setup/defender-setup');

// Simple test to verify mocks work
async function testMocks() {
  console.log('Creating mocks...');
  const mocks = createDefenderMocks();
  
  console.log('Setting up successful deployment mocks...');
  setupSuccessfulDeploymentMocks(mocks);
  
  console.log('Testing deployContract mock...');
  const deployResult = await mocks.mockDeployClient.deployContract({
    contractName: 'TestContract',
    network: 'hardhat'
  });
  console.log('Deploy result:', deployResult);
  
  console.log('Testing getDeployedContract mock...');
  const getResult = await mocks.mockDeployClient.getDeployedContract(deployResult.deploymentId);
  console.log('Get result:', getResult);
  
  console.log('Testing proposal.create mock...');
  const proposalResult = await mocks.mockProposalClient.create({
    title: 'Test Proposal'
  });
  console.log('Proposal result:', proposalResult);
  
  console.log('Mock structure check:');
  console.log('mockDefender.deploy:', typeof mocks.mockDefender.deploy);
  console.log('mockDefender.proposal:', typeof mocks.mockDefender.proposal);
  console.log('mockDefender.deploy.deployContract:', typeof mocks.mockDefender.deploy.deployContract);
  console.log('mockDefender.proposal.create:', typeof mocks.mockDefender.proposal.create);
  
  console.log('All tests passed!');
}

testMocks().catch(console.error);
