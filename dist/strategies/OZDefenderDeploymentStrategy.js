"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OZDefenderDeploymentStrategy = void 0;
const BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
const defender_admin_client_1 = require("@openzeppelin/defender-admin-client");
const chalk_1 = __importDefault(require("chalk"));
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
        console.log(chalk_1.default.blue(`📡 Defender Proposal Created: ${proposal.url}`));
        if (this.autoApprove) {
            await this.adminClient.approveProposal(proposal.proposalId);
            console.log(chalk_1.default.green(`✅ Defender Proposal auto-approved`));
        }
    }
    async getInitCalldata(diamond) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const config = diamond.getDeployConfig();
        const deployed = diamond.getDeployedDiamondData();
        const ifaceList = facetCuts.map(fc => fc.initFunc).filter(Boolean);
        if (!config.protocolInitFacet || ifaceList.length === 0) {
            return { address: ethers.constants.AddressZero, calldata: '0x' };
        }
        const facetAddress = (_b = (_a = deployed.FacetDeployedInfo) === null || _a === void 0 ? void 0 : _a[config.protocolInitFacet]) === null || _b === void 0 ? void 0 : _b.address;
        const version = config.protocolVersion;
        const initFn = (_f = (_e = (_d = (_c = config.facets[config.protocolInitFacet]) === null || _c === void 0 ? void 0 : _c.versions) === null || _d === void 0 ? void 0 : _d[version]) === null || _e === void 0 ? void 0 : _e.upgradeInit) !== null && _f !== void 0 ? _f : (_j = (_h = (_g = config.facets[config.protocolInitFacet]) === null || _g === void 0 ? void 0 : _g.versions) === null || _h === void 0 ? void 0 : _h[version]) === null || _j === void 0 ? void 0 : _j.deployInit;
        if (!facetAddress || !initFn)
            return { address: ethers.constants.AddressZero, calldata: '0x' };
        const iface = new ethers.utils.Interface([`function ${initFn}`]);
        return { address: facetAddress, calldata: iface.encodeFunctionData(initFn) };
    }
}
exports.OZDefenderDeploymentStrategy = OZDefenderDeploymentStrategy;
//# sourceMappingURL=OZDefenderDeploymentStrategy.js.map