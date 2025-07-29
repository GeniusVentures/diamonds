import { BaseDeploymentStrategy } from "./BaseDeploymentStrategy";
import { Diamond } from "../core/Diamond";
import {
  FacetDeploymentInfo,
  DiamondConfig,
  FacetCutAction,
  RegistryFacetCutAction,
  CallbackArgs,
  FunctionSelectorRegistryEntry,
  NewDeployedFacet,
  FacetCuts
} from "../types";
import { DeployedDiamondData, DeployedFacet, DeployedFacets, FacetsConfig } from "../schemas";
import { ethers, JsonRpcProvider, Signer, ContractFactory, Contract, parseUnits } from "ethers";
import { join } from "path";
import chalk from "chalk";
import { logTx, logDiamondLoupe, getDeployedFacets, getDeployedFacetInterfaces, getContractName, getDiamondContractName } from "../utils";
import * as fs from "fs";

/**
 * Error classes for RPC-specific failures
 */
export class RPCConnectionError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "RPCConnectionError";
  }
}

export class TransactionFailedError extends Error {
  constructor(message: string, public readonly txHash?: string, public readonly originalError?: Error) {
    super(message);
    this.name = "TransactionFailedError";
  }
}

export class GasEstimationError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "GasEstimationError";
  }
}

export class ContractDeploymentError extends Error {
  constructor(message: string, public readonly contractName?: string, public readonly originalError?: Error) {
    super(message);
    this.name = "ContractDeploymentError";
  }
}

/**
 * RPC Deployment Strategy for direct blockchain interaction
 * 
 * This strategy enables direct RPC communication with blockchain networks
 * for contract deployment, diamond cuts, and callback execution without
 * relying on Hardhat's deployment abstractions.
 */
export class RPCDeploymentStrategy extends BaseDeploymentStrategy {
  private provider: JsonRpcProvider;
  private signer: Signer;
  private gasLimitMultiplier: number;
  private maxRetries: number;
  private retryDelayMs: number;

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
  constructor(
    private rpcUrl: string,
    private privateKey: string,
    gasLimitMultiplier: number = 1.2,
    maxRetries: number = 3,
    retryDelayMs: number = 2000,
    verbose: boolean = false
  ) {
    super(verbose);
    
    // Validate inputs
    this.validateConstructorInputs(rpcUrl, privateKey, gasLimitMultiplier, maxRetries, retryDelayMs);
    
    // Initialize provider and signer
    this.provider = new JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    this.gasLimitMultiplier = gasLimitMultiplier;
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;

    if (this.verbose) {
      console.log(chalk.blue(`🔗 RPC Strategy initialized with endpoint: ${rpcUrl}`));
      console.log(chalk.blue(`👤 Deployer address: ${this.signer.getAddress()}`));
    }
  }

  /**
   * Validates constructor inputs
   */
  private validateConstructorInputs(
    rpcUrl: string,
    privateKey: string,
    gasLimitMultiplier: number,
    maxRetries: number,
    retryDelayMs: number
  ): void {
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
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.verbose && attempt > 1) {
          console.log(chalk.yellow(`🔄 Retrying ${operationName} (attempt ${attempt}/${maxRetries})`));
        }
        
        const result = await operation();
        
