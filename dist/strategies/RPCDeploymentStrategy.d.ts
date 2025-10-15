import { JsonRpcProvider, Signer } from "ethers";
import { Diamond } from "../core/Diamond";
import { BaseDeploymentStrategy } from "./BaseDeploymentStrategy";
/**
 * Error classes for RPC-specific failures
 */
export declare class RPCConnectionError extends Error {
    readonly originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class TransactionFailedError extends Error {
    readonly txHash?: string | undefined;
    readonly originalError?: Error | undefined;
    constructor(message: string, txHash?: string | undefined, originalError?: Error | undefined);
}
export declare class GasEstimationError extends Error {
    readonly originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class ContractDeploymentError extends Error {
    readonly contractName?: string | undefined;
    readonly originalError?: Error | undefined;
    constructor(message: string, contractName?: string | undefined, originalError?: Error | undefined);
}
/**
 * RPC Deployment Strategy for direct blockchain interaction
 *
 * This strategy enables direct RPC communication with blockchain networks
 * for contract deployment, diamond cuts, and callback execution without
 * relying on Hardhat's deployment abstractions.
 */
export declare class RPCDeploymentStrategy extends BaseDeploymentStrategy {
    private rpcUrl;
    private privateKey;
    private provider;
    private signer;
    private gasLimitMultiplier;
    private maxRetries;
    private retryDelayMs;
    private store?;
    /**
     * Creates a new RPC Deployment Strategy
     *
     * @param rpcUrl - The RPC endpoint URL
     * @param privateKey - The deployer's private key (0x prefixed)
     * @param gasLimitMultiplier - Multiplier for gas limit estimates (default: 1.2)
     * @param maxRetries - Maximum number of retries for failed operations (default: 3)
     * @param retryDelayMs - Delay between retries in milliseconds (default: 2000)
     * @param verbose - Enable verbose logging (default: false)
     */
    constructor(rpcUrl: string, privateKey: string, gasLimitMultiplier?: number, maxRetries?: number, retryDelayMs?: number, verbose?: boolean);
    /**
     * Initialize step tracking store for deployment
     */
    private initializeStore;
    /**
     * Save a deployment step with tracking
     */
    private saveStep;
    /**
     * Update step status with transaction details
     */
    private updateStepStatus;
    /**
     * Check if a step is already completed
     */
    private isStepCompleted;
    /**
     * Skip a step that's already completed
     */
    private skipCompletedStep;
    /**
     * Resolve diamond contract name handling multiple artifacts issue
     */
    private resolveDiamondContractName;
    /**
     * Validates constructor inputs
     */
    private validateConstructorInputs;
    /**
     * Retry wrapper for operations that may fail due to network issues
     */
    private withRetry;
    /**
     * Estimates gas for a transaction with safety multiplier
     */
    private estimateGasWithMultiplier;
    /**
     * Gets current gas price with optional premium
     */
    private getGasPrice;
    /**
     * Deploys a contract using RPC
     */
    private deployContract;
    /**
     * Override deployDiamondTasks to use RPC instead of Hardhat
     */
    protected deployDiamondTasks(diamond: Diamond): Promise<void>;
    /**
     * Override deployFacetsTasks to use RPC instead of Hardhat
     */
    protected deployFacetsTasks(diamond: Diamond): Promise<void>;
    /**
     * Override performDiamondCutTasks to use RPC instead of Hardhat
     */
    protected performDiamondCutTasks(diamond: Diamond): Promise<void>;
    /**
     * Executes initializer functions for deployed facets
     */
    private executeInitializerFunctions;
    /**
     * Checks network connection and validates signer
     */
    validateConnection(): Promise<void>;
    /**
     * Gets the provider instance
     */
    getProvider(): JsonRpcProvider;
    /**
     * Gets the signer instance
     */
    getSigner(): Signer;
    /**
     * Gets deployment strategy configuration
     */
    getConfig(): {
        rpcUrl: string;
        signerAddress: Promise<string>;
        gasLimitMultiplier: number;
        maxRetries: number;
        retryDelayMs: number;
        verbose: boolean;
    };
    preDeployDiamond(diamond: Diamond): Promise<void>;
    protected preDeployFacetsTasks(diamond: Diamond): Promise<void>;
    protected prePerformDiamondCutTasks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=RPCDeploymentStrategy.d.ts.map