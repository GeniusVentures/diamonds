// test/helpers/defenderMock.ts
import sinon from 'sinon';
import * as defenderClients from '../../src/utils/defenderClients';

/**
 * Creates mocks for OpenZeppelin Defender SDK components
 * @returns Object containing mocked clients and methods to restore them
 */
export function mockDefenderClients() {
  const mockDeployClient = {
    deployContract: sinon.stub(),
    getDeployedContract: sinon.stub()
  };

  const mockProposalClient = {
    create: sinon.stub(),
    get: sinon.stub(),
    execute: sinon.stub()
  };

  const mockDefender = {
    proposal: mockProposalClient
  };

  // Save original values
  const originalDeployClient = defenderClients.deployClient;
  const originalAdminClient = defenderClients.adminClient;

  // Replace with mocks
  Object.defineProperty(defenderClients, 'deployClient', {
    value: mockDeployClient,
    writable: true
  });

  Object.defineProperty(defenderClients, 'adminClient', {
    value: mockDefender,
    writable: true
  });

  // Return mocks and restoration function
  return {
    mockDeployClient,
    mockProposalClient,
    mockDefender,
    restore: () => {
      // Restore original values
      Object.defineProperty(defenderClients, 'deployClient', {
        value: originalDeployClient,
        writable: true
      });
      Object.defineProperty(defenderClients, 'adminClient', {
        value: originalAdminClient,
        writable: true
      });
    }
  };
}

/**
 * Sets up common mock responses for Defender clients
 * @param mocks The mock objects returned from mockDefenderClients
 */
export function setupCommonMockResponses(mocks: {
  mockDeployClient: any,
  mockProposalClient: any,
  mockDefender: any
}) {
  const { mockDeployClient, mockProposalClient } = mocks;

  // Standard deployment success flow
  mockDeployClient.deployContract.resolves({
    deploymentId: 'test-deployment-id',
    status: 'pending'
  });

  mockDeployClient.getDeployedContract.resolves({
    status: 'completed',
    contractAddress: '0x1234567890123456789012345678901234567890'
  });

  mockProposalClient.create.resolves({
    proposalId: 'test-proposal-id',
    url: 'https://defender.openzeppelin.com/proposal/test-proposal-id'
  });

  mockProposalClient.get.resolves({
    transaction: {
      isExecuted: false,
      isReverted: false
    }
  });

  mockProposalClient.execute.resolves({
    transactionId: 'test-transaction-id'
  });
}