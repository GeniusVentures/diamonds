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
exports.RPCDeploymentStore = void 0;
const path_1 = require("path");
const fs = __importStar(require("fs-extra"));
/**
 * Step-by-step deployment store for RPC-based deployments
 * Similar to DefenderDeploymentStore but for RPC deployments
 */
class RPCDeploymentStore {
    filePath;
    diamondName;
    deploymentId;
    constructor(diamondName, deploymentId, baseDir = 'diamonds') {
        this.diamondName = diamondName;
        this.deploymentId = deploymentId;
        const registryDir = (0, path_1.join)(baseDir, diamondName, 'deployments', 'rpc');
        fs.ensureDirSync(registryDir);
        this.filePath = (0, path_1.join)(registryDir, `${deploymentId}.json`);
    }
    loadRegistry() {
        if (!fs.existsSync(this.filePath)) {
            return {
                diamondName: this.diamondName,
                deploymentId: this.deploymentId,
                network: '',
                chainId: 0,
                rpcUrl: '',
                deployerAddress: '',
                steps: [],
                startedAt: Date.now(),
                lastUpdated: Date.now()
            };
        }
        return fs.readJSONSync(this.filePath);
    }
    saveRegistry(registry) {
        registry.lastUpdated = Date.now();
        fs.writeJSONSync(this.filePath, registry, { spaces: 2 });
    }
    initializeDeployment(network, chainId, rpcUrl, deployerAddress) {
        const registry = this.loadRegistry();
        registry.network = network;
        registry.chainId = chainId;
        registry.rpcUrl = rpcUrl;
        registry.deployerAddress = deployerAddress;
        this.saveRegistry(registry);
    }
    saveStep(step) {
        const registry = this.loadRegistry();
        const existing = registry.steps.find(s => s.stepName === step.stepName);
        if (existing) {
            Object.assign(existing, step);
        }
        else {
            registry.steps.push(step);
        }
        this.saveRegistry(registry);
    }
    getStep(stepName) {
        return this.loadRegistry().steps.find(s => s.stepName === stepName);
    }
    updateStatus(stepName, status, txHash, contractAddress, error) {
        const registry = this.loadRegistry();
        const step = registry.steps.find(s => s.stepName === stepName);
        if (step) {
            step.status = status;
            step.timestamp = Date.now();
            if (txHash)
                step.txHash = txHash;
            if (contractAddress)
                step.contractAddress = contractAddress;
            if (error)
                step.error = error;
            this.saveRegistry(registry);
        }
    }
    list() {
        return this.loadRegistry().steps;
    }
    getRegistry() {
        return this.loadRegistry();
    }
    isStepCompleted(stepName) {
        const step = this.getStep(stepName);
        return step?.status === 'completed';
    }
    isStepFailed(stepName) {
        const step = this.getStep(stepName);
        return step?.status === 'failed';
    }
    getCompletedSteps() {
        return this.list().filter(s => s.status === 'completed');
    }
    getFailedSteps() {
        return this.list().filter(s => s.status === 'failed');
    }
    getPendingSteps() {
        return this.list().filter(s => s.status === 'pending' || s.status === 'in_progress');
    }
    markDeploymentComplete() {
        const registry = this.loadRegistry();
        registry.completedAt = Date.now();
        this.saveRegistry(registry);
    }
    markDeploymentFailed(error) {
        const registry = this.loadRegistry();
        registry.failedAt = Date.now();
        registry.lastError = error;
        this.saveRegistry(registry);
    }
    clearFailedSteps() {
        const registry = this.loadRegistry();
        registry.steps = registry.steps.filter(s => s.status !== 'failed');
        this.saveRegistry(registry);
    }
    getDeploymentSummary() {
        const steps = this.list();
        const completed = steps.filter(s => s.status === 'completed').length;
        const failed = steps.filter(s => s.status === 'failed').length;
        const pending = steps.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
        return {
            total: steps.length,
            completed,
            failed,
            pending,
            isComplete: failed === 0 && pending === 0 && completed > 0,
            hasFailed: failed > 0
        };
    }
}
exports.RPCDeploymentStore = RPCDeploymentStore;
//# sourceMappingURL=rpcStore.js.map