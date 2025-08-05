import { join } from 'path';
import * as fs from 'fs-extra';
import { RPCDeploymentRegistry, RPCStepStatus, RPCStepRecord } from '../types/rpc';

/**
 * Step-by-step deployment store for RPC-based deployments
 * Similar to DefenderDeploymentStore but for RPC deployments
 */
export class RPCDeploymentStore {
  private readonly filePath: string;
  private readonly diamondName: string;
  private readonly deploymentId: string;

  constructor(diamondName: string, deploymentId: string, baseDir: string = 'diamonds') {
    this.diamondName = diamondName;
    this.deploymentId = deploymentId;
    const registryDir = join(baseDir, diamondName, 'deployments', 'rpc');
    fs.ensureDirSync(registryDir);
    this.filePath = join(registryDir, `${deploymentId}.json`);
  }

  private loadRegistry(): RPCDeploymentRegistry {
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

  private saveRegistry(registry: RPCDeploymentRegistry) {
    registry.lastUpdated = Date.now();
    fs.writeJSONSync(this.filePath, registry, { spaces: 2 });
  }

  public initializeDeployment(network: string, chainId: number, rpcUrl: string, deployerAddress: string): void {
    const registry = this.loadRegistry();
    registry.network = network;
    registry.chainId = chainId;
    registry.rpcUrl = rpcUrl;
    registry.deployerAddress = deployerAddress;
    this.saveRegistry(registry);
  }

  public saveStep(step: RPCStepRecord): void {
    const registry = this.loadRegistry();
    const existing = registry.steps.find(s => s.stepName === step.stepName);
    if (existing) {
      Object.assign(existing, step);
    } else {
      registry.steps.push(step);
    }
    this.saveRegistry(registry);
  }

  public getStep(stepName: string): RPCStepRecord | undefined {
    return this.loadRegistry().steps.find(s => s.stepName === stepName);
  }

  public updateStatus(stepName: string, status: RPCStepStatus, txHash?: string, contractAddress?: string, error?: string): void {
    const registry = this.loadRegistry();
    const step = registry.steps.find(s => s.stepName === stepName);
    if (step) {
      step.status = status;
      step.timestamp = Date.now();
      if (txHash) step.txHash = txHash;
      if (contractAddress) step.contractAddress = contractAddress;
      if (error) step.error = error;
      this.saveRegistry(registry);
    }
  }

  public list(): RPCStepRecord[] {
    return this.loadRegistry().steps;
  }

  public getRegistry(): RPCDeploymentRegistry {
    return this.loadRegistry();
  }

  public isStepCompleted(stepName: string): boolean {
    const step = this.getStep(stepName);
    return step?.status === 'completed';
  }

  public isStepFailed(stepName: string): boolean {
    const step = this.getStep(stepName);
    return step?.status === 'failed';
  }

  public getCompletedSteps(): RPCStepRecord[] {
    return this.list().filter(s => s.status === 'completed');
  }

  public getFailedSteps(): RPCStepRecord[] {
    return this.list().filter(s => s.status === 'failed');
  }

  public getPendingSteps(): RPCStepRecord[] {
    return this.list().filter(s => s.status === 'pending' || s.status === 'in_progress');
  }

  public markDeploymentComplete(): void {
    const registry = this.loadRegistry();
    registry.completedAt = Date.now();
    this.saveRegistry(registry);
  }

  public markDeploymentFailed(error: string): void {
    const registry = this.loadRegistry();
    registry.failedAt = Date.now();
    registry.lastError = error;
    this.saveRegistry(registry);
  }

  public clearFailedSteps(): void {
    const registry = this.loadRegistry();
    registry.steps = registry.steps.filter(s => s.status !== 'failed');
    this.saveRegistry(registry);
  }

  public getDeploymentSummary(): {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    isComplete: boolean;
    hasFailed: boolean;
  } {
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
