import { BaseDeploymentStrategy } from './BaseDeploymentStrategy';
import { Diamond } from '../core';
import { FacetCutAction, PollOptions } from '../types';
import chalk from 'chalk';
import { artifacts, ethers } from 'hardhat';
import { Artifact } from 'hardhat/types';
import { join } from 'path';
import { object } from 'zod';
import { DeployClient } from '@openzeppelin/defender-sdk-deploy-client';
import { Network } from '@openzeppelin/defender-sdk-base-client';
import { VerificationRequest } from '@openzeppelin/defender-sdk-deploy-client/lib/models/verification';
import { Defender } from '@openzeppelin/defender-sdk';
import { DefenderDeploymentStore } from '../utils/defenderStore';
import { deployClient } from '../utils/defenderClients';
import { DeployContractRequest } from '@openzeppelin/defender-sdk-deploy-client';
import { DeploymentStatus } from '@openzeppelin/defender-sdk-deploy-client';
import { DeploymentResponse } from '@openzeppelin/defender-sdk-deploy-client';
import {
  ProposalClient,
  CreateProposalRequest
} from '@openzeppelin/defender-sdk-proposal-client';
import {
  ExternalApiCreateProposalRequest,
  ProposalTargetFunction
} from "@openzeppelin/defender-sdk-proposal-client/lib/models/proposal";

export class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy {
  private client: Defender;
  private proposalClient: ProposalClient;
  private relayerAddress: string;
  private autoApprove: boolean;
  private via: ExternalApiCreateProposalRequest['via'];
  private viaType: ExternalApiCreateProposalRequest['viaType'];

  constructor(
    apiKey: string,
    apiSecret: string,
    relayerAddress: string,
    autoApprove: boolean = false,
    via: ExternalApiCreateProposalRequest['via'],
    viaType: ExternalApiCreateProposalRequest['viaType'],
    verbose: boolean = true
  ) {
    super(verbose);
    this.client = new Defender({ apiKey, apiSecret });
    // this.proposalClient = new ProposalClient({ apiKey, apiSecret });
    this.relayerAddress = relayerAddress;
    this.via =
      this.viaType = viaType;
    this.autoApprove = autoApprove;
  }


  protected async checkAndUpdateDeployStep(stepName: string, diamond: Diamond): Promise<void> {
    const config = diamond.getDiamondConfig();
    const network = config.networkName!;
    const deploymentId = `${diamond.diamondName}-${network}-${config.chainId}`;
    const store = new DefenderDeploymentStore(diamond.diamondName, deploymentId);

    const step = store.getStep(stepName);
    if (!step || !step.proposalId) return;

    try {
      const deployment = await deployClient.getDeployedContract(step.proposalId);
      const status = deployment.status as DeploymentStatus;

      if (status === 'completed') {
        console.log(chalk.green(`✅ Defender deployment for ${stepName} completed.`));
        store.updateStatus(stepName, 'executed');
      } else if (status === 'failed') {
        console.error(chalk.red(`❌ Defender deployment for ${stepName} failed.`));
        store.updateStatus(stepName, 'failed');
        throw new Error(`Defender deployment ${step.proposalId} failed for step ${stepName}`);
      } else {
        console.log(chalk.yellow(`⏳ Defender deployment for ${stepName} is still ${status}.`));
        // Optionally you can wait/poll here
      }
    } catch (err) {
      console.error(chalk.red(`⚠️ Error while querying Defender deploy status for ${stepName}:`), err);
    }
  }

  /**
   * Polls the Defender API until the deployment is complete or fails.
   * @param stepName The name of the step to poll.
   * @param diamond The diamond instance.
   * @param options Polling options.
   * @returns The deployment response or null if not found.
   */
  private async pollUntilComplete(
    stepName: string,
    diamond: Diamond,
    options: PollOptions = {}
  ): Promise<DeploymentResponse | null> {
    const {
      maxAttempts = 10,
      initialDelayMs = 8000,
      maxDelayMs = 60000,
      jitter = true
    } = options;

    const config = diamond.getDiamondConfig();
    const network = config.networkName!;
    const deploymentId = `${diamond.diamondName}-${network}-${config.chainId}`;
    const store = new DefenderDeploymentStore(diamond.diamondName, deploymentId);

    const step = store.getStep(stepName);
    if (!step?.proposalId) {
      console.warn(`⚠️ No Defender deployment ID found for step ${stepName}`);
      return null;
    }

    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt < maxAttempts) {
      try {
        const deployment = await deployClient.getDeployedContract(step.proposalId);
        const status = deployment.status;

        if (status === 'completed') {
          console.log(chalk.green(`✅ Deployment succeeded for ${stepName}.`));
          store.updateStatus(stepName, 'executed');
          return deployment;
        }

        if (status === 'failed') {
          console.error(chalk.red(`❌ Deployment failed for ${stepName}.`));
          store.updateStatus(stepName, 'failed');
          return deployment;
        }

        console.log(chalk.yellow(`⏳ Deployment ${stepName} still ${status}. Retrying in ${delay}ms...`));
      } catch (err) {
        console.error(chalk.red(`⚠️ Error polling Defender for ${stepName}:`), err);
      }

      attempt++;

      // Apply jitter
      const sleep = jitter
        ? delay + Math.floor(Math.random() * (delay / 2))
        : delay;

      await new Promise(res => setTimeout(res, sleep));

      // Exponential backoff
      delay = Math.min(delay * 2, maxDelayMs);
    }

