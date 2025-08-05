export type RPCStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface RPCStepRecord {
  stepName: string;
  description?: string;
  status: RPCStepStatus;
  txHash?: string;
  contractAddress?: string;
  gasUsed?: string;
  gasPrice?: string;
  timestamp?: number;
  error?: string;
  retryCount?: number;
}

export interface RPCDeploymentRegistry {
  diamondName: string;
  deploymentId: string;
  network: string;
  chainId: number;
  rpcUrl: string;
  deployerAddress: string;
  steps: RPCStepRecord[];
  startedAt: number;
  lastUpdated: number;
  completedAt?: number;
  failedAt?: number;
  lastError?: string;
}

export interface RPCRetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}
