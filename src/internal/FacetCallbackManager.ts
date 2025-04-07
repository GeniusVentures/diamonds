import * as fs from "fs-extra";
import { resolve, join } from "path";
import { CallbackArgs } from "../types";

export class FacetCallbackManager {
  private static instances: Map<string, FacetCallbackManager> = new Map();

  private callbacks: Record<string, Record<string, (args: CallbackArgs) => Promise<void>>> = {};

  private constructor(private callbacksPath: string) {
    this.loadCallbacks();
  }

  public static getInstance(diamondName: string, deploymentsPath: string): FacetCallbackManager {
    if (!this.instances.has(diamondName)) {
      const callbacksPath = join(deploymentsPath, diamondName, "callbacks");
      this.instances.set(diamondName, new FacetCallbackManager(callbacksPath));
    }
    return this.instances.get(diamondName)!;
  }

  private loadCallbacks(): void {
    if (!fs.existsSync(this.callbacksPath)) {
      console.error(`Facet callbacks path "${this.callbacksPath}" does not exist.`);
      return;
    }

    const files = fs.readdirSync(this.callbacksPath);

    files.forEach(file => {
      if (!file.endsWith(".ts") && !file.endsWith(".js")) return;

      const facetName = file.split(".")[0];
      const filePath = resolve(this.callbacksPath, file);
      const module = require(filePath);

      this.callbacks[facetName] = {};

      Object.entries(module).forEach(([callbackName, callbackFn]) => {
        if (typeof callbackFn === 'function') {
          this.callbacks[facetName][callbackName] = callbackFn as (args: CallbackArgs) => Promise<void>;
        }
      });
    });
  }

  public async executeCallback(facetName: string, callbacks: string[], args: CallbackArgs): Promise<void> {
    const registeredCallbacks = this.callbacks[facetName];
    for (const callbackName of callbacks) {
      if (!registeredCallbacks) {
        throw new Error(`Callbacks for facet "${facetName}" not found.`);
      }

      const callback = registeredCallbacks[callbackName];
      if (!callback) {
        throw new Error(`Callback "${callbackName}" for facet "${facetName}" not found.`);
      }

      await callback(args);
    }
  }
}
