import { BaseDeploymentStrategy } from './BaseDeploymentStrategy';
import { AdminClient, ProposalResponse } from '@openzeppelin/defender-admin-client';
import { Diamond } from '../internal';
import { NewDeployedFacets } from '../types';
import chalk from 'chalk';

export class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy {
  private adminClient: AdminClient;
  private relayerAddress: string;
  private autoApprove: boolean;

  constructor(
    apiKey: string,
    apiSecret: string,
    relayerAddress: string,
    autoApprove: boolean = false,
    verbose: boolean = true
  ) {
    super(verbose);
    this.adminClient = new AdminClient({ apiKey, apiSecret });
    this.relayerAddress = relayerAddress;
    this.autoApprove = autoApprove;
  }

  override async performDiamondCut(diamond: Diamond): Promise<void> {
    const deployedDiamondData = diamond.getDeployedDiamondData();
    const diamondAddress = deployedDiamondData.DiamondAddress!;
    const deployConfig = diamond.getDeployConfig();
    const config = diamond.getDiamondConfig();
    const network = diamond.getDiamondConfig().networkName;


    const initCalldata = await this.getInitCalldata(diamond);
    const facetCuts = diamond.getFacetCuts();

    const calldata = diamond.interface.encodeFunctionData('diamondCut', [
      facetCuts.map(fc => ({
        facetAddress: fc.facetAddress,
        action: fc.action,
        functionSelectors: fc.functionSelectors
      })),
      initCalldata.address,
      initCalldata.calldata
    ]);

    const proposal = await this.adminClient.createProposal({
      contract: { address: diamondAddress, network: network },
      title: `DiamondCut ${facetCuts.length} facets`,
      description: 'Perform diamondCut via Defender',
      type: 'custom',
      via: this.relayerAddress,
      viaType: 'Gnosis Multisig',
      calldata,
    });

    console.log(chalk.blue(`📡 Defender Proposal Created: ${proposal.url}`));

    if (this.autoApprove) {
      await this.adminClient.approveProposal(proposal.proposalId);
      console.log(chalk.green(`✅ Defender Proposal auto-approved`));
    }
  }

  private async getInitCalldata(
    diamond: Diamond
  ): Promise<{ address: string; calldata: string }> {
    const config = diamond.getDeployConfig();
    const deployed = diamond.getDeployedDiamondData();
    const ifaceList = facetCuts.map(fc => fc.initFunc).filter(Boolean);

    if (!config.protocolInitFacet || ifaceList.length === 0) {
      return { address: ethers.constants.AddressZero, calldata: '0x' };
    }

    const facetAddress = deployed.FacetDeployedInfo?.[config.protocolInitFacet]?.address;
    const version = config.protocolVersion;
    const initFn = config.facets[config.protocolInitFacet]?.versions?.[version]?.upgradeInit
      ?? config.facets[config.protocolInitFacet]?.versions?.[version]?.deployInit;

    if (!facetAddress || !initFn) return { address: ethers.constants.AddressZero, calldata: '0x' };

    const iface = new ethers.utils.Interface([`function ${initFn}`]);
    return { address: facetAddress, calldata: iface.encodeFunctionData(initFn) };
  }
}
