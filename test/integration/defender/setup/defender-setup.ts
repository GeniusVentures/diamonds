// test/integration/defender/setup/defender-setup.ts
import sinon from "sinon";

// Custom error types for Defender API simulation
interface NetworkError extends Error {
  code: string;
}

interface APIError extends Error {
  response: {
    status: number;
  };
}

export interface MockDefenderClients {
  mockDeployClient: any;
  mockProposalClient: any;
  mockDefender: any;
  adminClient: any; // Added for backwards compatibility
  deployClient: any; // Added for backwards compatibility
  restore: () => void;
}

export interface DefenderTestConfig {
  API_KEY: string;
  API_SECRET: string;
  RELAYER_ADDRESS: string;
  SAFE_ADDRESS: string;
  AUTO_APPROVE: boolean;
}

/**
 * Creates comprehensive mocks for OpenZeppelin Defender SDK components
 */
export function createDefenderMocks(): MockDefenderClients {
  // Create mock deploy client
  const mockDeployClient = {
    deployContract: sinon.stub(),
    getDeployedContract: sinon.stub(),
    verifyContract: sinon.stub(),
    getDeployments: sinon.stub(),
    getDeployment: sinon.stub(),
  };

  // Create mock proposal client
  const mockProposalClient = {
    create: sinon.stub(),
    createProposal: sinon.stub(), // Add createProposal for compatibility
    get: sinon.stub(),
    execute: sinon.stub(),
    list: sinon.stub(),
    archive: sinon.stub(),
  };

  // Create mock defender instance
  const mockDefender = {
    deploy: mockDeployClient,
    proposal: mockProposalClient,
  };

  return {
    mockDeployClient,
    mockProposalClient,
    mockDefender,
    adminClient: mockProposalClient, // Map to proposal client for compatibility
    deployClient: mockDeployClient, // Map to deploy client for compatibility
    restore: () => {
      sinon.restore();
    },
  };
}

/**
 * Sets up realistic Defender API responses for successful deployment flow
 */
export function setupSuccessfulDeploymentMocks(mocks: MockDefenderClients) {
  const { mockDeployClient, mockProposalClient } = mocks;

  // Standard deployment response pattern
  let deploymentCounter = 0;
  mockDeployClient.deployContract.callsFake(() => {
    deploymentCounter++;
    return Promise.resolve({
      deploymentId: `defender-deploy-id-${deploymentCounter}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      contractName: `Contract${deploymentCounter}`,
      contractPath: `contracts/Contract${deploymentCounter}.sol`,
      network: "sepolia",
      artifactPayload: "",
    });
  });

  // Standard get deployed contract response pattern
  mockDeployClient.getDeployedContract.callsFake((deploymentId: string) => {
    const contractAddresses = [
      "0x1234567890123456789012345678901234567890", // DiamondCutFacet
      "0x2345678901234567890123456789012345678901", // Diamond
      "0x3456789012345678901234567890123456789012", // DiamondLoupeFacet
      "0x4567890123456789012345678901234567890123", // TestFacet
      "0x5678901234567890123456789012345678901234", // Additional facets
    ];

    const index = parseInt(deploymentId.split("-").pop() || "1", 10) - 1;
    return Promise.resolve({
      deploymentId,
      status: "completed",
      contractAddress: contractAddresses[index] || contractAddresses[0],
      txHash: `0xabcdef${index.toString().padStart(58, "0")}`,
      createdAt: new Date().toISOString(),
      contractName: `Contract${index + 1}`,
      contractPath: `contracts/Contract${index + 1}.sol`,
      network: "sepolia",
      artifactPayload: "",
    });
  });

  // Standard proposal creation response
  mockProposalClient.create.callsFake(() => {
    return Promise.resolve({
      proposalId: `test-proposal-${Date.now()}`,
      url: `https://defender.openzeppelin.com/proposal/test-proposal-${Date.now()}`,
    });
  });

  // Standard proposal status response - simulate execution after a few calls
  // Use a counter that resets each time this function is called
  let proposalCheckCount = 0;
  mockProposalClient.get.callsFake(() => {
    proposalCheckCount++;
    const isExecuted = proposalCheckCount >= 3; // Execute after 3 status checks
    return Promise.resolve({
      proposalId: "test-proposal-id",
      transaction: {
        isExecuted,
        isReverted: false,
      },
    });
  });

  // Standard execution response
  mockProposalClient.execute.callsFake(() => {
    return Promise.resolve({
      transactionId: `test-transaction-${Date.now()}`,
    });
  });
}

/**
 * Sets up Defender API responses for failed deployment scenarios
 */
