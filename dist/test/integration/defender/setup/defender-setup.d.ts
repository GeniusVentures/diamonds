export interface MockDefenderClients {
    mockDeployClient: any;
    mockProposalClient: any;
    mockDefender: any;
    adminClient: any;
    deployClient: any;
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
export declare function createDefenderMocks(): MockDefenderClients;
/**
 * Sets up realistic Defender API responses for successful deployment flow
 */
export declare function setupSuccessfulDeploymentMocks(mocks: MockDefenderClients): void;
/**
 * Sets up Defender API responses for failed deployment scenarios
 */
export declare function setupFailedDeploymentMocks(mocks: MockDefenderClients, failureType: "deploy" | "proposal" | "execution"): void;
/**
 * Default test configuration for Defender integration
 */
export declare const DEFAULT_DEFENDER_CONFIG: DefenderTestConfig;
/**
 * Simulates network delays for realistic testing
 */
export declare function addNetworkDelay(mocks: MockDefenderClients, delayMs?: number): void;
/**
 * Sets up mocks for timeout testing scenarios
 */
export declare function setupTimeoutMocks(): MockDefenderClients;
/**
 * Sets up mocks for batch operation testing
 */
export declare function setupBatchOperationMocks(): MockDefenderClients;
/**
 * Sets up mocks for multi-network testing
 */
export declare function setupMultiNetworkMocks(): MockDefenderClients;
/**
 * Sets up mocks that simulate various error conditions
 */
export declare function setupErrorConditionMocks(): MockDefenderClients;
/**
 * Sets up mocks for testing contract verification scenarios
 */
export declare function setupVerificationMocks(): MockDefenderClients;
//# sourceMappingURL=defender-setup.d.ts.map