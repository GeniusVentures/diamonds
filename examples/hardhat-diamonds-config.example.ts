// Example hardhat.config.ts extension for hardhat-diamonds integration
// This would be used when the hardhat-diamonds plugin is available

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
// import "@gnus.ai/hardhat-diamonds"; // When available

const config: HardhatUserConfig = {
  solidity: "0.8.17",

  // Extended configuration for hardhat-diamonds plugin
  diamonds: {
    // Multiple diamond configurations can be defined
    ProxyDiamond: {
      deploymentsPath: "./diamonds",
      contractsPath: "./contracts",
      callbacksPath: "./diamonds/ProxyDiamond/callbacks",
      configFilePath: "./diamonds/ProxyDiamond/proxydiamond.config.json",
      // Network-specific deployment file paths will be auto-generated
    },

    TestDiamond: {
      deploymentsPath: "./test-diamonds",
      contractsPath: "./test/mocks/contracts",
      callbacksPath: "./test-diamonds/TestDiamond/callbacks",
      configFilePath: "./test-diamonds/TestDiamond/testdiamond.config.json",
    },

    // More diamonds can be configured...
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Other networks...
  },
};

export default config;
