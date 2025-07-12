"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OZDefenderDeploymentStrategy = void 0;
const BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
const types_1 = require("../types");
const chalk_1 = __importDefault(require("chalk"));
const hardhat_1 = __importDefault(require("hardhat"));
const ethers_1 = require("ethers");
const defender_sdk_1 = require("@openzeppelin/defender-sdk");
const defenderStore_1 = require("../utils/defenderStore");
const contractMapping_1 = require("../utils/contractMapping");
class OZDefenderDeploymentStrategy extends BaseDeploymentStrategy_1.BaseDeploymentStrategy {
    client;
    // private proposalClient: ProposalClient;
    relayerAddress;
    autoApprove;
    via;
    viaType;
    constructor(apiKey, apiSecret, relayerAddress, autoApprove = false, via, viaType, verbose = true, customClient // Optional for testing
    ) {
        super(verbose);
        this.client = customClient || new defender_sdk_1.Defender({ apiKey, apiSecret });
        // this.proposalClient = new ProposalClient({ apiKey, apiSecret });
        this.relayerAddress = relayerAddress;
        this.via = via;
        this.viaType = viaType;
        this.autoApprove = autoApprove;
    }
    async checkAndUpdateDeployStep(stepName, diamond) {
        const config = diamond.getDiamondConfig();
        const network = config.networkName;
        const deploymentId = `${diamond.diamondName}-${network}-${config.chainId}`;
        const store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId, config.deploymentsPath);
        const step = store.getStep(stepName);
        if (!step || !step.proposalId)
            return;
        try {
            const deployment = await this.client.deploy.getDeployedContract(step.proposalId);
            const status = deployment.status;
            if (status === 'completed') {
                console.log(chalk_1.default.green(`✅ Defender deployment for ${stepName} completed.`));
                store.updateStatus(stepName, 'executed');
            }
            else if (status === 'failed') {
                console.error(chalk_1.default.red(`❌ Defender deployment for ${stepName} failed.`));
                store.updateStatus(stepName, 'failed');
                throw new Error(`Defender deployment ${step.proposalId} failed for step ${stepName}`);
            }
            else {
                console.log(chalk_1.default.yellow(`⏳ Defender deployment for ${stepName} is still ${status}.`));
                // Optionally you can wait/poll here
            }
        }
        catch (err) {
            console.error(chalk_1.default.red(`⚠️ Error while querying Defender deploy status for ${stepName}:`), err);
        }
    }
    /**
     * Polls the Defender API until the deployment is complete or fails.
     * @param stepName The name of the step to poll.
     * @param diamond The diamond instance.
     * @param options Polling options.
     * @returns The deployment response or null if not found.
     */
    async pollUntilComplete(stepName, diamond, options = {}) {
        const { maxAttempts = process.env.NODE_ENV === 'test' ? 1 : 10, 
        // Use shorter delays in test environments
        initialDelayMs = process.env.NODE_ENV === 'test' ? 100 : 8000, maxDelayMs = process.env.NODE_ENV === 'test' ? 1000 : 60000, jitter = true } = options;
        const config = diamond.getDiamondConfig();
        const network = config.networkName;
        const deploymentId = `${diamond.diamondName}-${network}-${config.chainId}`;
        const store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId, config.deploymentsPath);
        const step = store.getStep(stepName);
        if (!step?.proposalId) {
            console.warn(`⚠️ No Defender deployment ID found for step ${stepName}`);
            return null;
        }
        let attempt = 0;
        let delay = initialDelayMs;
        while (attempt < maxAttempts) {
            try {
                const deployment = await this.client.deploy.getDeployedContract(step.proposalId);
                const status = deployment.status;
                if (status === 'completed') {
                    console.log(chalk_1.default.green(`✅ Deployment succeeded for ${stepName}.`));
                    store.updateStatus(stepName, 'executed');
                    // Update diamond data with deployed contract information
                    await this.updateDiamondWithDeployment(diamond, stepName, deployment);
                    return deployment;
                }
                if (status === 'failed') {
                    console.error(chalk_1.default.red(`❌ Deployment failed for ${stepName}.`));
                    store.updateStatus(stepName, 'failed');
                    const errorMsg = deployment.error || 'Unknown deployment error';
                    // Don't catch this error - let it bubble up immediately
                    const error = new Error(`Deployment failed for ${stepName}: ${errorMsg}`);
                    error.deployment = deployment;
                    throw error;
                }
                console.log(chalk_1.default.yellow(`⏳ Deployment ${stepName} still ${status}. Retrying in ${delay}ms...`));
            }
            catch (err) {
                // Only catch network/API errors, not deployment failures
                if (err instanceof Error && err.message.includes('Deployment failed')) {
                    throw err; // Re-throw deployment failures immediately
                }
                console.error(chalk_1.default.red(`⚠️ Error polling Defender for ${stepName}:`), err);
                if (attempt >= maxAttempts - 1) {
                    throw err;
                }
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
        console.warn(chalk_1.default.red(`⚠️ Deployment for ${stepName} did not complete after ${maxAttempts} attempts.`));
        return null;
    }
    /**
     * Updates the diamond data with deployment information from Defender
     */
    async updateDiamondWithDeployment(diamond, stepName, deployment) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const contractAddress = deployment.contractAddress;
        if (!contractAddress) {
            console.warn(chalk_1.default.yellow(`⚠️ No contract address found in deployment response for ${stepName}`));
            return;
        }
        if (stepName === 'deploy-diamondcutfacet') {
            // Get DiamondCutFacet interface for function selectors
            let diamondCutFacetFunctionSelectors = [];
            try {
                const diamondCutContractName = await (0, contractMapping_1.getContractName)("DiamondCutFacet");
                const diamondCutFactory = await hardhat_1.default.ethers.getContractFactory(diamondCutContractName, diamond.getSigner());
                diamondCutFacetFunctionSelectors = [];
                diamondCutFactory.interface.forEachFunction((func) => {
                    diamondCutFacetFunctionSelectors.push(func.selector);
                });
            }
            catch (error) {
                console.log(chalk_1.default.yellow(`⚠️ Could not get function selectors for DiamondCutFacet (likely in test environment): ${error}`));
                // Use default selectors for DiamondCutFacet in test environments
                diamondCutFacetFunctionSelectors = ['0x1f931c1c']; // diamondCut function
            }
            deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
            deployedDiamondData.DeployedFacets["DiamondCutFacet"] = {
                address: contractAddress,
                tx_hash: deployment.txHash || 'defender-deployment',
                version: 0,
                funcSelectors: diamondCutFacetFunctionSelectors,
            };
            // Register the DiamondCutFacet function selectors
            const diamondCutFacetSelectorsRegistry = diamondCutFacetFunctionSelectors.reduce((acc, selector) => {
                acc[selector] = {
                    facetName: "DiamondCutFacet",
                    priority: diamond.getFacetsConfig()?.DiamondCutFacet?.priority || 1000,
                    address: contractAddress,
                    action: 0, // RegistryFacetCutAction.Deployed
                };
                return acc;
            }, {});
            diamond.registerFunctionSelectors(diamondCutFacetSelectorsRegistry);
        }
        else if (stepName === 'deploy-diamond') {
            deployedDiamondData.DiamondAddress = contractAddress;
        }
        else if (stepName.startsWith('deploy-')) {
            // Extract facet name from step name
            const facetName = stepName.replace('deploy-', '');
            try {
                // Get facet interface for function selectors
                let facetSelectors = [];
                try {
                    const facetFactory = await hardhat_1.default.ethers.getContractFactory(facetName, diamond.getSigner());
                    facetSelectors = [];
                    facetFactory.interface.forEachFunction((func) => {
                        facetSelectors.push(func.selector);
                    });
                }
                catch (error) {
                    console.log(chalk_1.default.yellow(`⚠️ Could not get function selectors for ${facetName} (likely in test environment): ${error}`));
                    // Use empty selectors in test environments
                    facetSelectors = [];
                }
                const deployConfig = diamond.getDeployConfig();
                const facetConfig = deployConfig.facets[facetName];
                const availableVersions = Object.keys(facetConfig.versions ?? {}).map(Number);
                const targetVersion = Math.max(...availableVersions);
                deployedDiamondData.DeployedFacets = deployedDiamondData.DeployedFacets || {};
                deployedDiamondData.DeployedFacets[facetName] = {
                    address: contractAddress,
                    tx_hash: deployment.txHash || 'defender-deployment',
                    version: targetVersion,
                    funcSelectors: facetSelectors,
                };
                // Update new deployed facets for diamond cut preparation
                const initFn = diamond.newDeployment
                    ? facetConfig.versions?.[targetVersion]?.deployInit || ""
                    : facetConfig.versions?.[targetVersion]?.upgradeInit || "";
                if (initFn && facetName !== deployConfig.protocolInitFacet) {
                    diamond.initializerRegistry.set(facetName, initFn);
                }
                const newFacetData = {
                    priority: facetConfig.priority || 1000,
                    address: contractAddress,
                    tx_hash: deployment.txHash || 'defender-deployment',
                    version: targetVersion,
                    funcSelectors: facetSelectors,
                    deployInclude: facetConfig.versions?.[targetVersion]?.deployInclude || [],
                    deployExclude: facetConfig.versions?.[targetVersion]?.deployExclude || [],
                    initFunction: initFn,
                    verified: false,
                };
                diamond.updateNewDeployedFacets(facetName, newFacetData);
            }
            catch (err) {
                console.warn(chalk_1.default.yellow(`⚠️ Could not get interface for facet ${facetName}: ${err}`));
            }
        }
        diamond.updateDeployedDiamondData(deployedDiamondData);
    }
    async preDeployDiamondTasks(diamond) {
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Pre-deploy diamond tasks for ${diamond.diamondName} from ${this.constructor.name}...`));
        }
        await this.checkAndUpdateDeployStep('deploy-diamondcutfacet', diamond);
        await this.checkAndUpdateDeployStep('deploy-diamond', diamond);
    }
    async deployDiamondTasks(diamond) {
        const diamondConfig = diamond.getDiamondConfig();
        const network = diamondConfig.networkName;
        const deploymentId = `${diamond.diamondName}-${network}-${diamondConfig.chainId}`;
        const store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId, diamondConfig.deploymentsPath);
        const signer = diamond.getSigner();
        const deployerAddress = await signer.getAddress();
        // ---- Deploy DiamondCutFacet ----
        const stepNameCut = 'deploy-diamondcutfacet';
        const cutStep = store.getStep(stepNameCut);
        if (!cutStep || (cutStep.status !== 'executed' && cutStep.status !== 'failed')) {
            const diamondCutContractName = await (0, contractMapping_1.getContractName)('DiamondCutFacet');
            const diamondCutArtifact = await (0, contractMapping_1.getContractArtifact)('DiamondCutFacet');
            const cutRequest = {
                network,
                contractName: diamondCutContractName,
                contractPath: `${diamond.contractsPath}/${diamondCutContractName}.sol`,
                constructorInputs: [],
                verifySourceCode: true, // TODO Verify this should be true or optional
                artifactPayload: JSON.stringify({
                    contracts: {
                        [diamondCutContractName]: diamondCutArtifact
                    }
                }), // Format for Defender SDK
            };
            const cutDeployment = await this.client.deploy.deployContract(cutRequest);
            store.saveStep({
                stepName: stepNameCut,
                proposalId: cutDeployment.deploymentId,
                status: 'pending',
                description: 'DiamondCutFacet deployed via Defender DeployClient',
                timestamp: Date.now()
            });
            await this.pollUntilComplete(stepNameCut, diamond);
            console.log(chalk_1.default.blue(`📡 Submitted DiamondCutFacet deploy to Defender: ${cutDeployment.deploymentId}`));
        }
        // ---- Deploy Diamond ----
        const stepNameDiamond = 'deploy-diamond';
        const diamondStep = store.getStep(stepNameDiamond);
        if (!diamondStep || (diamondStep.status !== 'executed' && diamondStep.status !== 'failed')) {
            const diamondContractName = await (0, contractMapping_1.getDiamondContractName)(diamond.diamondName);
            const diamondArtifact = await (0, contractMapping_1.getContractArtifact)(diamond.diamondName);
            const diamondRequest = {
                network,
                contractName: diamondContractName,
                contractPath: `${diamond.contractsPath}/${diamondContractName}.sol`,
                constructorInputs: [deployerAddress, ethers_1.ethers.ZeroAddress], // Make sure constructor matches
                verifySourceCode: true, // TODO Verify this should be true or optional
                artifactPayload: JSON.stringify({
                    contracts: {
                        [diamondContractName]: diamondArtifact
                    }
                }), // Format for Defender SDK
            };
            const diamondDeployment = await this.client.deploy.deployContract(diamondRequest);
            store.saveStep({
                stepName: stepNameDiamond,
                proposalId: diamondDeployment.deploymentId,
                status: 'pending',
                description: 'Diamond deployed via Defender DeployClient',
                timestamp: Date.now()
            });
            await this.pollUntilComplete(stepNameDiamond, diamond);
            console.log(chalk_1.default.blue(`📡 Submitted Diamond deploy to Defender: ${diamondDeployment.deploymentId}`));
        }
    }
    async preDeployFacetsTasks(diamond) {
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
    async deployFacetsTasks(diamond) {
        const deployConfig = diamond.getDeployConfig();
        const facetsConfig = deployConfig.facets;
        const diamondConfig = diamond.getDiamondConfig();
        const network = diamondConfig.networkName;
        const deploymentId = `${diamond.diamondName}-${network}-${diamondConfig.chainId}`;
        const store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, deploymentId, diamondConfig.deploymentsPath);
        const signer = diamond.getSigner();
        const facetNamesSorted = Object.keys(facetsConfig).sort((a, b) => {
            return (facetsConfig[a].priority ?? 1000) - (facetsConfig[b].priority ?? 1000);
        });
        for (const facetName of facetNamesSorted) {
            const stepKey = `deploy-${facetName}`;
            const step = store.getStep(stepKey);
            if (step?.status === 'executed') {
                console.log(chalk_1.default.gray(`⏩ Skipping already-deployed facet: ${facetName}`));
                continue;
            }
            const facetConfig = facetsConfig[facetName];
            const deployedVersion = diamond.getDeployedDiamondData().DeployedFacets?.[facetName]?.version ?? -1;
            const availableVersions = Object.keys(facetConfig.versions ?? {}).map(Number);
            const targetVersion = Math.max(...availableVersions);
            if (targetVersion <= deployedVersion && deployedVersion !== -1) {
                console.log(chalk_1.default.gray(`⏩ Skipping facet ${facetName}, already at version ${deployedVersion}`));
                continue;
            }
            console.log(chalk_1.default.cyan(`🔧 Deploying facet ${facetName} to version ${targetVersion}...`));
            const facetContractName = await (0, contractMapping_1.getContractName)(facetName);
            const facetArtifact = await (0, contractMapping_1.getContractArtifact)(facetName);
            const deployRequest = {
                network,
                contractName: facetContractName,
                contractPath: `${diamond.contractsPath}/${facetContractName}.sol`,
                constructorInputs: [],
                verifySourceCode: true, // TODO Verify this should be true or optional
                artifactPayload: JSON.stringify({
                    contracts: {
                        [facetContractName]: facetArtifact
                    }
                }), // Format for Defender SDK
            };
            const deployResult = await this.client.deploy.deployContract(deployRequest);
            store.saveStep({
                stepName: stepKey,
                proposalId: deployResult.deploymentId,
                status: 'pending',
                description: `Facet ${facetName} deployment submitted`,
                timestamp: Date.now()
            });
            await this.pollUntilComplete(stepKey, diamond);
            console.log(chalk_1.default.blue(`📡 Submitted deployment for facet ${facetName}: ${deployResult.deploymentId}`));
        }
    }
    /**
     * Performs the diamond cut tasks using OpenZeppelin Defender.
     * @param diamond The diamond instance.
     */
    async performDiamondCutTasks(diamond) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const diamondAddress = deployedDiamondData.DiamondAddress;
        const deployConfig = diamond.getDeployConfig();
        const diamondConfig = diamond.getDiamondConfig();
        const network = diamondConfig.networkName;
        const [initCalldata, initAddress] = await this.getInitCalldata(diamond);
        const facetCuts = await this.getFacetCuts(diamond);
        await this.validateNoOrphanedSelectors(facetCuts);
        if (this.verbose) {
            console.log(chalk_1.default.yellowBright(`\n🪓 Performing DiamondCut with ${facetCuts.length} cut(s):`));
            for (const cut of facetCuts) {
                console.log(chalk_1.default.bold(`- ${types_1.FacetCutAction[cut.action]} for facet ${cut.name} at ${cut.facetAddress}`));
                console.log(chalk_1.default.gray(`  Selectors:`), cut.functionSelectors);
            }
            if (initAddress !== ethers_1.ethers.ZeroAddress) {
                console.log(chalk_1.default.cyan(`Initializing with functionSelector ${initCalldata} on ProtocolInitFacet ${deployConfig.protocolInitFacet} @ ${initAddress}`));
            }
        }
        const proposal = {
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
        console.log(chalk_1.default.blue(`📡 Defender Proposal created: ${url}`));
        // Store the proposal
        const store = new defenderStore_1.DefenderDeploymentStore(diamond.diamondName, `${diamond.diamondName}-${network}-${diamondConfig.chainId}`, diamondConfig.deploymentsPath);
        store.saveStep({
            stepName: 'diamond-cut',
            proposalId,
            status: 'pending',
            description: `DiamondCut proposal with ${facetCuts.length} facets`,
            timestamp: Date.now()
        });
        if (this.autoApprove) {
            console.log(chalk_1.default.yellow(`⏳ Auto-approval enabled. Waiting for proposal to be ready for execution...`));
            let attempts = 0;
            const maxAttempts = 20;
            // Use shorter delay in test environments
            const delayMs = process.env.NODE_ENV === 'test' ? 1000 : 15000;
            while (attempts < maxAttempts) {
                try {
                    const proposalData = await this.client.proposal.get(proposalId);
                    // Check if proposal has execution data - API structure may vary
                    // Using optional chaining to handle different API versions
                    const isExecuted = proposalData?.transaction?.isExecuted ?? false;
                    const isReverted = proposalData?.transaction?.isReverted ?? false;
                    if (isExecuted && !isReverted) {
                        console.log(chalk_1.default.green(`✅ Proposal executed successfully.`));
                        store.updateStatus('diamond-cut', 'executed');
                        return;
                    }
                    if (isExecuted && isReverted) {
                        console.error(chalk_1.default.red(`❌ Proposal execution reverted.`));
                        store.updateStatus('diamond-cut', 'failed');
                        throw new Error(`Proposal execution reverted: ${proposalId}`);
                    }
                    // For auto-approval, we'll just log the status
                    // Note: The actual execution method may vary by Defender API version
                    console.log(chalk_1.default.gray(`⌛ Proposal status check ${attempts + 1}/${maxAttempts}. Manual execution may be required.`));
                }
                catch (err) {
                    console.error(chalk_1.default.red(`⚠️ Error checking proposal status:`), err);
                    if (attempts >= maxAttempts - 1) {
                        throw err;
                    }
                }
                await new Promise((res) => setTimeout(res, delayMs));
                attempts++;
            }
            if (attempts >= maxAttempts) {
                console.warn(chalk_1.default.red(`⚠️ Proposal polling completed after ${maxAttempts} attempts.`));
                console.log(chalk_1.default.blue(`🔗 Manual execution may be required: ${url}`));
            }
        }
        else {
            console.log(chalk_1.default.blue(`🔗 Manual approval required: ${url}`));
        }
    }
}
exports.OZDefenderDeploymentStrategy = OZDefenderDeploymentStrategy;
//# sourceMappingURL=OZDefenderDeploymentStrategy.js.map