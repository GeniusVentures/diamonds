import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
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
import { ethers } from "hardhat";
import { join } from "path";
import chalk from "chalk";
import { logTx, logDiamondLoupe, getDeployedFacets, getDeployedFacetInterfaces } from "../utils";

export class BaseDeploymentStrategy implements DeploymentStrategy {
  constructor(protected verbose: boolean = false) { }

  // Pre-hook for deploying the diamond (can be overridden by subclasses)
  protected async preDeployDiamond(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`🔧 Running pre-deploy logic for diamond ${diamond.diamondName}`));
    }
    await this.preDeployDiamondTasks(diamond);
  }

  protected async preDeployDiamondTasks(diamond: Diamond): Promise<void> { }

  async deployDiamond(diamond: Diamond): Promise<void> {
    await this._deployDiamond(diamond); // Core logic
  }

  // Core logic for deploying the diamond
  protected async _deployDiamond(diamond: Diamond): Promise<void> {
    console.log(chalk.blueBright(`🚀 Explicitly deploying DiamondCutFacet and Diamond for ${diamond.diamondName}`));

    // Deploy the DiamondCutFacet
    const diamondCutFactory = await ethers.getContractFactory("DiamondCutFacet", diamond.getSigner()!);
    const diamondCutFacet = await diamondCutFactory.deploy();
    await diamondCutFacet.deployed();

    // Deploy the Diamond
    const diamondArtifactName = `${diamond.diamondName}.sol:${diamond.diamondName}`;
    const diamondArtifactPath = join(diamond.contractsPath, diamondArtifactName);
    const diamondFactory = await ethers.getContractFactory(diamondArtifactPath, diamond.getSigner()!);
    const diamondContract = await diamondFactory.deploy(diamond.getSigner()!.getAddress(), diamondCutFacet.address);
    await diamondContract.deployed();

    // Get function selectors for DiamondCutFacet
    const diamondCutFacetFunctionSelectors = Object.keys(diamondCutFacet.interface.functions).map(fn =>
      diamondCutFacet.interface.getSighash(fn)
    );

    // Register the DiamondCutFacet function selectors
    const diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce((acc, selector) => {
      acc[selector] = {
        facetName: "DiamondCutFacet",
        priority: diamond.getFacetsConfig()?.DiamondCutFacet?.priority || 1000, // Default priority if not set
        address: diamondCutFacet.address,
        action: RegistryFacetCutAction.Deployed,
      };
      return acc;
    }, {} as Record<string, Omit<FunctionSelectorRegistryEntry, "selector">>);

    diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);

    // Update deployed diamond data
    const deployedDiamondData = diamond.getDeployedDiamondData();
    deployedDiamondData.DeployerAddress = await diamond.getSigner()!.getAddress();
    deployedDiamondData.DiamondAddress = diamondContract.address;
    deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
    deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
      address: diamondCutFacet.address,
      tx_hash: diamondCutFacet.deployTransaction.hash,
      version: 0,
      funcSelectors: diamondCutFacetFunctionSelectors,
    };

    diamond.updateDeployedDiamondData(deployedDiamondData);

    console.log(chalk.green(`✅ Diamond deployed at ${diamondContract.address}, DiamondCutFacet at ${diamondCutFacet.address}`));
  }

  // Post-hook for deploying the diamond (can be overridden by subclasses)
  async postDeployDiamond(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`✅ Running post-deploy logic for diamond ${diamond.diamondName}`));
    }
    await this.postDeployDiamondTasks(diamond);
  }

  // Core logic for post-deploying the diamond (can be overridden by subclasses)
  protected async postDeployDiamondTasks(diamond: Diamond): Promise<void> { }

  // Pre-hook for deploying facets
  async preDeployFacets(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`🔧 Running pre-deploy logic for facets of diamond ${diamond.diamondName}`));
    }
    await this.preDeployFacetsTasks(diamond);
  }

  // Core logic for deploying facets (can be overridden by subclasses)
  protected async preDeployFacetsTasks(diamond: Diamond): Promise<void> { }

  // Base logic for Facet deployment
  async deployFacets(diamond: Diamond): Promise<void> {
    await this._deployFacets(diamond);
  }

  // Core logic for deploying facets
  protected async _deployFacets(diamond: Diamond) {
    const deployConfig = diamond.getDeployConfig();
    const facetsConfig = diamond.getDeployConfig().facets;
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const deployedFacets = deployedDiamondData.DeployedFacets || {};
    const facetCuts: FacetDeploymentInfo[] = [];

    // const sortedFacetNames = Object.keys(facetsConfig).sort((a, b) => {
    //   return (facetsConfig[a].priority || 1000) - (facetsConfig[b].priority || 1000);
    // });

    const sortedFacetNames = Object.keys(deployConfig.facets)
      .sort((a, b) => {
        return (deployConfig.facets[a].priority || 1000) - (deployConfig.facets[b].priority || 1000);
      });

    // Save the facet deployment info
    for (const facetName of sortedFacetNames) {
      const facetConfig = facetsConfig[facetName];
      const deployedVersion = deployedDiamondData.DeployedFacets?.[facetName]?.version ?? -1;
      const availableVersions = Object.keys(facetConfig.versions || {}).map(Number);
      const upgradeVersion = Math.max(...availableVersions);

      if (upgradeVersion > deployedVersion || deployedVersion === -1) {
        if (this.verbose) {
          console.log(chalk.blueBright(`🚀 Deploying facet: ${facetName} to version ${upgradeVersion}`));
        }
        // Deploy the facet contract
        const signer = diamond.getSigner()!;
        // const signerAddress = await signer.getAddress();
        const facetFactory = await ethers.getContractFactory(facetName, { signer });
        const facetContract = await facetFactory.deploy();
        await facetContract.deployed();

        const deployedFacets = new Map<string, DeployedFacet>();
        const availableVersions = Object.keys(facetConfig.versions ?? {}).map(Number);
        const facetSelectors = Object.keys(facetContract.interface.functions)
          .map(fn => facetContract.interface.getSighash(fn));

        // Initializer function Registry
        const deployInit = facetConfig.versions?.[upgradeVersion]?.deployInit || "";
        const upgradeInit = facetConfig.versions?.[upgradeVersion]?.upgradeInit || "";

        const initFn = diamond.newDeployment ? deployInit : upgradeInit;
        if (initFn && facetName !== deployConfig.protocolInitFacet) {
          diamond.initializerRegistry.set(facetName, initFn);
        }

        const newFacetData: NewDeployedFacet = {
          priority: facetConfig.priority || 1000,
          address: facetContract.address,
          tx_hash: facetContract.deployTransaction.hash,
          version: upgradeVersion,
          funcSelectors: facetSelectors,
          deployInclude: facetConfig.versions?.[upgradeVersion]?.deployInclude || [],
          deployExclude: facetConfig.versions?.[upgradeVersion]?.deployExclude || [],
          initFunction: initFn,
          verified: false,
        };

        diamond.updateNewDeployedFacets(facetName, newFacetData);

        console.log(chalk.cyan(`⛵ Deployed at ${facetContract.address} with ${facetSelectors.length} selectors.`));
        // Log the deployment transaction and selectors
        if (this.verbose) {
          console.log(chalk.gray(`  Selectors:`), facetSelectors);
        }
      }

    }
  }

  // Post-hook for deploying facets
  async postDeployFacets(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`✅ Running post-deploy logic for facets of diamond ${diamond.diamondName}`));
    }
    await this.postDeployFacetsTasks(diamond);
  }

  // Used by subclasses for facet post-deployment tasks
  protected async postDeployFacetsTasks(diamond: Diamond): Promise<void> { }

  async updateFunctionSelectorRegistry(diamond: Diamond) {
    this._updateFunctionSelectorRegistry(diamond);
  }

  // Pre-hook for updating function selector registry (can be overridden by subclasses)
  protected async preUpdateFunctionSelectorRegistry(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`🔧 Running pre-update logic for function selector registry of diamond ${diamond.diamondName}`));
    }
  }

  // Post-hook for updating function selector registry (can be overridden by subclasses)
  protected async postUpdateFunctionSelectorRegistry(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`✅ Running post-update logic for function selector registry of diamond ${diamond.diamondName}`));
    }
  }

  // 
  protected async _updateFunctionSelectorRegistry(
    diamond: Diamond,
  ): Promise<void> {
    const registry = diamond.functionSelectorRegistry;
    const zeroAddress = ethers.constants.AddressZero;

    const newDeployedFacets = diamond.getNewDeployedFacets();
    const newDeployedFacetsByPriority = Object.entries(newDeployedFacets).sort(([, a], [, b]) =>
      (a.priority || 1000) - (b.priority || 1000)
    );

    for (const [newFacetName, newFacetData] of newDeployedFacetsByPriority) {
      const currentFacetAddress = newFacetData.address;
      const priority: number = newFacetData.priority;
      const functionSelectors: string[] = newFacetData.funcSelectors || [];
      const includeFuncSelectors: string[] = newFacetData.deployInclude || [];
      const excludeFuncSelectors: string[] = newFacetData.deployExclude || [];

      /* ------------------ Exclusion Filter ------------------ */
      for (const excludeFuncSelector of excludeFuncSelectors) {
        // remove from the facets functionSelectors
        if (excludeFuncSelector in functionSelectors) {
          functionSelectors.splice(functionSelectors.indexOf(excludeFuncSelector), 1);
        }
        // update action to remove if excluded from registry where a previous deployment associated with facetname
        if (excludeFuncSelector in registry && registry.get(excludeFuncSelector)?.facetName === newFacetName) {
          const existing = registry.get(excludeFuncSelector);
          if (existing && existing.facetName === newFacetName) {
            registry.set(excludeFuncSelector, {
              priority: priority,
              address: currentFacetAddress,
              action: RegistryFacetCutAction.Remove,
              facetName: newFacetName,
            });
          }
        }
      }

      /* ------------ Higher Priority Split of Registry ------------------ */
      const registryHigherPrioritySplit = Array.from(registry.entries())
        .filter(([_, entry]) => entry.priority > priority)
        .reduce((acc, [selector, entry]) => {
          if (!acc[entry.facetName]) {
            acc[entry.facetName] = [];
          }
          acc[entry.facetName].push(selector);
          return acc;
        }, {} as Record<string, string[]>);

      /* ------------------ Inclusion Override Filter ------------------ */
      for (const includeFuncSelector of includeFuncSelectors) {
        // Force Replace if already registered by higher priority facet
        if (includeFuncSelector in registryHigherPrioritySplit) {
          const higherPriorityFacet = Object.keys(registryHigherPrioritySplit).find(facetName => {
            return registryHigherPrioritySplit[facetName].includes(includeFuncSelector);
          });
          if (higherPriorityFacet) {
            registry.set(includeFuncSelector, {
              priority: priority,
              address: currentFacetAddress,
              action: RegistryFacetCutAction.Replace,
              facetName: newFacetName,
            });
          }
        } else {
          // Add to the registry
          registry.set(includeFuncSelector, {
            priority: priority,
            address: currentFacetAddress,
            action: RegistryFacetCutAction.Add,
            facetName: newFacetName,
          });
        }

        // remove from the funcSels so it is not modified in Priority Resolution Pass
        if (includeFuncSelector in newDeployedFacets) {
          const existing = newDeployedFacets[newFacetName];
          if (existing && existing.funcSelectors) {
            existing.funcSelectors.splice(existing.funcSelectors.indexOf(includeFuncSelector), 1);
          }
        }
      }

      /* ------------------ Replace Facet and Priority Resolution Pass ------------- */
      for (const selector of functionSelectors) {
        const existing = registry.get(selector);
        if (existing) {
          const existingPriority = existing.priority;

          if (existing.facetName === newFacetName) {
            // Same facet, update the address
            registry.set(selector, {
              priority: priority,
              address: currentFacetAddress,
              action: RegistryFacetCutAction.Replace,
              facetName: newFacetName,
            });
          } else if (priority < existingPriority) {
            // Current facet has higher priority, Replace it
            registry.set(selector, {
              priority: priority,
              address: currentFacetAddress,
              action: RegistryFacetCutAction.Replace,
              facetName: newFacetName,
            });
          }

        } else {
          // New selector, simply add
          registry.set(selector, {
            priority: priority,
            address: currentFacetAddress,
            action: RegistryFacetCutAction.Add,
            facetName: newFacetName,
          });
        }
      }

      /* ---------------- Remove Old Function Selectors from facets -------------- */
      // Set functionselectors with the newFacetName and still different address to Remove
      for (const [selector, entry] of registry.entries()) {
        if (entry.facetName === newFacetName && entry.address !== currentFacetAddress) {
          registry.set(selector, {
            priority: entry.priority,
            address: zeroAddress,
            action: RegistryFacetCutAction.Remove,
            facetName: newFacetName,
          });
        }
      }
    }

    // `Remove` function selectors for facets no longer in config (deleted facets)
    const facetsConfig = diamond.getDeployConfig().facets;
    const facetNames = Object.keys(facetsConfig);
    for (const [selector, entry] of registry.entries()) {
      if (!facetNames.includes(entry.facetName)) {
        registry.set(selector, {
          priority: entry.priority,
          address: zeroAddress,
          action: RegistryFacetCutAction.Remove,
          facetName: entry.facetName,
        });
      }
    }
  }

  async performDiamondCut(diamond: Diamond): Promise<void> {
    await this._performDiamondCut(diamond);
  }

  // Pre-hook for performing diamond cut (can be overridden by subclasses)
  protected async prePerformDiamondCut(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`🔧 Running pre-diamond cut logic for diamond ${diamond.diamondName}`));
    }
  }

  // Post-hook for performing diamond cut (can be overridden by subclasses)
  protected async postPerformDiamondCut(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`✅ Running post-diamond cut logic for diamond ${diamond.diamondName}`));
    }
  }

  // Core logic for performing diamond cut
  protected async _performDiamondCut(diamond: Diamond): Promise<void> {
    const diamondSignerAddress = await diamond.getSigner()?.getAddress()!;
    ethers.provider = diamond.getProvider()!;
    const signer = await ethers.getSigner(diamondSignerAddress!);
    const diamondContract = await ethers.getContractAt("IDiamondCut", diamond.getDeployedDiamondData().DiamondAddress!);
    const signerDiamondContract = diamondContract.connect(signer);
    const deployConfig = diamond.getDeployConfig();
    const deployedDiamondData = diamond.getDeployedDiamondData();

    // Setup initCallData with Atomic Protocol Intializer
    const [initCalldata, initAddress] = await this.getInitCalldata(diamond);

    // extract facet cuts from the selector registry 
    const facetCuts: FacetCuts = await this.getFacetCuts(diamond);

    // Vaidate no orphaned selectors, i.e. 'Add', 'Replace' or 'Deployed' selectors with the same facetNames but different addresses
    await this.validateNoOrphanedSelectors(facetCuts);

    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
      for (const cut of facetCuts) {
        console.log(chalk.bold(`- ${FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
        console.log(chalk.gray(`  Selectors:`), cut.functionSelectors);
      }
      if (initAddress !== ethers.constants.AddressZero) {
        console.log(chalk.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
      }
    }

    /* -------------------------- Perform the diamond cut -----------------------*/
    const chainId = await ethers.provider.getNetwork();
    const facetSelectorCutMap = facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action, functionSelectors: fc.functionSelectors }));
    const tx = await signerDiamondContract.diamondCut(
      facetSelectorCutMap,
      initAddress,
      initCalldata
    );

    const ifaceList = getDeployedFacetInterfaces(deployedDiamondData);
    // Log the transaction
    if (this.verbose) {
      await logTx(tx, "DiamondCut", ifaceList);
    } else {
      console.log(chalk.blueBright(`🔄 Waiting for DiamondCut transaction to be mined...`));
      await tx.wait();
    }

    /* --------------------- Update the deployed diamond data ------------------ */
    const txHash = tx.hash;
    await this.postDiamondCutDeployedDataUpdate(diamond, txHash);

    console.log(chalk.green(`✅ DiamondCut executed: ${tx.hash}`));

    for (const [facetName, initFunction] of diamond.initializerRegistry.entries()) {
      console.log(chalk.blueBright(`▶ Running ${initFunction} from the ${facetName} facet`));
      const contract = await ethers.getContractAt(facetName, diamondSignerAddress!);
      const tx = await contract[initFunction]();
      if (this.verbose) {
        logTx(tx, `${facetName}.${initFunction}`, ifaceList);
      } else {
        console.log(chalk.blueBright(`🔄 Waiting for ${facetName}.${initFunction}} mined...`));
        await tx.wait();
      }
      console.log(chalk.green(`✅ ${facetName}.${initFunction} executed`));
    }
  }

  async getInitCalldata(diamond: Diamond): Promise<[string, string]> {
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const deployConfig = diamond.getDeployConfig();

    let initAddress = ethers.constants.AddressZero;
    let initCalldata = "0x";

    const protocolInitFacet = deployConfig.protocolInitFacet || "";
    const protocolVersion = deployConfig.protocolVersion;
    const protocolFacetInfo = diamond.getNewDeployedFacets()[protocolInitFacet];

    if (protocolInitFacet && protocolFacetInfo) {
      const versionCfg = deployConfig.facets[protocolInitFacet]?.versions?.[protocolVersion];
      const initFn = diamond.newDeployment ? versionCfg?.deployInit : versionCfg?.upgradeInit;

      if (initFn) {
        const iface = new ethers.utils.Interface([`function ${initFn}`]);
        initAddress = protocolFacetInfo.address!;
        initCalldata = iface.encodeFunctionData(initFn);
        if (this.verbose) {
          console.log(
            chalk.cyan(`🔧 Using protocol-wide initializer: ${protocolInitFacet}.${initFn}()`)
          );
        }
      }
    }

    if (initAddress === ethers.constants.AddressZero) {
      console.log(chalk.yellow(`⚠️ No protocol-wide initializer found. Using zero address.`));
    }
    diamond.setInitAddress(initAddress);
    return [initCalldata, initAddress];
  }

  async getFacetCuts(diamond: Diamond): Promise<FacetCuts> {
    const deployConfig = diamond.getDeployConfig();
    const selectorRegistry = diamond.functionSelectorRegistry;
    /* -------------------------- Prepare the facet cuts -----------------------*/
    // extract facet cuts from the selector registry 
    const facetCuts = Array.from(selectorRegistry.entries())
      .filter(([_, entry]) => entry.action !== RegistryFacetCutAction.Deployed)
      .map(([selector, entry]) => {
        return {
          facetAddress: entry.address,
          action: entry.action,
          functionSelectors: [selector],
          name: entry.facetName,
        };
      });

    return facetCuts;
  }

  async validateNoOrphanedSelectors(facetCuts: FacetCuts): Promise<void> {
    // Vaidate no orphaned selectors, i.e. 'Add', 'Replace' or 'Deployed' selectors with the same facetNames but different addresses
    const orphanedSelectors = facetCuts.filter(facetCut => {
      return facetCuts.some(otherFacetCut => {
        return (
          otherFacetCut.facetAddress !== facetCut.facetAddress &&
          otherFacetCut.name === facetCut.name &&
          (otherFacetCut.action === RegistryFacetCutAction.Add ||
            otherFacetCut.action === RegistryFacetCutAction.Replace ||
            otherFacetCut.action === RegistryFacetCutAction.Deployed)
        );
      });
    });

    if (orphanedSelectors.length > 0) {
      console.error(chalk.redBright(`❌ Orphaned selectors found for facet ${orphanedSelectors[0].name} at address ${orphanedSelectors[0].facetAddress}`));
      console.error(chalk.redBright(`  - ${orphanedSelectors[0].functionSelectors}`));
      throw new Error(`Orphaned selectors found for facet ${orphanedSelectors[0].name} at address ${orphanedSelectors[0].facetAddress}`);
    }
  }

  async postDiamondCutDeployedDataUpdate(diamond: Diamond, txHash: string): Promise<void> {
    const deployConfig = diamond.getDeployConfig();
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const selectorRegistry = diamond.functionSelectorRegistry;
    const currentVersion = deployedDiamondData.protocolVersion ?? 0;

    deployedDiamondData.protocolVersion = deployConfig.protocolVersion;

    // Aggregate selectors for each facet
    const facetSelectorsMap: Record<string, { address: string, selectors: string[] }> = {};

    for (const [selector, entry] of selectorRegistry.entries()) {
      const facetName = entry.facetName;
      if (!facetSelectorsMap[facetName]) {
        facetSelectorsMap[facetName] = { address: entry.address, selectors: [] };
      }
      if (entry.action === RegistryFacetCutAction.Add || entry.action === RegistryFacetCutAction.Replace || entry.action === RegistryFacetCutAction.Deployed) {
        facetSelectorsMap[facetName].selectors.push(selector);
      }
    }

    // Update deployed facets with aggregated selectors
    deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
    for (const [facetName, { address, selectors }] of Object.entries(facetSelectorsMap)) {
      if (selectors.length > 0) {
        deployedDiamondData.DeployedFacets[facetName] = {
          address,
          tx_hash: txHash,
          version: currentVersion,
          funcSelectors: selectors,
        };
      }
    }

    // Remove facets with no selectors
    for (const facetName of Object.keys(deployedDiamondData.DeployedFacets)) {
      if (!facetSelectorsMap[facetName] || facetSelectorsMap[facetName].selectors.length === 0) {
        delete deployedDiamondData.DeployedFacets[facetName];
      }
    }

    diamond.updateDeployedDiamondData(deployedDiamondData);
  }

  async runPostDeployCallbacks(diamond: Diamond): Promise<void> {
    await this._runPostDeployCallbacks(diamond);
  }

  // Pre-hook for running post-deployment callbacks (can be overridden by subclasses)
  protected async preRunPostDeployCallbacks(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`🔧 Running pre-post-deploy logic for diamond ${diamond.diamondName}`));
    }
  }

  // Post-hook for running post-deployment callbacks (can be overridden by subclasses)
  protected async postRunPostDeployCallbacks(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.gray(`✅ Running post-post-deploy logic for diamond ${diamond.diamondName}`));
    }
  }

  // Core logic for running post-deployment callbacks
  protected async _runPostDeployCallbacks(diamond: Diamond): Promise<void> {
    console.log(`🔄 Running post-deployment callbacks...`);

    const deployConfig = diamond.getDeployConfig();

    for (const [facetName, facetConfig] of Object.entries(deployConfig.facets)) {
      if (!facetConfig.versions) continue;

      for (const [version, config] of Object.entries(facetConfig.versions)) {
        if (config.callbacks) {
          const args: CallbackArgs = {
            diamond: diamond,
          };

          console.log(chalk.cyanBright(`Executing callback ${config.callbacks} for facet ${facetName}...`));
          await diamond.callbackManager.executeCallback(
            facetName,
            config.callbacks,
            args
          );

          console.log(chalk.magenta(`✅ Callback ${config.callbacks} executed for facet ${facetName}`));
        }
      }
    }

    console.log(chalk.greenBright`✅ All post-deployment callbacks executed.`);
  }
}
