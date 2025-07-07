import * as fs from 'fs-extra';
import * as path from 'path';
import { ConfigurationResolver } from './configurationResolver';

/**
 * Workspace setup utility for diamonds module
 * Supports both standalone and hardhat-diamonds plugin configurations
 */
export class WorkspaceSetup {

  /**
   * Initialize a new diamond workspace with default structure
   */
  static async initializeWorkspace(
    diamondName: string,
    options: {
      useHardhatPlugin?: boolean;
      contractsPath?: string;
      deploymentsPath?: string;
      createExampleConfig?: boolean;
    } = {}
  ): Promise<void> {
    const {
      useHardhatPlugin = false,
      contractsPath = './contracts',
      deploymentsPath = './diamonds',
      createExampleConfig = true
    } = options;

    console.log(`Initializing ${diamondName} workspace...`);

    // Create basic directory structure
    const diamondsDir = path.join(process.cwd(), deploymentsPath);
    const diamondDir = path.join(diamondsDir, diamondName);
    const deploymentsDir = path.join(diamondDir, 'deployments');
    const callbacksDir = path.join(diamondDir, 'callbacks');
    const contractsDir = path.join(process.cwd(), contractsPath);

    await fs.ensureDir(diamondsDir);
    await fs.ensureDir(diamondDir);
    await fs.ensureDir(deploymentsDir);
    await fs.ensureDir(callbacksDir);
    await fs.ensureDir(contractsDir);

    console.log(`✅ Created directory structure for ${diamondName}`);

    // Create default configuration file
    if (createExampleConfig) {
      await this.createDefaultConfig(diamondName, diamondDir);
    }

    // Create example callback file
    await this.createExampleCallback(diamondName, callbacksDir);

    // Create example contracts if they don't exist
    await this.createExampleContracts(contractsDir);

    // Create hardhat config extension example if requested
    if (useHardhatPlugin) {
      await this.createHardhatConfigExample(diamondName);
    }

    console.log(`✅ ${diamondName} workspace initialized successfully!`);
    console.log(`
Configuration files created:
- Diamond config: ${path.join(diamondDir, `${diamondName.toLowerCase()}.config.json`)}
- Callbacks: ${path.join(callbacksDir, 'ExampleFacet.ts')}
- Contracts: ${contractsDir}

${useHardhatPlugin ?
        '- Hardhat config example: ./hardhat-diamonds-config.example.ts' :
        '- Using standalone mode (no hardhat plugin required)'
      }

Next steps:
1. Customize your diamond configuration in the config file
2. Add your facet contracts to ${contractsPath}
3. Implement callback functions in ${path.join(callbacksDir)}
4. Deploy using: DiamondDeployer with your chosen strategy
    `);
  }

  /**
   * Create a default diamond configuration file
   */
  private static async createDefaultConfig(diamondName: string, diamondDir: string): Promise<void> {
    const configPath = path.join(diamondDir, `${diamondName.toLowerCase()}.config.json`);

    if (await fs.pathExists(configPath)) {
      console.log(`⚠️  Configuration file already exists: ${configPath}`);
      return;
    }

    const defaultConfig = {
      protocolVersion: 0.0,
      facets: {
        DiamondCutFacet: {
          priority: 10,
          versions: {
            "0.0": {}
          }
        },
        DiamondLoupeFacet: {
          priority: 20,
          versions: {
            "0.0": {}
          }
        },
        ExampleFacet: {
          priority: 30,
          versions: {
            "0.0": {
              callbacks: ["exampleCallback"],
              deployInit: "initialize()",
              upgradeInit: "reinitialize()"
            }
          }
        }
      }
    };

    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    console.log(`✅ Created default configuration: ${configPath}`);
  }