export function setupFailedDeploymentMocks(
  mocks: MockDefenderClients,
  failureType: "deploy" | "proposal" | "execution"
) {
  const { mockDeployClient, mockProposalClient } = mocks;

  switch (failureType) {
    case "deploy":
      mockDeployClient.deployContract.resolves({
        deploymentId: "failed-deploy-id",
        status: "pending",
        createdAt: new Date().toISOString(),
        contractName: "FailedContract",
        contractPath: "contracts/FailedContract.sol",
        network: "sepolia",
        artifactPayload: "",
      });

      mockDeployClient.getDeployedContract.resolves({
        deploymentId: "failed-deploy-id",
        status: "failed",
        createdAt: new Date().toISOString(),
        contractName: "FailedContract",
        contractPath: "contracts/FailedContract.sol",
        network: "sepolia",
        artifactPayload: "",
        error: "Contract compilation failed",
      });
      break;

    case "proposal":
      setupSuccessfulDeploymentMocks(mocks);
      mockProposalClient.create.rejects(
        new Error("Proposal creation failed: Invalid function signature")
      );
      break;

    case "execution":
      setupSuccessfulDeploymentMocks(mocks);
      mockProposalClient.get.resolves({
        proposalId: "test-proposal-id",
        transaction: {
          isExecuted: true,
          isReverted: true,
        },
      });
      break;
  }
}

/**
 * Default test configuration for Defender integration
 */
export const DEFAULT_DEFENDER_CONFIG: DefenderTestConfig = {
  API_KEY: "test-api-key",
  API_SECRET: "test-api-secret",
  RELAYER_ADDRESS: "0x1234567890123456789012345678901234567890",
  SAFE_ADDRESS: "0x0987654321098765432109876543210987654321",
  AUTO_APPROVE: true,
};

/**
 * Simulates network delays for realistic testing
 */
export function addNetworkDelay(
  mocks: MockDefenderClients,
  delayMs: number = 100
) {
  const { mockDeployClient, mockProposalClient } = mocks;

  const originalDeployContract = mockDeployClient.deployContract;
  const originalGetDeployedContract = mockDeployClient.getDeployedContract;
  const originalCreateProposal = mockProposalClient.create;

  mockDeployClient.deployContract.callsFake(async (...args: any[]) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return originalDeployContract.call(mockDeployClient, ...args);
  });

  mockDeployClient.getDeployedContract.callsFake(async (...args: any[]) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return originalGetDeployedContract.call(mockDeployClient, ...args);
  });

  mockProposalClient.create.callsFake(async (...args: any[]) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return originalCreateProposal.call(mockProposalClient, ...args);
  });
}

/**
 * Sets up mocks for timeout testing scenarios
 */
