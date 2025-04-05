import * as fs from "fs-extra";
import { resolve, join } from "path";
import { CallbackArgs } from "../types";

export class FacetCallbackManager {
  private static instances: Map<string, FacetCallbackManager> = new Map();

  private callbacks: Record<string, Record<string, (args: CallbackArgs) => Promise<void>>> = {};

  private constructor(private facetCallbacksPath: string) {
    this.loadCallbacks();
  }

  public static getInstance(diamondName: string, facetCallbacksPath: string): FacetCallbackManager {
    if (!this.instances.has(diamondName)) {
      this.instances.set(diamondName, new FacetCallbackManager(facetCallbacksPath));
    }
    return this.instances.get(diamondName)!;
  }

  private loadCallbacks(): void {
    if (!fs.existsSync(this.facetCallbacksPath)) {
      console.error(`Facet callbacks path "${this.facetCallbacksPath}" does not exist.`);
      return;
    }

    const files = fs.readdirSync(this.facetCallbacksPath);

    files.forEach(file => {
      if (!file.endsWith(".ts") && !file.endsWith(".js")) return;

      const facetName = file.split(".")[0];
      const filePath = resolve(this.facetCallbacksPath, file);
      const module = require(filePath);

      this.callbacks[facetName] = {};

      Object.entries(module).forEach(([callbackName, callbackFn]) => {
        if (typeof callbackFn === 'function') {
          this.callbacks[facetName][callbackName] = callbackFn as (args: CallbackArgs) => Promise<void>;
        }
      });
    });
  }

  public async executeCallback(facetName: string, callbackName: string, args: CallbackArgs): Promise<void> {
    const facetCallbacks = this.callbacks[facetName];
    if (!facetCallbacks) {
      throw new Error(`Callbacks for facet "${facetName}" not found.`);
    }

    const callback = facetCallbacks[callbackName];
    if (!callback) {
      throw new Error(`Callback "${callbackName}" for facet "${facetName}" not found.`);
    }

    await callback(args);
  }
}
