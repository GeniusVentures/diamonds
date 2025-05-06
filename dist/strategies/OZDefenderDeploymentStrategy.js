"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OZDefenderDeploymentStrategy = void 0;
const BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
const defender_admin_client_1 = require("@openzeppelin/defender-admin-client");
const types_1 = require("../types");
const chalk_1 = __importDefault(require("chalk"));
const hardhat_1 = require("hardhat");
class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy_1.BaseDeploymentStrategy {
    constructor(apiKey, apiSecret, relayerAddress, autoApprove = false, verbose = true) {
        super(verbose);
        this.adminClient = new defender_admin_client_1.AdminClient({ apiKey, apiSecret });
        this.relayerAddress = relayerAddress;
        this.autoApprove = autoApprove;
    }
    async performDiamondCut(diamond) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const diamondAddress = deployedDiamondData.DiamondAddress;
        const deployConfig = diamond.getDeployConfig();
        const diamondConfig = diamond.getDiamondConfig();
        const network = diamondConfig.networkName;
        if (!network) {
            throw new Error('Network name is not defined in the diamond config');
        }
        const initCalldata = await this.getInitCalldata(diamond);
        const facetCuts = await this.getFacetCuts(diamond);
        await this.validateNoOrphanedSelectors(facetCuts);
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
            for (const cut of facetCuts) {
                console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
            }
            if (diamond.initAddress !== hardhat_1.ethers.constants.AddressZero) {
                console.log(chalk_1.default.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
            }
        }
        const artifact = hardhat_1.artifacts.readArtifactSync('DiamondCutFacet');
        const iface = new hardhat_1.ethers.utils.Interface(artifact.abi);
        const calldata = iface.encodeFunctionData('diamondCut', [
            facetCuts.map(fc => ({
                facetAddress: fc.facetAddress,
                action: fc.action,
                functionSelectors: fc.functionSelectors,
            })),
            initCalldata.address,
            initCalldata.calldata,
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
        console.log(chalk_1.default.blue(`📡 Defender Proposal Created: ${proposal.url}`));
        if (this.autoApprove) {
            await this.adminClient.verifyDeployment(proposal.proposalId);
            console.log(chalk_1.default.green(`✅ Defender Proposal auto-approved`));
        }
    }
}
exports.OZDefenderDeploymentStrategy = OZDefenderDeploymentStrategy;
//# sourceMappingURL=OZDefenderDeploymentStrategy.js.map