        if (attempt > 1 && this.verbose) {
          console.log(chalk.green(`✅ ${operationName} succeeded on attempt ${attempt}`));
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (this.verbose) {
          console.log(chalk.red(`❌ ${operationName} failed on attempt ${attempt}: ${lastError.message}`));
        }
        
        if (attempt < maxRetries) {
          const delay = this.retryDelayMs * Math.pow(1.5, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} attempts. Last error: ${lastError!.message}`);
  }

  /**
   * Estimates gas for a transaction with safety multiplier
   */
  private async estimateGasWithMultiplier(
    contract: Contract,
    methodName: string,
    args: any[] = []
  ): Promise<bigint> {
    try {
      const estimatedGas = await contract[methodName].estimateGas(...args);
      const gasWithMultiplier = BigInt(Math.floor(Number(estimatedGas) * this.gasLimitMultiplier));
      
      if (this.verbose) {
        console.log(chalk.gray(`⛽ Gas estimate for ${methodName}: ${estimatedGas.toString()} (with multiplier: ${gasWithMultiplier.toString()})`));
      }
      
      return gasWithMultiplier;
    } catch (error) {
      throw new GasEstimationError(
        `Failed to estimate gas for ${methodName}: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Gets current gas price with optional premium
   */
  private async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      
      if (feeData.gasPrice) {
        if (this.verbose) {
          console.log(chalk.gray(`⛽ Gas price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`));
        }
        return feeData.gasPrice;
      } else {
        // Fallback for networks that don't support getFeeData
        const gasPrice = await this.provider.send('eth_gasPrice', []);
        const gasPriceBigInt = BigInt(gasPrice);
        if (this.verbose) {
          console.log(chalk.gray(`⛽ Gas price (fallback): ${ethers.formatUnits(gasPriceBigInt, "gwei")} gwei`));
        }
        return gasPriceBigInt;
      }
    } catch (error) {
      throw new GasEstimationError(
        `Failed to get gas price: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Deploys a contract using RPC
   */
  private async deployContract(
    contractName: string,
    constructorArgs: any[] = [],
    diamond: Diamond
  ): Promise<any> {
    return await this.withRetry(async () => {
      try {
        // Get contract artifact
        const artifactPath = join(diamond.contractsPath, `${contractName}.sol`, `${contractName}.json`);
        
        if (!fs.existsSync(artifactPath)) {
          throw new ContractDeploymentError(
            `Contract artifact not found: ${artifactPath}`,
            contractName
          );
        }

        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // Create contract factory
        const factory = new ContractFactory(artifact.abi, artifact.bytecode, this.signer);
        
        // Estimate gas
        const gasLimit = await factory.getDeployTransaction(...constructorArgs).then(tx => 
          BigInt(Math.floor(Number(tx.gasLimit || 0) * this.gasLimitMultiplier))
        );
        
        // Get gas price
        const gasPrice = await this.getGasPrice();
        
        if (this.verbose) {
          console.log(chalk.blue(`🚀 Deploying ${contractName} with gas limit: ${gasLimit.toString()}`));
        }
        
        // Deploy contract
        const contract = await factory.deploy(...constructorArgs, {
          gasLimit,
          gasPrice
        });
        
        // Wait for deployment
        const deploymentReceipt = await contract.deploymentTransaction()?.wait();
        
        if (!deploymentReceipt) {
          throw new ContractDeploymentError(
            `Deployment transaction failed for ${contractName}`,
            contractName
          );
        }
        
        if (this.verbose) {
          console.log(chalk.green(`✅ ${contractName} deployed at: ${await contract.getAddress()}`));
          console.log(chalk.gray(`   Transaction hash: ${deploymentReceipt.hash}`));
          console.log(chalk.gray(`   Gas used: ${deploymentReceipt.gasUsed.toString()}`));
        }
        
        return contract;
      } catch (error) {
        if (error instanceof ContractDeploymentError) {
          throw error;
        }
        throw new ContractDeploymentError(
          `Failed to deploy ${contractName}: ${(error as Error).message}`,
          contractName,
          error as Error
        );
      }
    }, `Deploy ${contractName}`);
  }

  /**
   * Override deployDiamondTasks to use RPC instead of Hardhat
   */
  protected async deployDiamondTasks(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName} via RPC`));
    }

    try {
      // Deploy the DiamondCutFacet
      const diamondCutContractName = await getContractName("DiamondCutFacet", diamond);
      const diamondCutFacet = await this.deployContract(diamondCutContractName, [], diamond);

      // Deploy the Diamond contract
      const diamondContractName = await getDiamondContractName(diamond.diamondName, diamond);
      const diamondContract = await this.deployContract(
        diamondContractName,
        [this.signer.getAddress(), await diamondCutFacet.getAddress()],
        diamond
      );

      // Get function selectors for DiamondCutFacet
      const diamondCutFacetFunctionSelectors: string[] = [];
      diamondCutFacet.interface.forEachFunction((func: any) => {
        diamondCutFacetFunctionSelectors.push(func.selector);
      });

      // Get addresses for later use
      const diamondCutFacetAddress = await diamondCutFacet.getAddress();
      const diamondContractAddress = await diamondContract.getAddress();

      // Register the DiamondCutFacet function selectors
      const diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce((acc, selector) => {
        acc[selector] = {
          facetName: "DiamondCutFacet",
          priority: diamond.getFacetsConfig()?.DiamondCutFacet?.priority || 1000,
          address: diamondCutFacetAddress,
          action: RegistryFacetCutAction.Deployed,
        };
        return acc;
      }, {} as Record<string, Omit<FunctionSelectorRegistryEntry, "selector">>);

      diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);

