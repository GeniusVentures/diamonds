"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OZDefenderDeploymentStrategy = void 0;
const BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
const types_1 = require("../types");
const chalk_1 = __importDefault(require("chalk"));
const hardhat_1 = require("hardhat");
const defender_admin_client_1 = require("@openzeppelin/defender-admin-client");
const path_1 = require("path");
class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy_1.BaseDeploymentStrategy {
    constructor(apiKey, apiSecret, relayerAddress, autoApprove = false, via, viaType, verbose = true) {
        super(verbose);
        this.adminClient = new defender_admin_client_1.AdminClient({ apiKey, apiSecret });
        this.relayerAddress = relayerAddress;
        this.viaType = viaType;
        this.autoApprove = autoApprove;
    }
    async preDeployDiamondTasks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Pre-deploy diamond tasks for ${diamond.diamondName} from ${this.constructor.name}...`));
        }
        // TODO: Add Pre-Deployment check of pending or completed OZ Defender DiamondCut or Diamond Deployment transactions, which should then be loaded.
        return Promise.resolve();
    }
    async postDeployDiamondTasks(diamond) {
        return Promise.resolve();
    }
    async _performDiamondCut(diamond) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const diamondAddress = deployedDiamondData.DiamondAddress;
        const deployConfig = diamond.getDeployConfig();
        const diamondConfig = diamond.getDiamondConfig();
        const network = diamondConfig.networkName;
        if (!network) {
            throw new Error('Network name is not defined in the diamond config');
        }
        const [initCalldata, initAddress] = await this.getInitCalldata(diamond);
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
        // The ProposalTargetFunction for the diamondCut function (ABI)
        const functionInterface = {
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
        const iface = new hardhat_1.ethers.utils.Interface(artifact.abi);
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
            functionInputs: [JSON.stringify(facetSelectorCutMap), initAddress, initCalldata],
            via: this.via,
            viaType: this.viaType,
        });
        console.log(chalk_1.default.blue(`📡 Defender Proposal Created. ProposalId: ${proposal.proposalId} at ${proposal.url}`));
        //TODO this is verifying that the DiamondCutFacet is deployed, not the diamond itself.  This should all be handled in deployDiamond and deployFacet before this is called.
        // TODO However the autoApprove should be handled in every step to automate the process.
        if (this.autoApprove) {
            console.log(chalk_1.default.yellow(`\n🪓 Auto-approving Defender Proposal...`));
            const verificationRequest = {
                contractAddress: diamondAddress,
                contractNetwork: network,
                contractName: 'DiamondCutFacet',
                solidityFilePath: (0, path_1.join)(diamond.contractsPath, 'DiamondCutFacet.sol'),
            };
            await this.adminClient.verifyDeployment(verificationRequest);
            console.log(chalk_1.default.green(`✅ Defender Proposal auto-approved`));
        }
    }
}
exports.OZDefenderDeploymentStrategy = OZDefenderDeploymentStrategy;
//# sourceMappingURL=OZDefenderDeploymentStrategy.js.map