  /**
   * Create an example callback file
   */
  private static async createExampleCallback(diamondName: string, callbacksDir: string): Promise<void> {
    const callbackPath = path.join(callbacksDir, 'ExampleFacet.ts');

    if (await fs.pathExists(callbackPath)) {
      console.log(`⚠️  Callback file already exists: ${callbackPath}`);
      return;
    }

    const callbackContent = `import { CallbackArgs } from "../../../src/types";

/**
 * Example callback function for ExampleFacet
 * This function will be called after the facet is deployed
 */
export async function exampleCallback(args: CallbackArgs) {
  const { diamond } = args;
  
  console.log(\`Running example callback for \${diamond.diamondName} on \${diamond.networkName}\`);
  
  // Add your post-deployment logic here
  // For example:
  // - Initialize contract state
  // - Set up permissions
  // - Configure parameters
  
  console.log('Example callback completed successfully');
}

/**
 * Initialize function called during initial deployment
 */
export async function initialize(args: CallbackArgs) {
  const { diamond } = args;
  console.log(\`Initializing \${diamond.diamondName}...\`);
  // Add initialization logic here
}

/**
 * Reinitialize function called during upgrades
 */
export async function reinitialize(args: CallbackArgs) {
  const { diamond } = args;
  console.log(\`Reinitializing \${diamond.diamondName}...\`);
  // Add reinitialization logic here
}
`;

    await fs.writeFile(callbackPath, callbackContent);
    console.log(`✅ Created example callback: ${callbackPath}`);
  }

  /**
   * Create example contract files if they don't exist
   */
  private static async createExampleContracts(contractsDir: string): Promise<void> {
    const exampleFacetPath = path.join(contractsDir, 'ExampleFacet.sol');

    if (await fs.pathExists(exampleFacetPath)) {
      console.log(`⚠️  Example contract already exists: ${exampleFacetPath}`);
      return;
    }

    const exampleFacetContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ExampleFacet
 * @dev Example facet contract for diamond pattern
 */
contract ExampleFacet {
    // State variables
    uint256 private value;
    bool private initialized;
    
    // Events
    event ValueSet(uint256 newValue);
    event Initialized();
    
    /**
     * @dev Initialize the facet
     */
    function initialize() external {
        require(!initialized, "Already initialized");
        initialized = true;
        value = 0;
        emit Initialized();
    }
    
    /**
     * @dev Reinitialize during upgrades
     */
    function reinitialize() external {
        initialized = true;
        emit Initialized();
    }
    
    /**
     * @dev Set a value
     */
    function setValue(uint256 _value) external {
        require(initialized, "Not initialized");
        value = _value;
        emit ValueSet(_value);
    }
    
    /**
     * @dev Get the current value
     */
    function getValue() external view returns (uint256) {
        return value;
    }
    
    /**
     * @dev Check if initialized
     */
    function isInitialized() external view returns (bool) {
        return initialized;
    }
}
`;

    await fs.writeFile(exampleFacetPath, exampleFacetContent);
    console.log(`✅ Created example contract: ${exampleFacetPath}`);
  }

  /**
   * Create hardhat config example for hardhat-diamonds plugin
   */
  private static async createHardhatConfigExample(diamondName: string): Promise<void> {
    const configPath = path.join(process.cwd(), 'hardhat-diamonds-config.example.ts');

    if (await fs.pathExists(configPath)) {
      console.log(`⚠️  Hardhat config example already exists: ${configPath}`);
      return;
    }

    const configContent = `// Example hardhat.config.ts extension for hardhat-diamonds
// Copy this configuration to your hardhat.config.ts when using the hardhat-diamonds plugin

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
// import "@gnus.ai/hardhat-diamonds"; // Uncomment when plugin is available

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    diamonds?: {
      [diamondName: string]: {
        deploymentsPath?: string;
        contractsPath?: string;
        callbacksPath?: string;
        configFilePath?: string;
      };
    };
  }
}

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  
  // Diamond configurations
  diamonds: {
    ${diamondName}: {
      deploymentsPath: "./diamonds",
      contractsPath: "./contracts",
      callbacksPath: "./diamonds/${diamondName}/callbacks",
      configFilePath: "./diamonds/${diamondName}/${diamondName.toLowerCase()}.config.json",
    },
    
    // Add more diamond configurations as needed
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Add other networks as needed
  },
};

export default config;
`;

    await fs.writeFile(configPath, configContent);
    console.log(`✅ Created Hardhat config example: ${configPath}`);
  }
}
