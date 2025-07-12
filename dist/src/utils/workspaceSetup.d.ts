/**
 * Workspace setup utility for diamonds module
 * Supports both standalone and hardhat-diamonds plugin configurations
 */
export declare class WorkspaceSetup {
    /**
     * Initialize a new diamond workspace with default structure
     */
    static initializeWorkspace(diamondName: string, options?: {
        useHardhatPlugin?: boolean;
        contractsPath?: string;
        deploymentsPath?: string;
        createExampleConfig?: boolean;
    }): Promise<void>;
    /**
     * Create a default diamond configuration file
     */
    private static createDefaultConfig;
    /**
     * Create an example callback file
     */
    private static createExampleCallback;
    /**
     * Create example contract files if they don't exist
     */
    private static createExampleContracts;
    /**
     * Create hardhat config example for hardhat-diamonds plugin
     */
    private static createHardhatConfigExample;
}
//# sourceMappingURL=workspaceSetup.d.ts.map