"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPCDeploymentStrategy = exports.ContractDeploymentError = exports.GasEstimationError = exports.TransactionFailedError = exports.RPCConnectionError = void 0;
const BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
const types_1 = require("../types");
const ethers_1 = require("ethers");
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("../utils");
/**
 * Error classes for RPC-specific failures
 */
class RPCConnectionError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = "RPCConnectionError";
    }
}
exports.RPCConnectionError = RPCConnectionError;
class TransactionFailedError extends Error {
    txHash;
    originalError;
    constructor(message, txHash, originalError) {
        super(message);
        this.txHash = txHash;
        this.originalError = originalError;
        this.name = "TransactionFailedError";
    }
}
exports.TransactionFailedError = TransactionFailedError;
class GasEstimationError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = "GasEstimationError";
    }
}
exports.GasEstimationError = GasEstimationError;
class ContractDeploymentError extends Error {
    contractName;
    originalError;
    constructor(message, contractName, originalError) {
        super(message);
        this.contractName = contractName;
        this.originalError = originalError;
        this.name = "ContractDeploymentError";
    }
}
exports.ContractDeploymentError = ContractDeploymentError;
/**
 * RPC Deployment Strategy for direct blockchain interaction
 *
 * This strategy enables direct RPC communication with blockchain networks
 * for contract deployment, diamond cuts, and callback execution without
 * relying on Hardhat's deployment abstractions.
 */
