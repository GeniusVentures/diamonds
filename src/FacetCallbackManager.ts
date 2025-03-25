import * as fs from "fs";
import { resolve } from "path";
import { Signer } from "ethers";
import { INetworkDeployInfo } from "./types"; // Adjust the path as needed

interface CallbackArgs {

  deployer: Signer;
  networkName: string;
  chainId: number;
  deployInfo: INetworkDeployInfo;
}

class FacetCallbackManager {
  private callbacks: { [facetName: string]: { [callbackName: string]: (args: CallbackArgs) => Promise<void> } } = {};

  constructor(facetCallbacksPath: string) {
    this.loadCallbacks(facetCallbacksPath);
  }

  private loadCallbacks(facetCallbacksPath: string): void {
    const files = fs.readdirSync(facetCallbacksPath);

    for (const file of files) {
      if (!file.endsWith(".ts")) continue; // Only process TypeScript files
      const facetName = file.split(".")[0]; // Extract facet name from file name
      const filePath = resolve(facetCallbacksPath, file);
      const module = require(filePath);

      this.callbacks[facetName] = {};

      // Register all functions prefixed with "callback"
      for (const [key, value] of Object.entries(module)) {
        if (key.startsWith("callback") && typeof value === "function") {
          this.callbacks[facetName][key] = value as (args: CallbackArgs) => Promise<void>;
        }
      }
    }
  }

  public async executeCallback(facetName: string, callbackName: string, args: CallbackArgs): Promise<void> {
    const facetCallbacks = this.callbacks[facetName];
    if (!facetCallbacks) {
      throw new Error(`No callbacks found for facet "${facetName}".`);
    }

    const callback = facetCallbacks[callbackName];
    if (!callback) {
      throw new Error(`Callback "${callbackName}" not found for facet "${facetName}".`);
    }

    await callback(args);
  }
}

export default FacetCallbackManager;