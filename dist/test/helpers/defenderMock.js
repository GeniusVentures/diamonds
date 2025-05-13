"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommonMockResponses = exports.mockDefenderClients = void 0;
// test/helpers/defenderMock.ts
const sinon_1 = __importDefault(require("sinon"));
const defenderClients = __importStar(require("../../src/utils/defenderClients"));
/**
 * Creates mocks for OpenZeppelin Defender SDK components
 * @returns Object containing mocked clients and methods to restore them
 */
function mockDefenderClients() {
    const mockDeployClient = {
        deployContract: sinon_1.default.stub(),
        getDeployedContract: sinon_1.default.stub()
    };
    const mockProposalClient = {
        create: sinon_1.default.stub(),
        get: sinon_1.default.stub(),
        execute: sinon_1.default.stub()
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
exports.mockDefenderClients = mockDefenderClients;
/**
 * Sets up common mock responses for Defender clients
 * @param mocks The mock objects returned from mockDefenderClients
 */
function setupCommonMockResponses(mocks) {
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
exports.setupCommonMockResponses = setupCommonMockResponses;
//# sourceMappingURL=defenderMock.js.map