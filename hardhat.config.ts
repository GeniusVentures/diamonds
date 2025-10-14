import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-ethers/types";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-diamonds";
import { HardhatUserConfig } from "hardhat/config";

// Load environment variables
process.loadEnvFile('.env');

const {
  MAINNET_RPC_URL,
  SEPOLIA_RPC_URL,
  POLYGON_RPC_URL,
  POLYGON_MUMBAI_RPC_URL,
  ARBITRUM_RPC_URL,
  OPTIMISM_RPC_URL,
  DEPLOYER_PRIVATE_KEY,
  TEST_PRIVATE_KEY_1,
  TEST_PRIVATE_KEY_2,
  ETHERSCAN_API_KEY,
  POLYGONSCAN_API_KEY,
  ARBISCAN_API_KEY,
  OPTIMISTIC_ETHERSCAN_API_KEY,
  TEST_NETWORK = "sepolia",
  MAX_GAS_PRICE = "100",
  MAX_GAS_LIMIT = "8000000"
} = process.env;

// Default test private key (DO NOT use in production)
const DEFAULT_TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 0
      },
      forking: process.env.NODE_ENV === "test" && TEST_NETWORK && TEST_NETWORK !== "hardhat" ? {
        url: getNetworkUrl(TEST_NETWORK),
        blockNumber: undefined // Use latest block
      } : undefined,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9 // Convert Gwei to Wei
    },

    // Ethereum Networks
    mainnet: {
      url: MAINNET_RPC_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [DEFAULT_TEST_PRIVATE_KEY],
      chainId: 1,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: [
        DEPLOYER_PRIVATE_KEY || DEFAULT_TEST_PRIVATE_KEY,
        TEST_PRIVATE_KEY_1 || DEFAULT_TEST_PRIVATE_KEY,
        TEST_PRIVATE_KEY_2 || DEFAULT_TEST_PRIVATE_KEY
      ].filter(Boolean),
      chainId: 11155111,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9
    },

    // Polygon Networks
    polygon: {
      url: POLYGON_RPC_URL || "https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [DEFAULT_TEST_PRIVATE_KEY],
      chainId: 137,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9
    },
    mumbai: {
      url: POLYGON_MUMBAI_RPC_URL || "https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY",
      accounts: [
        DEPLOYER_PRIVATE_KEY || DEFAULT_TEST_PRIVATE_KEY,
        TEST_PRIVATE_KEY_1 || DEFAULT_TEST_PRIVATE_KEY,
        TEST_PRIVATE_KEY_2 || DEFAULT_TEST_PRIVATE_KEY
      ].filter(Boolean),
      chainId: 80001,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9
    },

    // Arbitrum Networks
    arbitrum: {
      url: ARBITRUM_RPC_URL || "https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [DEFAULT_TEST_PRIVATE_KEY],
      chainId: 42161,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9
    },

    // Optimism Networks
    optimism: {
      url: OPTIMISM_RPC_URL || "https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [DEFAULT_TEST_PRIVATE_KEY],
      chainId: 10,
      gas: parseInt(MAX_GAS_LIMIT),
      gasPrice: parseInt(MAX_GAS_PRICE) * 1e9
    }
  },
  paths: {
    sources: "./test/mocks/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: parseInt(process.env.TEST_TIMEOUT || "300000")
  },
};

function getNetworkUrl(networkName: string): string {
  switch (networkName) {
    case "mainnet": return MAINNET_RPC_URL || "";
    case "sepolia": return SEPOLIA_RPC_URL || "";
    case "polygon": return POLYGON_RPC_URL || "";
    case "mumbai": return POLYGON_MUMBAI_RPC_URL || "";
    case "arbitrum": return ARBITRUM_RPC_URL || "";
    case "optimism": return OPTIMISM_RPC_URL || "";
    default: return "";
  }
}

export default config;