export function setupTimeoutMocks(): MockDefenderClients {
  const mocks = createDefenderMocks();

  // Simulate very slow operations
  mocks.adminClient.createProposal.callsFake(async (request: any) => {
    // Add 6-second delay to simulate slow network
    await new Promise((resolve) => setTimeout(resolve, 6000));

    return {
      proposalId: `timeout-proposal-${Date.now()}`,
      url: `https://defender.openzeppelin.com/admin/proposals/timeout-proposal-${Date.now()}`,
      transaction: {
        hash: `0xtimeout${Date.now().toString(16).padStart(56, "0")}`,
      },
    };
  });

  // Also mock the proposal.create method
  mocks.mockProposalClient.create.callsFake(async (request: any) => {
    // Add 6-second delay to simulate slow network
    await new Promise((resolve) => setTimeout(resolve, 6000));

    return {
      proposalId: `timeout-proposal-${Date.now()}`,
      url: `https://defender.openzeppelin.com/proposal/timeout-proposal-${Date.now()}`,
      transaction: {
        hash: `0xtimeout${Date.now().toString(16).padStart(56, "0")}`,
      },
    };
  });

  mocks.adminClient.get.callsFake(async (proposalId: string) => {
    // Add 3-second delay for status checks
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      proposalId,
      title: "Timeout Test Proposal",
      description: "Testing timeout handling",
      type: "custom",
      status: "approved",
      isExecuted: false,
      transaction: {
        hash: `0xtimeout${Date.now().toString(16).padStart(56, "0")}`,
      },
    };
  });

  // Also mock the proposal.get method
  mocks.mockProposalClient.get.callsFake(async (proposalId: string) => {
    // Add 3-second delay for status checks
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      proposalId,
      title: "Timeout Test Proposal",
      description: "Testing timeout handling",
      type: "custom",
      status: "approved",
      transaction: {
        isExecuted: true,
        isReverted: false,
      },
    };
  });

  mocks.adminClient.execute.callsFake(async (proposalId: string) => {
    // Add 5-second delay for execution
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return {
      proposalId,
      transaction: {
        hash: `0xexecuted${Date.now().toString(16).padStart(56, "0")}`,
      },
    };
  });

  // Also set up deployment client mocks for contract deployment
  mocks.deployClient.deployContract.callsFake(async (request: any) => {
    // Add delay to simulate slow deployment
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      deploymentId: `timeout-deploy-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      contractName: request.contractName,
      contractPath: `contracts/${request.contractName}.sol`,
      network: "sepolia",
      artifactPayload: "",
    };
  });

  mocks.deployClient.getDeployedContract.callsFake(async (deploymentId: string) => {
    // Add delay to simulate slow status check
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      deploymentId,
      status: "completed",
      contractAddress: `0x${Date.now().toString(16).padStart(40, '0')}`,
      txHash: `0xslowdeploy${Date.now().toString(16).padStart(52, "0")}`,
      createdAt: new Date().toISOString(),
      contractName: "SlowContract",
      contractPath: "contracts/SlowContract.sol",
      network: "sepolia",
      artifactPayload: "",
    };
  });

  return mocks;
}

/**
 * Sets up mocks for batch operation testing
 */
export function setupBatchOperationMocks(): MockDefenderClients {
  const mocks = createDefenderMocks();

  let proposalCounter = 0;
  let deployCounter = 0;

  // Track all proposals for batch validation
  const proposals = new Map();

  // Setup deploy contract mock
  mocks.mockDeployClient.deployContract.callsFake(async (request: any) => {
    deployCounter++;
    const deploymentId = `batch-deploy-${deployCounter}`;

    return {
      deploymentId,
      status: 'pending',
      contractName: request.contractName,
      network: request.network,
    };
  });

  // Setup get deployed contract mock
  mocks.mockDeployClient.getDeployedContract.callsFake(async (deploymentId: string) => {
    // Simulate deployment completion
    return {
      deploymentId,
      status: 'completed',
      contractAddress: `0x${deployCounter.toString(16).padStart(40, '0')}`,
    };
  });

  // Setup proposal client mock
  mocks.mockProposalClient.create.callsFake(async (request: any) => {
    proposalCounter++;
    const proposalId = `batch-proposal-${proposalCounter}`;

    const proposal = {
      proposalId,
      title: request.title || `Batch Proposal ${proposalCounter}`,
      description: request.description || "Batch operation proposal",
      type: request.type || "custom",
      status: "approved",
      isExecuted: false,
      transaction: {
        hash: `0xbatch${proposalCounter.toString(16).padStart(60, "0")}`,
      },
      checksCount: 0,
    };

    proposals.set(proposalId, proposal);

    return {
      proposalId,
      url: `https://defender.openzeppelin.com/proposal/${proposalId}`,
    };
  });

  mocks.adminClient.createProposal.callsFake(async (request: any) => {
    proposalCounter++;
    const proposalId = `batch-proposal-${proposalCounter}`;

    const proposal = {
      proposalId,
      title: request.title || `Batch Proposal ${proposalCounter}`,
      description: request.description || "Batch operation proposal",
      type: request.type || "custom",
      status: "approved",
      isExecuted: false,
      transaction: {
        hash: `0xbatch${proposalCounter.toString(16).padStart(60, "0")}`,
      },
      checksCount: 0,
    };

    proposals.set(proposalId, proposal);

    // Simulate processing time based on batch size
    const delay = Math.min(proposalCounter * 50, 1000); // Max 1 second delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    return proposal;
  });

  mocks.deployClient.deployContract.callsFake(async (deployRequest: any) => {
    deployCounter++;

    // Simulate faster deployment for batch operations
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      deploymentId: `batch-deployment-${deployCounter}`,
      txHash: `0xbatchdeploy${deployCounter.toString(16).padStart(56, "0")}`,
      address: `0x${deployCounter.toString(16).padStart(40, "0")}`,
    };
  });

  mocks.adminClient.get.callsFake(async (proposalId: string) => {
    const proposal = proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Simulate quick status checks for batch operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate proposal becoming ready after a few checks
    proposal.checksCount = (proposal.checksCount || 0) + 1;
    if (proposal.checksCount >= 3) {
      proposal.transaction = {
        isExecuted: true,
        isReverted: false
      };
    }

    return proposal;
  });

  mocks.adminClient.execute.callsFake(async (proposalId: string) => {
    const proposal = proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    // Mark as executed
    proposal.isExecuted = true;
    proposal.status = "executed";

    // Simulate quick execution for batch operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      proposalId,
      transaction: { hash: proposal.transaction.hash },
    };
  });

  return mocks;
}

/**
 * Sets up mocks for multi-network testing
 */