    console.warn(chalk.red(`⚠️ Deployment for ${stepName} did not complete after ${maxAttempts} attempts.`));
    return null;
  }


  protected async preDeployDiamondTasks(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Pre-deploy diamond tasks for ${diamond.diamondName} from ${this.constructor.name}...`));
    }

    await this.checkAndUpdateDeployStep('deploy-diamondcutfacet', diamond);
    await this.checkAndUpdateDeployStep('deploy-diamond', diamond);
  }

  protected async deployDiamondTasks(diamond: Diamond): Promise<void> {
    const diamondConfig = diamond.getDiamondConfig();
    const network = diamondConfig.networkName!;
    const deploymentId = `${diamond.diamondName}-${network}-${diamondConfig.chainId}`;
    const store = new DefenderDeploymentStore(diamond.diamondName, deploymentId);

    const signer = diamond.getSigner()!;
    const deployerAddress = await signer.getAddress();

    // ---- Deploy DiamondCutFacet ----
    const stepNameCut = 'deploy-diamondcutfacet';
    if (store.getStep(stepNameCut)?.status !== 'executed') {
      const cutRequest: DeployContractRequest = {
        network,
        contractName: 'DiamondCutFacet',
        contractPath: `${diamond.contractsPath}/DiamondCutFacet.sol`,
        constructorInputs: [],
        verifySourceCode: true, // TODO Verify this should be true or optional
      };

      const cutDeployment = await deployClient.deployContract(cutRequest);
      store.saveStep({
        stepName: stepNameCut,
        proposalId: cutDeployment.deploymentId,
        status: 'pending',
        description: 'DiamondCutFacet deployed via Defender DeployClient',
        timestamp: Date.now()
      });
      await this.pollUntilComplete(stepNameCut, diamond);

      console.log(chalk.blue(`📡 Submitted DiamondCutFacet deploy to Defender: ${cutDeployment.deploymentId}`));
    }

    // ---- Deploy Diamond ----
    const stepNameDiamond = 'deploy-diamond';
    if (store.getStep(stepNameDiamond)?.status !== 'executed') {
      const diamondRequest: DeployContractRequest = {
        network,
        contractName: diamond.diamondName,
        contractPath: `${diamond.contractsPath}/${diamond.diamondName}.sol`,
        constructorInputs: [deployerAddress, ethers.constants.AddressZero], // Make sure constructor matches
        verifySourceCode: true, // TODO Verify this should be true or optional
      };

      const diamondDeployment = await deployClient.deployContract(diamondRequest);
      store.saveStep({
        stepName: stepNameDiamond,
        proposalId: diamondDeployment.deploymentId,
        status: 'pending',
        description: 'Diamond deployed via Defender DeployClient',
        timestamp: Date.now()
      });
      await this.pollUntilComplete(stepNameDiamond, diamond);

      console.log(chalk.blue(`📡 Submitted Diamond deploy to Defender: ${diamondDeployment.deploymentId}`));
    }
  }

  protected async preDeployFacetsTasks(diamond: Diamond): Promise<void> {
    const facets = Object.keys(diamond.getDeployConfig().facets);
    for (const facet of facets) {
      await this.checkAndUpdateDeployStep(`deploy-${facet}`, diamond);
    }
  }

  /**
   * deployFacetsTasks
   * 
   * Deploys the facets of the diamond using OpenZeppelin Defender.
   * 
   * @param diamond 
   */
  protected async deployFacetsTasks(diamond: Diamond): Promise<void> {
    const deployConfig = diamond.getDeployConfig();
    const facetsConfig = deployConfig.facets;
    const diamondConfig = diamond.getDiamondConfig();
    const network = diamondConfig.networkName!;
    const deploymentId = `${diamond.diamondName}-${network}-${diamondConfig.chainId}`;
    const store = new DefenderDeploymentStore(diamond.diamondName, deploymentId);

    const signer = diamond.getSigner()!;
    const facetNamesSorted = Object.keys(facetsConfig).sort((a, b) => {
      return (facetsConfig[a].priority ?? 1000) - (facetsConfig[b].priority ?? 1000);
    });

    for (const facetName of facetNamesSorted) {
      const stepKey = `deploy-${facetName}`;
      const step = store.getStep(stepKey);
      if (step?.status === 'executed') {
        console.log(chalk.gray(`⏩ Skipping already-deployed facet: ${facetName}`));
        continue;
      }

      const facetConfig = facetsConfig[facetName];
      const deployedVersion = diamond.getDeployedDiamondData().DeployedFacets?.[facetName]?.version ?? -1;
      const availableVersions = Object.keys(facetConfig.versions ?? {}).map(Number);
      const targetVersion = Math.max(...availableVersions);

      if (targetVersion <= deployedVersion && deployedVersion !== -1) {
        console.log(chalk.gray(`⏩ Skipping facet ${facetName}, already at version ${deployedVersion}`));
        continue;
      }

      console.log(chalk.cyan(`🔧 Deploying facet ${facetName} to version ${targetVersion}...`));

      const deployRequest: DeployContractRequest = {
        network,
        contractName: facetName,
        contractPath: `${diamond.contractsPath}/${facetName}.sol`,
        constructorInputs: [],
        verifySourceCode: true, // TODO Verify this should be true or optional
      };

      const deployResult = await deployClient.deployContract(deployRequest);

      store.saveStep({
        stepName: stepKey,
        proposalId: deployResult.deploymentId,
        status: 'pending',
        description: `Facet ${facetName} deployment submitted`,
        timestamp: Date.now()
      });
      await this.pollUntilComplete(stepKey, diamond);

      console.log(chalk.blue(`📡 Submitted deployment for facet ${facetName}: ${deployResult.deploymentId}`));
    }
  }


  /**
   * Performs the diamond cut tasks using OpenZeppelin Defender.
   * @param diamond The diamond instance.
   */
  protected async performDiamondCutTasks(diamond: Diamond): Promise<void> {
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const diamondAddress = deployedDiamondData.DiamondAddress!;
    const deployConfig = diamond.getDeployConfig();
    const diamondConfig = diamond.getDiamondConfig();
    const network = diamondConfig.networkName!;
    const [initCalldata, initAddress] = await this.getInitCalldata(diamond);
    const facetCuts = await this.getFacetCuts(diamond);

    await this.validateNoOrphanedSelectors(facetCuts);

    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
      for (const cut of facetCuts) {
        console.log(chalk.bold(`- ${FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
        console.log(chalk.gray(`  Selectors:`), cut.functionSelectors);
      }
      if (initAddress !== ethers.constants.AddressZero) {
        console.log(chalk.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
      }
    }

    const proposal: CreateProposalRequest = {
      contract: {
        address: diamondAddress,
        network,
      },
      title: `DiamondCut ${facetCuts.length} facets`,
      description: 'Perform diamondCut via Defender',
      type: 'custom',
      functionInterface: {
        name: 'diamondCut',
        inputs: [
          {
            name: 'facetCuts',
            type: 'tuple[]',
            components: [
              { name: 'facetAddress', type: 'address' },
              { name: 'action', type: 'uint8' },
              { name: 'functionSelectors', type: 'bytes4[]' }
            ]
          },
          { name: 'initAddress', type: 'address' },
          { name: 'initCalldata', type: 'bytes' },
        ],
      },
      functionInputs: [
        JSON.stringify(facetCuts.map(cut => ({
          facetAddress: cut.facetAddress,
          action: cut.action,
          functionSelectors: cut.functionSelectors
        }))),
        initAddress,
        initCalldata
      ],
      via: this.via,
      viaType: this.viaType,
    };

    const { proposalId, url } = await this.client.proposal.create({ proposal });

    console.log(chalk.blue(`📡 Defender Proposal created: ${url}`));

    // if (this.autoApprove) {
    //   console.log(chalk.yellow(`⏳ Waiting for proposal approval to execute automatically...`));
    //   let attempts = 0;
    //   const maxAttempts = 20;
    //   const delayMs = 15000;

    //   while (attempts < maxAttempts) {
    //     const result = await this.client.proposal.get(proposalId);

    //     const tx = result.transaction;

    //     if (tx?.isExecuted && tx?.isSuccessful) {
    //       console.log(chalk.green(`✅ Proposal executed successfully.`));
    //       return;
    //     }

    //     if (tx?.isExecuted && tx?.isReverted) {
    //       console.error(chalk.red(`❌ Proposal execution reverted.`));
    //       return;
    //     }

    //     const canExecute = tx && !tx.isExecuted && !tx.isReverted;

    //     if (canExecute) {
    //       try {
    //         const execResult = await this.client.proposal.execute(proposalId);
    //         console.log(chalk.green(`🚀 Execution submitted: ${execResult.transactionId || '✓'}`));
    //         return;
    //       } catch (err) {
    //         console.error(chalk.red(`❌ Error executing proposal:`), err);
    //         break;
    //       }
    //     }

    //     console.log(chalk.gray(`⌛ Proposal not yet ready for execution. Rechecking in ${delayMs / 1000}s...`));
    //     await new Promise((res) => setTimeout(res, delayMs));
    //     attempts++;
    //   }

    //   if (attempts >= maxAttempts) {
    //     console.warn(chalk.red(`⚠️ Proposal was not ready after ${maxAttempts} attempts.`));
    //   }
    // }

  }

}
