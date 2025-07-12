"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DEFENDER_CONFIG = void 0;
exports.createDefenderMocks = createDefenderMocks;
exports.setupSuccessfulDeploymentMocks = setupSuccessfulDeploymentMocks;
exports.setupFailedDeploymentMocks = setupFailedDeploymentMocks;
exports.addNetworkDelay = addNetworkDelay;
exports.setupTimeoutMocks = setupTimeoutMocks;
exports.setupBatchOperationMocks = setupBatchOperationMocks;
exports.setupMultiNetworkMocks = setupMultiNetworkMocks;
exports.setupErrorConditionMocks = setupErrorConditionMocks;
exports.setupVerificationMocks = setupVerificationMocks;
// test/integration/defender/setup/defender-setup.ts
const sinon_1 = __importDefault(require("sinon"));
/**
 * Creates comprehensive mocks for OpenZeppelin Defender SDK components
 */
function createDefenderMocks() {
    // Create mock deploy client
    const mockDeployClient = {
        deployContract: sinon_1.default.stub(),
        getDeployedContract: sinon_1.default.stub(),
        verifyContract: sinon_1.default.stub(),
        getDeployments: sinon_1.default.stub(),
        getDeployment: sinon_1.default.stub(),
    };
    // Create mock proposal client
    const mockProposalClient = {
        create: sinon_1.default.stub(),
        createProposal: sinon_1.default.stub(), // Add createProposal for compatibility
        get: sinon_1.default.stub(),
        execute: sinon_1.default.stub(),
        list: sinon_1.default.stub(),
        archive: sinon_1.default.stub(),
    };
    // Create mock defender instance with proper structure
    const mockDefender = {
        deploy: mockDeployClient,
        proposal: mockProposalClient,
        admin: mockProposalClient, // For backwards compatibility
    };
    return {
        mockDeployClient,
        mockProposalClient,
        mockDefender,
        adminClient: mockProposalClient, // Map to proposal client for compatibility
        deployClient: mockDeployClient, // Map to deploy client for compatibility
        restore: () => {
            sinon_1.default.restore();
        },
    };
}
/**
 * Sets up realistic Defender API responses for successful deployment flow
 */
