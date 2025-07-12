/**
 * Test setup helper that deploys mock contracts for diamond testing
 */
export declare function setupMockContracts(): Promise<{
    deployer: any;
    accounts: any;
    diamondCutFacet: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
    diamondLoupeFacet: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
    testFacet: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
    diamond: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
}>;
/**
 * Create test files and directories
 */
export declare function setupTestFiles(tempDir: string, diamondName: string, networkName: string, chainId: number): Promise<{
    configPath: string;
    deploymentPath: string;
    callbackPath1: string;
    callbackPath2: string;
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
    callbackPath1: string;
    callbackPath2: string;
    deployer: any;
    accounts: any;
    diamondCutFacet: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
    diamondLoupeFacet: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
    testFacet: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
    diamond: import("ethers").BaseContract & {
        deploymentTransaction(): import("ethers").ContractTransactionResponse;
    } & Omit<import("ethers").BaseContract, keyof import("ethers").BaseContract>;
}>;
/**
 * Clean up test environment
 */
export declare function cleanupTestEnvironment(tempDir: string): Promise<void>;
//# sourceMappingURL=setup.d.ts.map