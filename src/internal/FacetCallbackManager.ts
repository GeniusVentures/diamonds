import * as fs from "fs";
import { resolve } from "path";
import { Signer } from "ethers";
import { CallbackArgs } from "../types"; // Adjust the path as needed

class FacetCallbackManager {
  public static instances: Map<string, FacetCallbackManager> = new Map();
  private callbacks: { [facetName: string]: { [callbackName: string]: (args: CallbackArgs) => Promise<void> } } = {};

  constructor(facetCallbacksPath: string) {
    this.loadCallbacks(facetCallbacksPath);
  }

  /**
   * Retrieves a FacetCallManager instance for a specific key (i.e. diamondName).
   * Creates it if not already present.
   */
  public static getInstance(_diamondName: string, _facetCallbacksPath: string): FacetCallbackManager {
    const _deploymentKey = _diamondName;
    if (!FacetCallbackManager.instances.has(_deploymentKey)) {
      FacetCallbackManager.instances.set(
        _deploymentKey,
        new FacetCallbackManager(_facetCallbacksPath)
      );
    }
    return FacetCallbackManager.instances.get(_deploymentKey)!;
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