function setupSuccessfulDeploymentMocks(mocks) {
    const { mockDeployClient, mockProposalClient } = mocks;
    // Reset all existing stubs first
    mockDeployClient.deployContract.reset();
    mockDeployClient.getDeployedContract.reset();
    mockProposalClient.create.reset();
    mockProposalClient.get.reset();
    mockProposalClient.execute.reset();
    // Standard deployment response pattern
    let deploymentCounter = 0;
    mockDeployClient.deployContract.callsFake(async (request) => {
        deploymentCounter++;
        console.log(`[MOCK] deployContract called ${deploymentCounter} times with:`, request.contractName);
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
            deploymentId: `defender-deploy-id-${deploymentCounter}`,
            status: "pending",
            createdAt: new Date().toISOString(),
            contractName: request.contractName || `Contract${deploymentCounter}`,
            contractPath: request.contractPath || `contracts/Contract${deploymentCounter}.sol`,
            network: request.network || "sepolia",
            artifactPayload: request.artifactPayload || "",
        };
    });
    // Standard get deployed contract response pattern
    mockDeployClient.getDeployedContract.callsFake(async (deploymentId) => {
        console.log(`[MOCK] getDeployedContract called for:`, deploymentId);
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
        const contractAddresses = [
            "0x1234567890123456789012345678901234567890", // DiamondCutFacet
            "0x2345678901234567890123456789012345678901", // Diamond
            "0x3456789012345678901234567890123456789012", // DiamondLoupeFacet
            "0x4567890123456789012345678901234567890123", // TestFacet
            "0x5678901234567890123456789012345678901234", // Additional facets
        ];
        const index = parseInt(deploymentId.split("-").pop() || "1", 10) - 1;
        return {
            deploymentId,
            status: "completed",
            contractAddress: contractAddresses[index] || contractAddresses[0],
            txHash: `0xabcdef${index.toString().padStart(58, "0")}`,
            createdAt: new Date().toISOString(),
            contractName: `Contract${index + 1}`,
            contractPath: `contracts/Contract${index + 1}.sol`,
            network: "sepolia",
            artifactPayload: "",
        };
    });
    // Standard proposal creation response
    mockProposalClient.create.callsFake(async (request) => {
        console.log(`[MOCK] proposal.create called with:`, request?.title || "untitled");
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
            proposalId: `test-proposal-${Date.now()}`,
            url: `https://defender.openzeppelin.com/proposal/test-proposal-${Date.now()}`,
        };
    });
    // Standard proposal status response - execute immediately for test speed
    mockProposalClient.get.callsFake(() => {
        return Promise.resolve({
            proposalId: "test-proposal-id",
            transaction: {
                isExecuted: true,
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
function setupFailedDeploymentMocks(mocks, failureType) {
    const { mockDeployClient, mockProposalClient } = mocks;
    // Reset all existing stubs first
    mockDeployClient.deployContract.reset();
    mockDeployClient.getDeployedContract.reset();
    mockProposalClient.create.reset();
    mockProposalClient.get.reset();
    mockProposalClient.execute.reset();
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
            mockProposalClient.create.rejects(new Error("Proposal creation failed: Invalid function signature"));
            break;
        case "execution":
            setupSuccessfulDeploymentMocks(mocks);
            // For execution failure, just throw an error immediately
            mockProposalClient.get.callsFake(() => {
                return Promise.reject(new Error("Proposal execution reverted: test-proposal-id"));
            });
            break;
    }
}
/**
 * Default test configuration for Defender integration
 */
exports.DEFAULT_DEFENDER_CONFIG = {
    API_KEY: "test-api-key",
    API_SECRET: "test-api-secret",
    RELAYER_ADDRESS: "0x1234567890123456789012345678901234567890",
    SAFE_ADDRESS: "0x0987654321098765432109876543210987654321",
    AUTO_APPROVE: true,
};
/**
 * Simulates network delays for realistic testing
 */
function addNetworkDelay(mocks, delayMs = 100) {
    const { mockDeployClient, mockProposalClient } = mocks;
    const originalDeployContract = mockDeployClient.deployContract;
    const originalGetDeployedContract = mockDeployClient.getDeployedContract;
    const originalCreateProposal = mockProposalClient.create;
    mockDeployClient.deployContract.callsFake(async (...args) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return originalDeployContract.call(mockDeployClient, ...args);
    });
    mockDeployClient.getDeployedContract.callsFake(async (...args) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return originalGetDeployedContract.call(mockDeployClient, ...args);
    });
    mockProposalClient.create.callsFake(async (...args) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return originalCreateProposal.call(mockProposalClient, ...args);
    });
}
/**
 * Sets up mocks for timeout testing scenarios
 */
function setupTimeoutMocks() {
    const mocks = createDefenderMocks();
    // Simulate very slow operations
    mocks.adminClient.createProposal.callsFake(async (request) => {
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
    mocks.mockProposalClient.create.callsFake(async (request) => {
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
    mocks.adminClient.get.callsFake(async (proposalId) => {
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
    mocks.mockProposalClient.get.callsFake(async (proposalId) => {
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
    mocks.adminClient.execute.callsFake(async (proposalId) => {
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
    mocks.deployClient.deployContract.callsFake(async (request) => {
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
    mocks.deployClient.getDeployedContract.callsFake(async (deploymentId) => {
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
function setupBatchOperationMocks() {
    const mocks = createDefenderMocks();
    let proposalCounter = 0;
    let deployCounter = 0;
    // Track all proposals for batch validation
    const proposals = new Map();
    // Reset counters and tracking for fresh test state
    mocks.mockProposalClient.create.resetHistory();
    mocks.adminClient.createProposal.resetHistory();
    mocks.mockDeployClient.deployContract.resetHistory();
    mocks.deployClient.deployContract.resetHistory();
    // Setup deploy contract mock
    mocks.mockDeployClient.deployContract.callsFake(async (request) => {
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
    mocks.mockDeployClient.getDeployedContract.callsFake(async (deploymentId) => {
        // Simulate deployment completion
        return {
            deploymentId,
            status: 'completed',
            contractAddress: `0x${deployCounter.toString(16).padStart(40, '0')}`,
        };
    });
    // Setup proposal client mock
    mocks.mockProposalClient.create.callsFake(async (request) => {
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
    mocks.adminClient.createProposal.callsFake(async (request) => {
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
    mocks.deployClient.deployContract.callsFake(async (deployRequest) => {
        deployCounter++;
        // Simulate faster deployment for batch operations
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
            deploymentId: `batch-deployment-${deployCounter}`,
            txHash: `0xbatchdeploy${deployCounter.toString(16).padStart(56, "0")}`,
            address: `0x${deployCounter.toString(16).padStart(40, "0")}`,
        };
    });
    mocks.adminClient.get.callsFake(async (proposalId) => {
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
    mocks.adminClient.execute.callsFake(async (proposalId) => {
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
function setupMultiNetworkMocks() {
    const mocks = createDefenderMocks();
    // Track operations per network
    const networkCounters = new Map();
    const networkProposals = new Map();
    const getNetworkFromRequest = (request) => {
        // Extract network from contract address or default to mainnet
        if (request.contract?.network) {
            return request.contract.network;
        }
        return "mainnet";
    };
    mocks.adminClient.createProposal.callsFake(async (request) => {
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
            description: request.description || `Multi-network proposal for ${network}`,
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
        const networkDelays = {
            mainnet: 500,
            matic: 200,
            arbitrum: 300,
            optimism: 250,
            hardhat: 100,
        };
        const delay = networkDelays[network] || 300;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return proposal;
    });
    mocks.adminClient.get.callsFake(async (proposalId) => {
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
    mocks.adminClient.execute.callsFake(async (proposalId) => {
        // Find and execute proposal
        for (const [network, proposals] of networkProposals.entries()) {
            if (proposals.has(proposalId)) {
                const proposal = proposals.get(proposalId);
                // Mark as executed
                proposal.isExecuted = true;
                proposal.status = "executed";
                // Simulate network-specific execution delays
                const executionDelays = {
                    mainnet: 1000,
                    matic: 400,
                    arbitrum: 600,
                    optimism: 500,
                    hardhat: 200,
                };
                const delay = executionDelays[proposal.network] || 600;
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
function setupErrorConditionMocks() {
    const mocks = createDefenderMocks();
    let callCount = 0;
    mocks.adminClient.createProposal.callsFake(async (request) => {
        callCount++;
        // Simulate different error conditions based on call count
        switch (callCount % 5) {
            case 1:
                // Network timeout
                await new Promise((resolve) => setTimeout(resolve, 100));
                const timeoutError = new Error("Network timeout");
                timeoutError.code = "NETWORK_ERROR";
                throw timeoutError;
            case 2:
                // Rate limiting
                const rateLimitError = new Error("Rate limit exceeded");
                rateLimitError.response = { status: 429 };
                throw rateLimitError;
            case 3:
                // Invalid contract
                const contractError = new Error("Contract not found");
                contractError.response = { status: 404 };
                throw contractError;
            case 4:
                // Insufficient permissions
                const permissionError = new Error("Insufficient permissions");
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
function setupVerificationMocks() {
    const mocks = createDefenderMocks();
    let verificationAttempts = 0;
    mocks.deployClient.verifyDeployment.callsFake(async (deploymentId, verificationRequest) => {
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
    });
    return mocks;
}
//# sourceMappingURL=defender-setup.js.map