export function setupMultiNetworkMocks(): MockDefenderClients {
  const mocks = createDefenderMocks();

  // Track operations per network
  const networkCounters = new Map();
  const networkProposals = new Map();

  const getNetworkFromRequest = (request: any) => {
    // Extract network from contract address or default to mainnet
    if (request.contract?.network) {
      return request.contract.network;
    }
    return "mainnet";
  };

  mocks.adminClient.createProposal.callsFake(async (request: any) => {
    const network = getNetworkFromRequest(request);

    if (!networkCounters.has(network)) {
      networkCounters.set(network, 0);
      networkProposals.set(network, new Map());
    }

    const counter = networkCounters.get(network) + 1;
    networkCounters.set(network, counter);

    const proposalId = `${network}-proposal-${counter}`;

    const proposal = {
      proposalId,
      title: request.title || `${network} Proposal ${counter}`,
      description:
        request.description || `Multi-network proposal for ${network}`,
      type: request.type || "custom",
      status: "approved",
      isExecuted: false,
      network,
      transaction: {
        hash: `0x${network}${counter.toString(16).padStart(60, "0")}`,
      },
    };

    networkProposals.get(network).set(proposalId, proposal);

    // Simulate network-specific delays
    const networkDelays: Record<string, number> = {
      mainnet: 500,
      matic: 200,
      arbitrum: 300,
      optimism: 250,
      hardhat: 100,
    };

    const delay = networkDelays[network as string] || 300;
    await new Promise((resolve) => setTimeout(resolve, delay));

    return proposal;
  });

  mocks.adminClient.get.callsFake(async (proposalId: string) => {
    // Find proposal across all networks
    for (const [network, proposals] of networkProposals.entries()) {
      if (proposals.has(proposalId)) {
        const proposal = proposals.get(proposalId);

        // Simulate network-specific status check delays
        const delay = proposal.network === "mainnet" ? 200 : 100;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return proposal;
      }
    }

    throw new Error(`Proposal ${proposalId} not found in any network`);
  });

  mocks.adminClient.execute.callsFake(async (proposalId: string) => {
    // Find and execute proposal
    for (const [network, proposals] of networkProposals.entries()) {
      if (proposals.has(proposalId)) {
        const proposal = proposals.get(proposalId);

        // Mark as executed
        proposal.isExecuted = true;
        proposal.status = "executed";

        // Simulate network-specific execution delays
        const executionDelays: Record<string, number> = {
          mainnet: 1000,
          matic: 400,
          arbitrum: 600,
          optimism: 500,
          hardhat: 200,
        };

        const delay = executionDelays[proposal.network as string] || 600;
        await new Promise((resolve) => setTimeout(resolve, delay));

        return {
          proposalId,
          transaction: { hash: proposal.transaction.hash },
        };
      }
    }

    throw new Error(`Proposal ${proposalId} not found for execution`);
  });

  return mocks;
}

/**
 * Sets up mocks that simulate various error conditions
 */
export function setupErrorConditionMocks(): MockDefenderClients {
  const mocks = createDefenderMocks();

  let callCount = 0;

  mocks.adminClient.createProposal.callsFake(async (request: any) => {
    callCount++;

    // Simulate different error conditions based on call count
    switch (callCount % 5) {
      case 1:
        // Network timeout
        await new Promise((resolve) => setTimeout(resolve, 100));
        const timeoutError = new Error("Network timeout") as NetworkError;
        timeoutError.code = "NETWORK_ERROR";
        throw timeoutError;

      case 2:
        // Rate limiting
        const rateLimitError = new Error("Rate limit exceeded") as APIError;
        rateLimitError.response = { status: 429 };
        throw rateLimitError;

      case 3:
        // Invalid contract
        const contractError = new Error("Contract not found") as APIError;
        contractError.response = { status: 404 };
        throw contractError;

      case 4:
        // Insufficient permissions
        const permissionError = new Error(
          "Insufficient permissions"
        ) as APIError;
        permissionError.response = { status: 403 };
        throw permissionError;

      default:
        // Success case
        return {
          proposalId: `error-test-proposal-${callCount}`,
          url: `https://defender.openzeppelin.com/admin/proposals/error-test-proposal-${callCount}`,
          transaction: {
            hash: `0xerror${callCount.toString(16).padStart(62, "0")}`,
          },
        };
    }
  });

  return mocks;
}

/**
 * Sets up mocks for testing contract verification scenarios
 */
export function setupVerificationMocks(): MockDefenderClients {
  const mocks = createDefenderMocks();

  let verificationAttempts = 0;

  mocks.deployClient.verifyDeployment.callsFake(
    async (deploymentId: string, verificationRequest: any) => {
      verificationAttempts++;

      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate occasional verification failures
      if (verificationAttempts % 4 === 0) {
        throw new Error("Source code verification failed");
      }

      return {
        deploymentId,
        status: "verified",
        verificationId: `verification-${verificationAttempts}`,
        explorerUrl: `https://etherscan.io/address/${verificationRequest.address}#code`,
      };
    }
  );

  return mocks;
}
