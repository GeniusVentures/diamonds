import sinon from 'sinon';
/**
 * Creates mocks for OpenZeppelin Defender SDK components
 * @returns Object containing mocked clients and methods to restore them
 */
export declare function mockDefenderClients(): {
    mockDeployClient: {
        deployContract: sinon.SinonStub<any[], any>;
        getDeployedContract: sinon.SinonStub<any[], any>;
    };
    mockProposalClient: {
        create: sinon.SinonStub<any[], any>;
        get: sinon.SinonStub<any[], any>;
        execute: sinon.SinonStub<any[], any>;
    };
    mockDefender: {
        proposal: {
            create: sinon.SinonStub<any[], any>;
            get: sinon.SinonStub<any[], any>;
            execute: sinon.SinonStub<any[], any>;
        };
    };
    restore: () => void;
};
/**
 * Sets up common mock responses for Defender clients
 * @param mocks The mock objects returned from mockDefenderClients
 */
export declare function setupCommonMockResponses(mocks: {
    mockDeployClient: any;
    mockProposalClient: any;
    mockDefender: any;
}): void;
//# sourceMappingURL=defenderMock.d.ts.map