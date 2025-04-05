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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetCallbackManager = void 0;
const fs = __importStar(require("fs-extra"));
const path_1 = require("path");
class FacetCallbackManager {
    constructor(facetCallbacksPath) {
        this.facetCallbacksPath = facetCallbacksPath;
        this.callbacks = {};
        this.loadCallbacks();
    }
    static getInstance(diamondName, facetCallbacksPath) {
        if (!this.instances.has(diamondName)) {
            this.instances.set(diamondName, new FacetCallbackManager(facetCallbacksPath));
        }
        return this.instances.get(diamondName);
    }
    loadCallbacks() {
        if (!fs.existsSync(this.facetCallbacksPath)) {
            console.error(`Facet callbacks path "${this.facetCallbacksPath}" does not exist.`);
            return;
        }
        const files = fs.readdirSync(this.facetCallbacksPath);
        files.forEach(file => {
            if (!file.endsWith(".ts") && !file.endsWith(".js"))
                return;
            const facetName = file.split(".")[0];
            const filePath = (0, path_1.resolve)(this.facetCallbacksPath, file);
            const module = require(filePath);
            this.callbacks[facetName] = {};
            Object.entries(module).forEach(([callbackName, callbackFn]) => {
                if (typeof callbackFn === 'function') {
                    this.callbacks[facetName][callbackName] = callbackFn;
                }
            });
        });
    }
    async executeCallback(facetName, callbackName, args) {
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
exports.FacetCallbackManager = FacetCallbackManager;
FacetCallbackManager.instances = new Map();
//# sourceMappingURL=FacetCallbackManager.js.map