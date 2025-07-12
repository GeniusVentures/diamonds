"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackManager = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = require("path");
class CallbackManager {
    callbacksPath;
    static instances = new Map();
    callbacks = {};
    constructor(callbacksPath) {
        this.callbacksPath = callbacksPath;
        this.loadCallbacks();
    }
    static getInstance(diamondName, deploymentsPath) {
        if (!this.instances.has(diamondName)) {
            const callbacksPath = (0, path_1.join)(deploymentsPath, diamondName, "callbacks");
            this.instances.set(diamondName, new CallbackManager(callbacksPath));
        }
        return this.instances.get(diamondName);
    }
    static clearInstances() {
        this.instances.clear();
    }
    static clearInstance(diamondName) {
        this.instances.delete(diamondName);
    }
    loadCallbacks() {
        if (!fs.existsSync(this.callbacksPath)) {
            console.error(`Facet callbacks path "${this.callbacksPath}" does not exist.`);
            return;
        }
        const files = fs.readdirSync(this.callbacksPath);
        files.forEach(file => {
            if (!file.endsWith(".ts") && !file.endsWith(".js"))
                return;
            const facetName = file.split(".")[0];
            const filePath = (0, path_1.resolve)(this.callbacksPath, file);
            const module = require(filePath);
            this.callbacks[facetName] = {};
            Object.entries(module).forEach(([callbackName, callbackFn]) => {
                if (typeof callbackFn === 'function') {
                    this.callbacks[facetName][callbackName] = callbackFn;
                }
            });
        });
    }
    async executeCallback(facetName, callbacks, args) {
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
exports.CallbackManager = CallbackManager;
//# sourceMappingURL=CallbackManager.js.map