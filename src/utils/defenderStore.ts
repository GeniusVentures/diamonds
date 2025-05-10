import { join } from 'path';
import * as fs from 'fs-extra';
import { DefenderDeploymentRegistry, DefenderProposalStatus, DefenderStepRecord } from '../types/defender';

export class DefenderDeploymentStore {
  private readonly filePath: string;

  constructor(diamondName: string, deploymentId: string, baseDir: string = 'diamonds') {
    const registryDir = join(baseDir, diamondName, 'deployments', 'defender');
    fs.ensureDirSync(registryDir);
    this.filePath = join(registryDir, `${deploymentId}.json`);
  }

  private loadRegistry(): DefenderDeploymentRegistry {
    if (!fs.existsSync(this.filePath)) {
      return { diamondName: '', network: '', deploymentId: '', steps: [] };
    }
    return fs.readJSONSync(this.filePath);
  }

  private saveRegistry(registry: DefenderDeploymentRegistry) {
    fs.writeJSONSync(this.filePath, registry, { spaces: 2 });
  }

  public saveStep(step: DefenderStepRecord): void {
    const registry = this.loadRegistry();
    const existing = registry.steps.find(s => s.stepName === step.stepName);
    if (existing) {
      Object.assign(existing, step);
    } else {
      registry.steps.push(step);
    }
    this.saveRegistry(registry);
  }

  public getStep(stepName: string): DefenderStepRecord | undefined {
    return this.loadRegistry().steps.find(s => s.stepName === stepName);
  }

  public updateStatus(stepName: string, status: DefenderProposalStatus): void {
    const registry = this.loadRegistry();
    const step = registry.steps.find(s => s.stepName === stepName);
    if (step) {
      step.status = status;
      step.timestamp = Date.now();
      this.saveRegistry(registry);
    }
  }

  public list(): DefenderStepRecord[] {
    return this.loadRegistry().steps;
  }
}
