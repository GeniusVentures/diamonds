export type DefenderProposalStatus = 'pending' | 'approved' | 'executed' | 'failed';

export interface DefenderStepRecord {
  stepName: string;
  proposalId?: string;
  status: DefenderProposalStatus;
  description?: string;
  txHash?: string;
  timestamp?: number;
}

export interface DefenderDeploymentRegistry {
  steps: DefenderStepRecord[];
  network: string;
  diamondName: string;
  deploymentId: string;
}

export interface PollOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}