class RPCDeploymentStrategy extends BaseDeploymentStrategy_1.BaseDeploymentStrategy {
    rpcUrl;
    privateKey;
    provider;
    signer;
    gasLimitMultiplier;
    maxRetries;
    retryDelayMs;
    store;
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
    constructor(rpcUrl, privateKey, gasLimitMultiplier = 1.2, maxRetries = 3, retryDelayMs = 2000, verbose = false) {
        super(verbose);
        this.rpcUrl = rpcUrl;
        this.privateKey = privateKey;
        // Validate inputs
        this.validateConstructorInputs(rpcUrl, privateKey, gasLimitMultiplier, maxRetries, retryDelayMs);
        // Initialize provider and signer
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
        this.gasLimitMultiplier = gasLimitMultiplier;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
        if (this.verbose) {
            console.log(chalk_1.default.blue(`🔗 RPC Strategy initialized with endpoint: ${rpcUrl}`));
            console.log(chalk_1.default.blue(`👤 Deployer address: ${this.signer.getAddress()}`));
        }
    }
    /**
     * Initialize step tracking store for deployment
     */
    async initializeStore(diamond) {
        const diamondConfig = diamond.getDiamondConfig();
        const network = await this.provider.getNetwork();
        const deploymentId = `${diamond.diamondName}-${diamondConfig.networkName}-${Number(network.chainId)}`;
        console.log("🔍 DEBUG: Creating RPCDeploymentStore with:", {
            diamondName: diamond.diamondName,
            deploymentId,
            deploymentsPath: diamondConfig.deploymentsPath
        });
        this.store = new utils_1.RPCDeploymentStore(diamond.diamondName, deploymentId, diamondConfig.deploymentsPath);
        // Initialize deployment metadata
        this.store.initializeDeployment(diamondConfig.networkName || 'unknown', Number(network.chainId), this.rpcUrl, await this.signer.getAddress());
        console.log("🔍 DEBUG: Store created and initialized");
        if (this.verbose) {
            console.log(chalk_1.default.blue(`📊 Step tracking initialized: ${deploymentId}`));
        }
    }
    /**
     * Save a deployment step with tracking
     */
    saveStep(stepName, description, status = 'pending') {
        if (!this.store)
            return;
        const step = {
            stepName,
            description,
            status,
            timestamp: Date.now()
        };
        this.store.saveStep(step);
        if (this.verbose) {
            const statusColor = status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'blue';
            console.log(chalk_1.default[statusColor](`📝 Step ${status}: ${stepName} - ${description}`));
        }
    }
    /**
     * Update step status with transaction details
     */
    updateStepStatus(stepName, status, txHash, contractAddress, gasUsed, error) {
        if (!this.store)
            return;
        this.store.updateStatus(stepName, status, txHash, contractAddress, error);
        const step = this.store.getStep(stepName);
        if (step && txHash) {
            step.txHash = txHash;
            step.gasUsed = gasUsed;
            this.store.saveStep(step);
        }
        if (this.verbose) {
            const statusColor = status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'yellow';
            console.log(chalk_1.default[statusColor](`🔄 Updated ${stepName}: ${status}${txHash ? ` (${txHash})` : ''}${error ? ` - ${error}` : ''}`));
        }
    }
    /**
     * Check if a step is already completed
     */
    isStepCompleted(stepName) {
        return this.store?.isStepCompleted(stepName) || false;
    }
    /**
     * Skip a step that's already completed
     */
    skipCompletedStep(stepName, description) {
        if (this.isStepCompleted(stepName)) {
            if (this.verbose) {
                console.log(chalk_1.default.gray(`⏭️  Skipping completed step: ${stepName} - ${description}`));
            }
            return true;
        }
        return false;
    }
    /**
     * Resolve diamond contract name handling multiple artifacts issue
     */
    async resolveDiamondContractName(diamondName, diamond) {
        // For GeniusDiamond, specifically use the gnus-ai version to avoid artifact conflicts
        if (diamondName === 'GeniusDiamond') {
            const gnusAiFqn = `contracts/gnus-ai/${diamondName}.sol:${diamondName}`;
            try {
                // Test if this fully qualified name exists by trying to get the artifact
                const { artifacts } = require('hardhat');
                await artifacts.readArtifact(gnusAiFqn);
                return gnusAiFqn;
            }
            catch (error) {
                if (this.verbose) {
                    console.log(chalk_1.default.yellow(`⚠️  Could not resolve ${gnusAiFqn}, falling back to simple name`));
                }
            }
        }
        // For other diamonds or if the specific resolution fails, try the original approach
        try {
            // Try the diamond name first
            const { artifacts } = require('hardhat');
            await artifacts.readArtifact(diamondName);
            return diamondName;
        }
        catch (error) {
            // If there are multiple artifacts and it's not GeniusDiamond, fall back to original logic
            return await (0, utils_1.getDiamondContractName)(diamondName, diamond);
        }
    }
    /**
     * Validates constructor inputs
     */
    validateConstructorInputs(rpcUrl, privateKey, gasLimitMultiplier, maxRetries, retryDelayMs) {
        if (!rpcUrl || typeof rpcUrl !== 'string') {
            throw new Error('Invalid RPC URL provided');
        }
        if (!privateKey || !privateKey.match(/^0x[a-fA-F0-9]{64}$/)) {
            throw new Error('Invalid private key format. Must be 64 hex characters with 0x prefix');
        }
        if (gasLimitMultiplier < 1.0 || gasLimitMultiplier > 2.0) {
            throw new Error('Gas limit multiplier must be between 1.0 and 2.0');
        }
        if (maxRetries < 1 || maxRetries > 10) {
            throw new Error('Max retries must be between 1 and 10');
        }
        if (retryDelayMs < 100 || retryDelayMs > 30000) {
            throw new Error('Retry delay must be between 100ms and 30000ms');
        }
    }
    /**
     * Retry wrapper for operations that may fail due to network issues
     */
    async withRetry(operation, operationName, maxRetries = this.maxRetries) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (this.verbose && attempt > 1) {
                    console.log(chalk_1.default.yellow(`🔄 Retrying ${operationName} (attempt ${attempt}/${maxRetries})`));
                }
                const result = await operation();
                if (attempt > 1 && this.verbose) {
                    console.log(chalk_1.default.green(`✅ ${operationName} succeeded on attempt ${attempt}`));
                }
                return result;
            }
            catch (error) {
                lastError = error;
                if (this.verbose) {
                    console.log(chalk_1.default.red(`❌ ${operationName} failed on attempt ${attempt}: ${lastError.message}`));
                }
                if (attempt < maxRetries) {
                    const delay = this.retryDelayMs * Math.pow(1.5, attempt - 1); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw new Error(`${operationName} failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
    }
    /**
     * Estimates gas for a transaction with safety multiplier
     */
    async estimateGasWithMultiplier(contract, methodName, args = []) {
        try {
            const estimatedGas = await contract[methodName].estimateGas(...args);
            const gasWithMultiplier = BigInt(Math.floor(Number(estimatedGas) * this.gasLimitMultiplier));
            if (this.verbose) {
                console.log(chalk_1.default.gray(`⛽ Gas estimate for ${methodName}: ${estimatedGas.toString()} (with multiplier: ${gasWithMultiplier.toString()})`));
            }
            return gasWithMultiplier;
        }
        catch (error) {
            throw new GasEstimationError(`Failed to estimate gas for ${methodName}: ${error.message}`, error);
        }
    }
    /**
     * Gets current gas price with optional premium
     */
    async getGasPrice() {
        try {
            const feeData = await this.provider.getFeeData();
            if (feeData.gasPrice) {
                if (this.verbose) {
                    console.log(chalk_1.default.gray(`⛽ Gas price: ${ethers_1.ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`));
                }
                return feeData.gasPrice;
            }
            else {
                // Fallback for networks that don't support getFeeData
                const gasPrice = await this.provider.send('eth_gasPrice', []);
                const gasPriceBigInt = BigInt(gasPrice);
                if (this.verbose) {
                    console.log(chalk_1.default.gray(`⛽ Gas price (fallback): ${ethers_1.ethers.formatUnits(gasPriceBigInt, "gwei")} gwei`));
                }
                return gasPriceBigInt;
            }
        }
        catch (error) {
            throw new GasEstimationError(`Failed to get gas price: ${error.message}`, error);
        }
    }
    /**
     * Deploys a contract using RPC
     */
    async deployContract(contractName, constructorArgs = [], diamond) {
        return await this.withRetry(async () => {
            try {
                // Get contract artifact using Hardhat's artifact resolution
                // This will find artifacts in all configured paths (contracts-starter, gnus-ai, etc.)
                const artifact = await (0, utils_1.getContractArtifact)(contractName, diamond);
                // Create contract factory
                const factory = new ethers_1.ContractFactory(artifact.abi, artifact.bytecode, this.signer);
                // Estimate gas for deployment
                const deployTransaction = await factory.getDeployTransaction(...constructorArgs);
                const estimatedGas = await this.provider.estimateGas({
                    data: deployTransaction.data,
                    from: await this.signer.getAddress()
                });
                const gasLimit = BigInt(Math.floor(Number(estimatedGas) * this.gasLimitMultiplier));
                // Get gas price
                const gasPrice = await this.getGasPrice();
                if (this.verbose) {
                    console.log(chalk_1.default.blue(`🚀 Deploying ${contractName} with gas limit: ${gasLimit.toString()}`));
                }
                // Deploy contract
                const contract = await factory.deploy(...constructorArgs, {
                    gasLimit,
                    gasPrice
                });
                // Wait for deployment
                const deploymentReceipt = await contract.deploymentTransaction()?.wait();
                if (!deploymentReceipt) {
                    throw new ContractDeploymentError(`Deployment transaction failed for ${contractName}`, contractName);
                }
                if (this.verbose) {
                    console.log(chalk_1.default.green(`✅ ${contractName} deployed at: ${await contract.getAddress()}`));
                    console.log(chalk_1.default.gray(`   Transaction hash: ${deploymentReceipt.hash}`));
                    console.log(chalk_1.default.gray(`   Gas used: ${deploymentReceipt.gasUsed.toString()}`));
                }
                return contract;
            }
            catch (error) {
                if (error instanceof ContractDeploymentError) {
                    throw error;
                }
                throw new ContractDeploymentError(`Failed to deploy ${contractName}: ${error.message}`, contractName, error);
            }
        }, `Deploy ${contractName}`);
    }
    /**
     * Override deployDiamondTasks to use RPC instead of Hardhat
     */
    async deployDiamondTasks(diamond) {
        // Initialize step tracking store
        await this.initializeStore(diamond);
        if (this.verbose) {
            console.log(chalk_1.default.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName} via RPC`));
        }
        try {
            // Step 1: Deploy DiamondCutFacet
            const diamondCutStepName = 'deploy-diamondcutfacet';
            if (!this.skipCompletedStep(diamondCutStepName, 'Deploy DiamondCutFacet')) {
                this.saveStep(diamondCutStepName, 'Deploy DiamondCutFacet', 'in_progress');
                const diamondCutContractName = await (0, utils_1.getContractName)("DiamondCutFacet", diamond);
                const diamondCutFacet = await this.deployContract(diamondCutContractName, [], diamond);
                const diamondCutFacetAddress = await diamondCutFacet.getAddress();
                const diamondCutTxHash = diamondCutFacet.deploymentTransaction()?.hash;
                this.updateStepStatus(diamondCutStepName, 'completed', diamondCutTxHash, diamondCutFacetAddress);
            }
            // Step 2: Deploy Diamond contract
            const diamondStepName = 'deploy-diamond';
            if (!this.skipCompletedStep(diamondStepName, 'Deploy Diamond contract')) {
                this.saveStep(diamondStepName, 'Deploy Diamond contract', 'in_progress');
                // Get DiamondCutFacet address from completed step or deploy
                const diamondCutStep = this.store?.getStep(diamondCutStepName);
                const diamondCutFacetAddress = diamondCutStep?.contractAddress;
                if (!diamondCutFacetAddress) {
                    throw new Error('DiamondCutFacet address not found from previous step');
                }
                const diamondContractName = await this.resolveDiamondContractName(diamond.diamondName, diamond);
                const diamondContract = await this.deployContract(diamondContractName, [await this.signer.getAddress(), diamondCutFacetAddress], diamond);
                const diamondContractAddress = await diamondContract.getAddress();
                const diamondTxHash = diamondContract.deploymentTransaction()?.hash;
                this.updateStepStatus(diamondStepName, 'completed', diamondTxHash, diamondContractAddress);
            }
            // Step 3: Register DiamondCutFacet selectors
            this.saveStep('register-diamondcut-selectors', 'Register DiamondCutFacet function selectors', 'in_progress');
            // Re-create DiamondCutFacet instance to get selectors
            const diamondCutContractName = await (0, utils_1.getContractName)("DiamondCutFacet", diamond);
            const diamondCutArtifact = await (0, utils_1.getContractArtifact)(diamondCutContractName, diamond);
            const diamondCutFacetAddress = this.store?.getStep(diamondCutStepName)?.contractAddress;
            const diamondCutFacet = new ethers_1.Contract(diamondCutFacetAddress, diamondCutArtifact.abi, this.signer);
            // Get function selectors for DiamondCutFacet
            const diamondCutFacetFunctionSelectors = [];
            diamondCutFacet.interface.forEachFunction((func) => {
                diamondCutFacetFunctionSelectors.push(func.selector);
            });
            // Register the DiamondCutFacet function selectors
            const diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce((acc, selector) => {
                acc[selector] = {
                    facetName: "DiamondCutFacet",
                    priority: diamond.getFacetsConfig()?.DiamondCutFacet?.priority || 1000,
                    address: diamondCutFacetAddress,
                    action: types_1.RegistryFacetCutAction.Deployed,
                };
                return acc;
            }, {});
            diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
            this.updateStepStatus('register-diamondcut-selectors', 'completed');
            // Step 4: Update deployed diamond data
            this.saveStep('update-diamond-data', 'Update deployed diamond data', 'in_progress');
            const deployedDiamondData = diamond.getDeployedDiamondData();
            const diamondContractAddress = this.store?.getStep('deploy-diamond')?.contractAddress;
            deployedDiamondData.DeployerAddress = await this.signer.getAddress();
            deployedDiamondData.DiamondAddress = diamondContractAddress;
            deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
            deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
                address: diamondCutFacetAddress,
                tx_hash: this.store?.getStep(diamondCutStepName)?.txHash || "",
                version: 0,
                funcSelectors: diamondCutFacetFunctionSelectors,
            };
            diamond.updateDeployedDiamondData(deployedDiamondData);
            this.updateStepStatus('update-diamond-data', 'completed');
            if (this.verbose) {
                console.log(chalk_1.default.green(`✅ Diamond deployed at ${diamondContractAddress}, DiamondCutFacet at ${diamondCutFacetAddress}`));
            }
        }
        catch (error) {
            const errorMessage = error.message;
            if (this.store) {
                this.store.markDeploymentFailed(errorMessage);
            }
            console.error(chalk_1.default.red(`❌ Failed to deploy diamond via RPC: ${errorMessage}`));
            throw error;
        }
    }
    /**
     * Override deployFacetsTasks to use RPC instead of Hardhat
     */
    async deployFacetsTasks(diamond) {
        console.log("🔍 DEBUG: RPCDeploymentStrategy.deployFacetsTasks called");
        const deployConfig = diamond.getDeployConfig();
        const facetsConfig = diamond.getDeployConfig().facets;
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const sortedFacetNames = Object.keys(deployConfig.facets)
            .sort((a, b) => {
            return (deployConfig.facets[a].priority || 1000) - (deployConfig.facets[b].priority || 1000);
        });
        // Deploy facets sequentially to maintain order
        for (const facetName of sortedFacetNames) {
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = deployedDiamondData.DeployedFacets?.[facetName]?.version ?? -1;
            const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
            const upgradeVersion = Math.max(...availableVersions);
            if (upgradeVersion > deployedVersion || deployedVersion === -1) {
                const facetStepName = `deploy-facet-${facetName.toLowerCase()}`;
                if (this.skipCompletedStep(facetStepName, `Deploy ${facetName} facet`)) {
                    continue;
                }
                this.saveStep(facetStepName, `Deploy ${facetName} facet v${upgradeVersion}`, 'in_progress');
                if (this.verbose) {
                    console.log(chalk_1.default.blueBright(`🚀 Deploying facet: ${facetName} to version ${upgradeVersion} via RPC`));
                }
                try {
                    // Deploy the facet contract using RPC
                    const facetContractName = await (0, utils_1.getContractName)(facetName, diamond);
                    const facetContract = await this.deployContract(facetContractName, [], diamond);
                    const facetAddress = await facetContract.getAddress();
                    const facetTxHash = facetContract.deploymentTransaction()?.hash;
                    const facetSelectors = [];
                    facetContract.interface.forEachFunction((func) => {
                        facetSelectors.push(func.selector);
                    });
                    // Initializer function Registry
                    const deployInit = facetConfig.versions?.[upgradeVersion]?.deployInit || "";
                    const upgradeInit = facetConfig.versions?.[upgradeVersion]?.upgradeInit || "";
                    const initFn = diamond.newDeployment ? deployInit : upgradeInit;
                    if (initFn && facetName !== deployConfig.protocolInitFacet) {
                        diamond.initializerRegistry.set(facetName, initFn);
                    }
                    const newFacetData = {
                        priority: facetConfig.priority || 1000,
                        address: facetAddress,
                        tx_hash: facetTxHash || "",
                        version: upgradeVersion,
                        funcSelectors: facetSelectors,
                        deployInclude: facetConfig.versions?.[upgradeVersion]?.deployInclude || [],
                        deployExclude: facetConfig.versions?.[upgradeVersion]?.deployExclude || [],
                        initFunction: initFn,
                        verified: false,
                    };
                    diamond.updateNewDeployedFacets(facetName, newFacetData);
                    // Update step status with deployment info
                    this.updateStepStatus(facetStepName, 'completed', facetTxHash, facetAddress);
                    console.log(chalk_1.default.cyan(`⛵ ${facetName} deployed at ${facetAddress} with ${facetSelectors.length} selectors.`));
                    if (this.verbose) {
                        console.log(chalk_1.default.gray(`  Selectors:`), facetSelectors);
                    }
                }
                catch (error) {
                    const errorMessage = error.message;
                    this.updateStepStatus(facetStepName, 'failed', undefined, undefined, undefined, errorMessage);
                    console.error(chalk_1.default.red(`❌ Failed to deploy facet ${facetName}: ${errorMessage}`));
                    throw error;
                }
            }
        }
    }
    /**
     * Override performDiamondCutTasks to use RPC instead of Hardhat
     */
    async performDiamondCutTasks(diamond) {
        const deployConfig = diamond.getDeployConfig();
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const diamondCutStepName = 'perform-diamond-cut';
        if (this.skipCompletedStep(diamondCutStepName, 'Perform diamond cut')) {
            return;
        }
        this.saveStep(diamondCutStepName, 'Perform diamond cut to add facets', 'in_progress');
        try {
            // Get diamond contract using RPC
            const diamondAddress = deployedDiamondData.DiamondAddress;
            // Load IDiamondCut ABI using Hardhat artifact resolution
            const diamondCutArtifact = await (0, utils_1.getContractArtifact)("IDiamondCut", diamond);
            const diamondContract = new ethers_1.Contract(diamondAddress, diamondCutArtifact.abi, this.signer);
            // Setup initCallData with Atomic Protocol Initializer
            const [initCalldata, initAddress] = await this.getInitCalldata(diamond);
            // Extract facet cuts from the selector registry 
            const facetCuts = await this.getFacetCuts(diamond);
            // Validate no orphaned selectors
            await this.validateNoOrphanedSelectors(facetCuts);
            if (this.verbose) {
                console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s) via RPC:`));
                for (const cut of facetCuts) {
                    console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                    console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
                }
                if (initAddress !== ethers_1.ethers.ZeroAddress) {
                    console.log(chalk_1.default.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
                }
            }
            // Prepare the diamond cut transaction
            const facetSelectorCutMap = facetCuts.map(fc => ({
                facetAddress: fc.facetAddress,
                action: fc.action,
                functionSelectors: fc.functionSelectors
            }));
            // Estimate gas for diamond cut
            const gasLimit = await this.estimateGasWithMultiplier(diamondContract, 'diamondCut', [facetSelectorCutMap, initAddress, initCalldata]);
            // Get gas price
            const gasPrice = await this.getGasPrice();
            // Perform the diamond cut
            const tx = await diamondContract.diamondCut(facetSelectorCutMap, initAddress, initCalldata, { gasLimit, gasPrice });
            console.log(chalk_1.default.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
            console.log(chalk_1.default.gray(`   Transaction hash: ${tx.hash}`));
            // Wait for transaction confirmation
            const receipt = await tx.wait();
            if (!receipt) {
                throw new TransactionFailedError("DiamondCut transaction failed", tx.hash);
            }
            if (this.verbose) {
                console.log(chalk_1.default.gray(`   Gas used: ${receipt.gasUsed.toString()}`));
                console.log(chalk_1.default.gray(`   Block number: ${receipt.blockNumber}`));
            }
            // Update step status with transaction details
            this.updateStepStatus(diamondCutStepName, 'completed', tx.hash, diamondAddress, receipt.gasUsed.toString());
            // Update the deployed diamond data
            const txHash = tx.hash;
            await this.postDiamondCutDeployedDataUpdate(diamond, txHash);
            console.log(chalk_1.default.green(`✅ DiamondCut executed: ${tx.hash}`));
            // Execute initializer functions
            await this.executeInitializerFunctions(diamond);
            // Mark deployment as complete
            if (this.store) {
                this.store.markDeploymentComplete();
            }
        }
        catch (error) {
            const errorMessage = error.message;
            this.updateStepStatus(diamondCutStepName, 'failed', undefined, undefined, undefined, errorMessage);
            if (this.store) {
                this.store.markDeploymentFailed(errorMessage);
            }
            console.error(chalk_1.default.red(`❌ Failed to perform diamond cut via RPC: ${error.message}`));
            throw error;
        }
    }
    /**
     * Executes initializer functions for deployed facets
     */
    async executeInitializerFunctions(diamond) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const diamondAddress = deployedDiamondData.DiamondAddress;
        for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
            const initStepName = `init-${facetName.toLowerCase()}`;
            if (this.skipCompletedStep(initStepName, `Initialize ${facetName} facet`)) {
                continue;
            }
            this.saveStep(initStepName, `Execute ${initFunction} from ${facetName} facet`, 'in_progress');
            if (this.verbose) {
                console.log(chalk_1.default.blueBright(`▶ Running ${initFunction} from the ${facetName} facet via RPC`));
            }
            try {
                // Get facet contract name and load ABI using artifact resolution
                const facetContractName = await (0, utils_1.getContractName)(facetName, diamond);
                const facetArtifact = await (0, utils_1.getContractArtifact)(facetContractName, diamond);
                const initContract = new ethers_1.Contract(diamondAddress, facetArtifact.abi, this.signer);
                // Estimate gas for initializer function
                const gasLimit = await this.estimateGasWithMultiplier(initContract, initFunction);
                const gasPrice = await this.getGasPrice();
                // Execute initializer function
                const tx = await initContract[initFunction]({ gasLimit, gasPrice });
                console.log(chalk_1.default.blueBright(`🔄 Waiting for ${facetName}.${initFunction} to be mined...`));
                const receipt = await tx.wait();
                if (!receipt) {
                    throw new TransactionFailedError(`${facetName}.${initFunction} transaction failed`, tx.hash);
                }
                if (this.verbose) {
                    console.log(chalk_1.default.gray(`   Transaction hash: ${tx.hash}`));
                    console.log(chalk_1.default.gray(`   Gas used: ${receipt.gasUsed.toString()}`));
                }
                // Update step status with transaction details
                this.updateStepStatus(initStepName, 'completed', tx.hash, diamondAddress, receipt.gasUsed.toString());
                console.log(chalk_1.default.green(`✅ ${facetName}.${initFunction} executed`));
            }
            catch (error) {
                const errorMessage = error.message;
                this.updateStepStatus(initStepName, 'failed', undefined, undefined, undefined, errorMessage);
                console.error(chalk_1.default.red(`❌ Failed to execute ${facetName}.${initFunction}: ${errorMessage}`));
                throw error;
            }
        }
    }
    /**
     * Checks network connection and validates signer
     */
    async validateConnection() {
        try {
            await this.withRetry(async () => {
                // Check provider connection
                const network = await this.provider.getNetwork();
                const balance = await this.provider.getBalance(await this.signer.getAddress());
                if (this.verbose) {
                    console.log(chalk_1.default.blue(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`));
                    console.log(chalk_1.default.blue(`💰 Deployer balance: ${ethers_1.ethers.formatEther(balance)} ETH`));
                }
                // Verify minimum balance (0.01 ETH)
                if (balance < (0, ethers_1.parseUnits)("0.01", 18)) {
                    console.warn(chalk_1.default.yellow(`⚠️ Low balance detected: ${ethers_1.ethers.formatEther(balance)} ETH`));
                }
            }, "Network connection validation");
        }
        catch (error) {
            throw new RPCConnectionError(`Failed to validate RPC connection: ${error.message}`, error);
        }
    }
    /**
     * Gets the provider instance
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Gets the signer instance
     */
    getSigner() {
        return this.signer;
    }
    /**
     * Gets deployment strategy configuration
     */
    getConfig() {
        return {
            rpcUrl: this.rpcUrl,
            signerAddress: this.signer.getAddress(),
            gasLimitMultiplier: this.gasLimitMultiplier,
            maxRetries: this.maxRetries,
            retryDelayMs: this.retryDelayMs,
            verbose: this.verbose
        };
    }
    // Pre-deploy hooks with connection validation
    async preDeployDiamond(diamond) {
        await this.validateConnection();
        await super.preDeployDiamond(diamond);
    }
    async preDeployFacetsTasks(diamond) {
        console.log("🔍 DEBUG: preDeployFacetsTasks called for", diamond.diamondName);
        await this.validateConnection();
        await super.preDeployFacetsTasks(diamond);
    }
    async prePerformDiamondCutTasks(diamond) {
        console.log("🔍 DEBUG: prePerformDiamondCutTasks called for", diamond.diamondName);
        await this.validateConnection();
        // Initialize step tracking store for both new deployments and upgrades
        if (!this.store) {
            console.log("🔍 DEBUG: Initializing store...");
            await this.initializeStore(diamond);
            console.log("🔍 DEBUG: Store initialized:", !!this.store);
        }
        else {
            console.log("🔍 DEBUG: Store already exists:", !!this.store);
        }
        await super.prePerformDiamondCutTasks(diamond);
    }
}
exports.RPCDeploymentStrategy = RPCDeploymentStrategy;
//# sourceMappingURL=RPCDeploymentStrategy.js.map