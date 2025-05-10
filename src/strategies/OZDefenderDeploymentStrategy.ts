import { BaseDeploymentStrategy } from './BaseDeploymentStrategy';
import { Diamond } from '../internal';
import { FacetCutAction } from '../types';
import chalk from 'chalk';
import { artifacts, ethers } from 'hardhat';
import { Artifact } from 'hardhat/types';
import { AdminClient, ProposalResponse } from '@openzeppelin/defender-admin-client';
import { Network } from '@openzeppelin/defender-base-client';
import { VerificationRequest } from '@openzeppelin/defender-admin-client/lib/models/verification';
import {
  ExternalApiCreateProposalRequest,
  ProposalTargetFunction
} from "@openzeppelin/defender-admin-client/lib/models/proposal";
import { join } from 'path';
import { object } from 'zod';

export class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy {
  private adminClient: AdminClient;
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
    this.adminClient = new AdminClient({ apiKey, apiSecret });
    this.relayerAddress = relayerAddress;
    this.viaType = viaType;
    this.autoApprove = autoApprove;
  }

  protected async preDeployDiamondTasks(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Pre-deploy diamond tasks for ${diamond.diamondName} from ${this.constructor.name}...`));
    }

    // TODO: Add Pre-Deployment check of pending or completed OZ DefenderDiamond Deployment transaction matching the current diamond configuration which should then be loaded as pending before moving on to deployment.
    return Promise.resolve();
  }

  protected async deployDiamondTasks(diamond: Diamond): Promise<void> {
    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Deploying diamond ${diamond.diamondName} from ${this.constructor.name}...`));
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
    const network = diamondConfig.networkName as Network;

    if (!network) {
      throw new Error('Network name is not defined in the diamond config');
    }

    const [initCalldata, initAddress] = await this.getInitCalldata(diamond);
    const facetCuts = await this.getFacetCuts(diamond);
    await this.validateNoOrphanedSelectors(facetCuts);

    if (this.verbose) {
      console.log(chalk.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
      for (const cut of facetCuts) {
        console.log(chalk.bold(`- ${FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
        console.log(chalk.gray(`  Selectors:`), cut.functionSelectors);
      }
      if (diamond.initAddress !== ethers.constants.AddressZero) {
        console.log(chalk.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
      }
    }

    const artifact: Artifact = artifacts.readArtifactSync('DiamondCutFacet');
    // The ProposalTargetFunction for the diamondCut function (ABI)
    const functionInterface: ProposalTargetFunction = {
      name: 'diamondCut',
      inputs: [
        {
          name: 'facetCuts', type: 'tuple[]', components: [
            { name: 'facetAddress', type: 'address' },
            { name: 'action', type: 'uint8' },
            { name: 'functionSelectors', type: 'bytes4[]' }
          ]
        },
        { name: 'initAddress', type: 'address' },
        { name: 'initCalldata', type: 'bytes' }
      ],
    };

    const iface = new ethers.utils.Interface(artifact.abi);
    const facetSelectorCutMap = facetCuts.map(fc => ({ facetAddress: fc.facetAddress, action: fc.action.toString(), functionSelectors: fc.functionSelectors }));
    const calldata = iface.encodeFunctionData('diamondCut', [
      facetSelectorCutMap,
      initAddress,
      initCalldata,
    ]);

    const proposal = await this.adminClient.createProposal({
      contract: { address: diamondAddress, network: network },
      title: `DiamondCut ${facetCuts.length} facets`,
      description: 'Perform diamondCut via Defender',
      type: 'custom',
      functionInterface: functionInterface,
      functionInputs: [JSON.stringify(facetSelectorCutMap), initAddress, initCalldata], // TODO the initCaldata may need to be of type: any = []
      via: this.via,
      viaType: this.viaType,
    });

    console.log(chalk.blue(`📡 Defender Proposal Created. ProposalId: ${proposal.proposalId} at ${proposal.url}`));

    //TODO this is verifying that the DiamondCutFacet is deployed, not the diamond itself. This should all be handled in deployDiamond and deployFacet before this is called.
    // TODO However the autoApprove should be handled in every step to automate the process.
    if (this.autoApprove) {
      console.log(chalk.yellow(`\n🪓 Auto-approving Defender Proposal...`))
      const verificationRequest: VerificationRequest = {
        contractAddress: diamondAddress,
        contractNetwork: network,
        contractName: 'DiamondCutFacet',
        solidityFilePath: join(diamond.contractsPath, 'DiamondCutFacet.sol'),
      };
      await this.adminClient.verifyDeployment(verificationRequest);
      console.log(chalk.green(`✅ Defender Proposal auto-approved`));
    }
  }
}