      // Update deployed diamond data
      const deployedDiamondData = diamond.getDeployedDiamondData();
      deployedDiamondData.DeployerAddress = await this.signer.getAddress();
      deployedDiamondData.DiamondAddress = diamondContractAddress;
      deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
      deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
        address: diamondCutFacetAddress,
        tx_hash: diamondCutFacet.deploymentTransaction()?.hash || "",
        version: 0,
        funcSelectors: diamondCutFacetFunctionSelectors,
      };

      diamond.updateDeployedDiamondData(deployedDiamondData);

      console.log(chalk.green(`✅ Diamond deployed at ${diamondContractAddress}, DiamondCutFacet at ${diamondCutFacetAddress}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to deploy diamond via RPC: ${(error as Error).message}`));
      throw error;
    }
  }

  /**
   * Override deployFacetsTasks to use RPC instead of Hardhat
   */
  protected async deployFacetsTasks(diamond: Diamond): Promise<void> {
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
        if (this.verbose) {
          console.log(chalk.blueBright(`🚀 Deploying facet: ${facetName} to version ${upgradeVersion} via RPC`));
        }

        try {
          // Deploy the facet contract using RPC
          const facetContractName = await getContractName(facetName, diamond);
          const facetContract = await this.deployContract(facetContractName, [], diamond);

          const facetSelectors: string[] = [];
          facetContract.interface.forEachFunction((func: any) => {
            facetSelectors.push(func.selector);
          });

          // Initializer function Registry
          const deployInit = facetConfig.versions?.[upgradeVersion]?.deployInit || "";
          const upgradeInit = facetConfig.versions?.[upgradeVersion]?.upgradeInit || "";

          const initFn = diamond.newDeployment ? deployInit : upgradeInit;
          if (initFn && facetName !== deployConfig.protocolInitFacet) {
            diamond.initializerRegistry.set(facetName, initFn);
          }

          const newFacetData: NewDeployedFacet = {
            priority: facetConfig.priority || 1000,
            address: await facetContract.getAddress(),
            tx_hash: facetContract.deploymentTransaction()?.hash || "",
            version: upgradeVersion,
            funcSelectors: facetSelectors,
            deployInclude: facetConfig.versions?.[upgradeVersion]?.deployInclude || [],
            deployExclude: facetConfig.versions?.[upgradeVersion]?.deployExclude || [],
            initFunction: initFn,
            verified: false,
          };

          diamond.updateNewDeployedFacets(facetName, newFacetData);

          console.log(chalk.cyan(`⛵ Deployed at ${await facetContract.getAddress()} with ${facetSelectors.length} selectors.`));
          
          if (this.verbose) {
            console.log(chalk.gray(`  Selectors:`), facetSelectors);
          }
        } catch (error) {
          console.error(chalk.red(`❌ Failed to deploy facet ${facetName}: ${(error as Error).message}`));
          throw error;
        }
      }
    }
  }

  /**
   * Override performDiamondCutTasks to use RPC instead of Hardhat
   */
  protected async performDiamondCutTasks(diamond: Diamond): Promise<void> {
    const deployConfig = diamond.getDeployConfig();
    const deployedDiamondData = diamond.getDeployedDiamondData();

    try {
      // Get diamond contract using RPC
      const diamondAddress = deployedDiamondData.DiamondAddress!;
      
      // Load IDiamondCut ABI
      const diamondCutArtifactPath = join(diamond.contractsPath, "interfaces", "IDiamondCut.sol", "IDiamondCut.json");
      if (!fs.existsSync(diamondCutArtifactPath)) {
        throw new Error(`IDiamondCut artifact not found at: ${diamondCutArtifactPath}`);
      }
      
      const diamondCutArtifact = JSON.parse(fs.readFileSync(diamondCutArtifactPath, 'utf8'));
      const diamondContract = new Contract(diamondAddress, diamondCutArtifact.abi, this.signer);

      // Setup initCallData with Atomic Protocol Initializer
      const [initCalldata, initAddress] = await this.getInitCalldata(diamond);

      // Extract facet cuts from the selector registry 
      const facetCuts: FacetCuts = await this.getFacetCuts(diamond);

      // Validate no orphaned selectors
      await this.validateNoOrphanedSelectors(facetCuts);

      if (this.verbose) {
        console.log(chalk.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s) via RPC:`));
        for (const cut of facetCuts) {
          console.log(chalk.bold(`- ${FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
          console.log(chalk.gray(`  Selectors:`), cut.functionSelectors);
        }
        if (initAddress !== ethers.ZeroAddress) {
          console.log(chalk.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
        }
      }

      // Prepare the diamond cut transaction
      const facetSelectorCutMap = facetCuts.map(fc => ({ 
        facetAddress: fc.facetAddress, 
        action: fc.action, 
        functionSelectors: fc.functionSelectors 
      }));

      // Estimate gas for diamond cut
      const gasLimit = await this.estimateGasWithMultiplier(
        diamondContract,
        'diamondCut',
        [facetSelectorCutMap, initAddress, initCalldata]
      );

      // Get gas price
      const gasPrice = await this.getGasPrice();

      // Perform the diamond cut
      const tx = await diamondContract.diamondCut(
        facetSelectorCutMap,
        initAddress,
        initCalldata,
        { gasLimit, gasPrice }
      );

      console.log(chalk.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
      console.log(chalk.gray(`   Transaction hash: ${tx.hash}`));

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new TransactionFailedError("DiamondCut transaction failed", tx.hash);
      }

      if (this.verbose) {
        console.log(chalk.gray(`   Gas used: ${receipt.gasUsed.toString()}`));
        console.log(chalk.gray(`   Block number: ${receipt.blockNumber}`));
      }

      // Update the deployed diamond data
      const txHash = tx.hash;
      await this.postDiamondCutDeployedDataUpdate(diamond, txHash);

      console.log(chalk.green(`✅ DiamondCut executed: ${tx.hash}`));

      // Execute initializer functions
      await this.executeInitializerFunctions(diamond);

    } catch (error) {
      console.error(chalk.red(`❌ Failed to perform diamond cut via RPC: ${(error as Error).message}`));
      throw error;
    }
  }

  /**
   * Executes initializer functions for deployed facets
   */
  private async executeInitializerFunctions(diamond: Diamond): Promise<void> {
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const diamondAddress = deployedDiamondData.DiamondAddress!;

    for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
      if (this.verbose) {
        console.log(chalk.blueBright(`▶ Running ${initFunction} from the ${facetName} facet via RPC`));
      }

      try {
        // Get facet contract name and load ABI
        const facetContractName = await getContractName(facetName, diamond);
        const facetArtifactPath = join(diamond.contractsPath, `${facetContractName}.sol`, `${facetContractName}.json`);
        
        if (!fs.existsSync(facetArtifactPath)) {
          throw new Error(`Facet artifact not found: ${facetArtifactPath}`);
        }

        const facetArtifact = JSON.parse(fs.readFileSync(facetArtifactPath, 'utf8'));
        const initContract = new Contract(diamondAddress, facetArtifact.abi, this.signer);

        // Estimate gas for initializer function
        const gasLimit = await this.estimateGasWithMultiplier(initContract, initFunction);
        const gasPrice = await this.getGasPrice();

        // Execute initializer function
        const tx = await initContract[initFunction]({ gasLimit, gasPrice });

        console.log(chalk.blueBright(`🔄 Waiting for ${facetName}.${initFunction} to be mined...`));
        
        const receipt = await tx.wait();
        
        if (!receipt) {
          throw new TransactionFailedError(`${facetName}.${initFunction} transaction failed`, tx.hash);
        }

        if (this.verbose) {
          console.log(chalk.gray(`   Transaction hash: ${tx.hash}`));
          console.log(chalk.gray(`   Gas used: ${receipt.gasUsed.toString()}`));
        }

        console.log(chalk.green(`✅ ${facetName}.${initFunction} executed`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to execute ${facetName}.${initFunction}: ${(error as Error).message}`));
        throw error;
      }
    }
  }

  /**
   * Checks network connection and validates signer
   */
  async validateConnection(): Promise<void> {
    try {
      await this.withRetry(async () => {
        // Check provider connection
        const network = await this.provider.getNetwork();
        const balance = await this.provider.getBalance(await this.signer.getAddress());

        if (this.verbose) {
          console.log(chalk.blue(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`));
          console.log(chalk.blue(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`));
        }

        // Verify minimum balance (0.01 ETH)
        if (balance < parseUnits("0.01", 18)) {
          console.warn(chalk.yellow(`⚠️ Low balance detected: ${ethers.formatEther(balance)} ETH`));
        }
      }, "Network connection validation");
    } catch (error) {
      throw new RPCConnectionError(
        `Failed to validate RPC connection: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Gets the provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Gets the signer instance
   */
  getSigner(): Signer {
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
  async preDeployDiamond(diamond: Diamond): Promise<void> {
    await this.validateConnection();
    await super.preDeployDiamond(diamond);
  }

  async preDeployFacets(diamond: Diamond): Promise<void> {
    await this.validateConnection();
    await super.preDeployFacets(diamond);
  }

  async prePerformDiamondCut(diamond: Diamond): Promise<void> {
    await this.validateConnection();
    await super.prePerformDiamondCut(diamond);
  }
}
