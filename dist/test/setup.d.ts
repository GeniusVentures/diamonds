import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
/**
 * Test setup helper that deploys mock contracts for diamond testing
 */
export declare function setupMockContracts(): Promise<{
    deployer: SignerWithAddress;
    accounts: SignerWithAddress[];
    diamondCutFacet: Contract;
    diamondLoupeFacet: Contract;
    testFacet: Contract;
    diamond: Contract;
}>;
/**
 * Create test files and directories
 */
export declare function setupTestFiles(tempDir: string, diamondName: string, networkName: string, chainId: number): Promise<{
    configPath: string;
    deploymentPath: string;
    callbackPath: string;
}>;
/**
 * Helper to create a temporary testing environment
 */
export declare function setupTestEnvironment(tempDir: string, diamondName?: string, networkName?: string, chainId?: number): Promise<{
    tempDir: string;
    diamondName: string;
    networkName: string;
    chainId: number;
    configPath: string;
    deploymentPath: string;
    callbackPath: string;
    deployer: SignerWithAddress;
    accounts: SignerWithAddress[];
    diamondCutFacet: Contract;
    diamondLoupeFacet: Contract;
    testFacet: Contract;
    diamond: Contract;
}>;
/**
 * Clean up test environment
 */
export declare function cleanupTestEnvironment(tempDir: string): Promise<void>;
//# sourceMappingURL=setup.d.ts.map