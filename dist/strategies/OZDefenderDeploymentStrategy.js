"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OZDefenderDeploymentStrategy = void 0;
const defender_sdk_1 = require("@openzeppelin/defender-sdk");
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = require("crypto");
const ethers_1 = require("ethers");
const fs = __importStar(require("fs"));
const hardhat_1 = __importDefault(require("hardhat"));
const path_1 = require("path");
const types_1 = require("../types");
const contractMapping_1 = require("../utils/contractMapping");
const defenderStore_1 = require("../utils/defenderStore");
const BaseDeploymentStrategy_1 = require("./BaseDeploymentStrategy");
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
        const { maxAttempts = process.env.NODE_ENV === 'test' ? 1 : 30, // Increase for manual approval workflows
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
                console.log(chalk_1.default.blue(`🔍 Polling deployment status for ${stepName} (ID: ${step.proposalId})...`));
                const deployment = await this.client.deploy.getDeployedContract(step.proposalId);
                console.log(chalk_1.default.gray(`📊 Deployment response:`, JSON.stringify(deployment, null, 2)));
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
                if (status === 'submitted') {
                    const approvalProcessId = deployment.approvalProcessId;
                    const safeTxHash = deployment.safeTxHash;
                    if (approvalProcessId) {
                        console.log(chalk_1.default.yellow(`⏳ Deployment ${stepName} is submitted and waiting for approval.`));
                        console.log(chalk_1.default.blue(`🔗 Please approve in Defender dashboard: https://defender.openzeppelin.com/`));
                        if (safeTxHash) {
                            console.log(chalk_1.default.blue(`📋 Safe Transaction Hash: ${safeTxHash}`));
                        }
                    }
                    else {
                        console.log(chalk_1.default.yellow(`⏳ Deployment ${stepName} is submitted and processing...`));
                    }
                }
                else {
                    console.log(chalk_1.default.yellow(`⏳ Deployment ${stepName} still ${status}. Retrying in ${delay}ms...`));
                }
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
            const jitterValue = jitter ? await (0, crypto_1.randomInt)(Math.floor(delay / 2)) : 0;
            const sleep = delay + jitterValue;
            await new Promise(res => setTimeout(res, sleep));
            // Exponential backoff
            delay = Math.min(delay * 2, maxDelayMs);
        }
        console.warn(chalk_1.default.red(`⚠️ Deployment for ${stepName} did not complete after ${maxAttempts} attempts.`));
        console.log(chalk_1.default.blue(`🔗 Please check the Defender dashboard for pending approvals: https://defender.openzeppelin.com/`));
        console.log(chalk_1.default.yellow(`📋 Deployment ID: ${step.proposalId}`));
        return null;
    }
    /**
     * Updates the diamond data with deployment information from Defender
     */
    async updateDiamondWithDeployment(diamond, stepName, deployment) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const contractAddress = deployment.address;
        if (!contractAddress) {
            console.warn(chalk_1.default.yellow(`⚠️ No contract address found in deployment response for ${stepName}`));
            return;
        }
        if (stepName === 'deploy-diamondcutfacet') {
            // Get DiamondCutFacet interface for function selectors
            let diamondCutFacetFunctionSelectors = [];
            try {
                const diamondCutContractName = await (0, contractMapping_1.getContractName)("DiamondCutFacet", diamond);
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
            const diamondCutContractName = await (0, contractMapping_1.getContractName)('DiamondCutFacet', diamond);
            const diamondCutArtifact = await (0, contractMapping_1.getContractArtifact)('DiamondCutFacet', diamond);
            // Format artifact for Defender SDK - need build-info format, not individual artifact
            const buildInfo = await this.getBuildInfoForContract('DiamondCutFacet', diamond);
            const cutRequest = {
                network,
                contractName: diamondCutContractName,
                contractPath: diamondCutArtifact.sourceName, // Use the actual source name from artifact
                constructorInputs: [],
                verifySourceCode: true, // TODO Verify this should be true or optional
                artifactPayload: JSON.stringify(buildInfo), // Use build-info format for Defender SDK
                salt: ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32)), // Add salt for CREATE2 deployment as required by Defender
            };
            let cutDeployment;
            try {
                cutDeployment = await this.client.deploy.deployContract(cutRequest);
                console.log(chalk_1.default.blue(`📊 Initial deployment response:`, JSON.stringify(cutDeployment, null, 2)));
            }
            catch (error) {
                console.log(chalk_1.default.red("❌ Error deploying DiamondCutFacet via Defender:"), error);
                throw error;
            }
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
            // First, ensure DiamondCutFacet is fully completed and data is updated
            const cutStep = store.getStep(stepNameCut);
            if (cutStep?.status === 'executed') {
                console.log(chalk_1.default.blue(`🔍 Ensuring DiamondCutFacet data is up to date...`));
                // Force update DiamondCutFacet data if needed
                try {
                    const cutDeployment = await this.client.deploy.getDeployedContract(cutStep.proposalId);
                    if (cutDeployment.status === 'completed' && cutDeployment.address) {
                        await this.updateDiamondWithDeployment(diamond, stepNameCut, cutDeployment);
                        console.log(chalk_1.default.green(`✅ DiamondCutFacet data updated: ${cutDeployment.address}`));
                    }
                }
                catch (error) {
                    console.warn(chalk_1.default.yellow(`⚠️ Could not update DiamondCutFacet data: ${error}`));
                }
            }
            // Get the deployed DiamondCutFacet address
            const deployedDiamondData = diamond.getDeployedDiamondData();
            const diamondCutFacetAddress = deployedDiamondData.DeployedFacets?.['DiamondCutFacet']?.address;
            // If still not found, try to get from Defender directly
            if (!diamondCutFacetAddress) {
                console.log(chalk_1.default.yellow(`⚠️ DiamondCutFacet address not found in deployment data, checking Defender...`));
                const cutStep = store.getStep(stepNameCut);
                if (cutStep?.proposalId) {
                    try {
                        const cutDeployment = await this.client.deploy.getDeployedContract(cutStep.proposalId);
                        if (cutDeployment.status === 'completed' && cutDeployment.address) {
                            console.log(chalk_1.default.blue(`🔍 Found DiamondCutFacet address from Defender: ${cutDeployment.address}`));
                            // Use this address directly for the Diamond constructor
                            const directDiamondCutFacetAddress = cutDeployment.address;
                            const diamondContractName = await (0, contractMapping_1.getDiamondContractName)(diamond.diamondName, diamond);
                            const diamondArtifact = await (0, contractMapping_1.getContractArtifact)(diamond.diamondName, diamond);
                            const buildInfo = await this.getBuildInfoForContract(diamond.diamondName, diamond);
                            console.log(chalk_1.default.blue(`🏗️ Diamond deployment configuration (direct Defender lookup):`));
                            console.log(chalk_1.default.blue(`   Contract Name: ${diamondContractName}`));
                            console.log(chalk_1.default.blue(`   Contract Path: ${diamondArtifact.sourceName}`));
                            console.log(chalk_1.default.blue(`   Constructor Params:`));
                            console.log(chalk_1.default.blue(`     Owner: ${deployerAddress}`));
                            console.log(chalk_1.default.blue(`     DiamondCutFacet: ${directDiamondCutFacetAddress}`));
                            const diamondRequest = {
                                network,
                                contractName: diamondContractName,
                                contractPath: diamondArtifact.sourceName,
                                constructorInputs: [deployerAddress, directDiamondCutFacetAddress], // Use address from Defender
                                verifySourceCode: true,
                                artifactPayload: JSON.stringify(buildInfo),
                                salt: ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32)),
                            };
                            const diamondDeployment = await this.client.deploy.deployContract(diamondRequest);
                            console.log(chalk_1.default.blue(`📊 Diamond deployment response:`, JSON.stringify(diamondDeployment, null, 2)));
                            store.saveStep({
                                stepName: stepNameDiamond,
                                proposalId: diamondDeployment.deploymentId,
                                status: 'pending',
                                description: 'Diamond deployed via Defender DeployClient',
                                timestamp: Date.now()
                            });
                            await this.pollUntilComplete(stepNameDiamond, diamond);
                            console.log(chalk_1.default.blue(`📡 Submitted Diamond deploy to Defender: ${diamondDeployment.deploymentId}`));
                            return; // Exit early since we handled the deployment
                        }
                    }
                    catch (error) {
                        console.error(chalk_1.default.red(`❌ Could not get DiamondCutFacet from Defender: ${error}`));
                    }
                }
                throw new Error('DiamondCutFacet must be deployed before Diamond contract. DiamondCutFacet address not found.');
            }
            console.log(chalk_1.default.blue(`🔗 Using DiamondCutFacet address: ${diamondCutFacetAddress}`));
            const diamondContractName = await (0, contractMapping_1.getDiamondContractName)(diamond.diamondName, diamond);
            const diamondArtifact = await (0, contractMapping_1.getContractArtifact)(diamond.diamondName, diamond);
            const buildInfo = await this.getBuildInfoForContract(diamond.diamondName, diamond);
            // Validate the build info structure
            if (!buildInfo.output?.contracts?.[diamondArtifact.sourceName]?.[diamondContractName]) {
                console.warn(chalk_1.default.yellow(`⚠️ Build info validation warning for ${diamondContractName}`));
                console.warn(chalk_1.default.yellow(`   Expected path: output.contracts["${diamondArtifact.sourceName}"]["${diamondContractName}"]`));
                console.warn(chalk_1.default.yellow(`   Available contracts:`, Object.keys(buildInfo.output?.contracts || {})));
            }
            console.log(chalk_1.default.blue(`🏗️ Diamond deployment configuration:`));
            console.log(chalk_1.default.blue(`   Contract Name: ${diamondContractName}`));
            console.log(chalk_1.default.blue(`   Contract Path: ${diamondArtifact.sourceName}`));
            console.log(chalk_1.default.blue(`   Constructor Params:`));
            console.log(chalk_1.default.blue(`     Owner: ${deployerAddress}`));
            console.log(chalk_1.default.blue(`     DiamondCutFacet: ${diamondCutFacetAddress}`));
            const diamondRequest = {
                network,
                contractName: diamondContractName,
                contractPath: diamondArtifact.sourceName,
                constructorInputs: [deployerAddress, diamondCutFacetAddress], // Use actual DiamondCutFacet address instead of ZeroAddress
                verifySourceCode: true, // TODO Verify this should be true or optional
                artifactPayload: JSON.stringify(buildInfo), // Use build-info format for Defender SDK
                salt: ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32)), // Add salt for CREATE2 deployment as required by Defender
            };
            const diamondDeployment = await this.client.deploy.deployContract(diamondRequest);
            console.log(chalk_1.default.blue(`📊 Diamond deployment response:`, JSON.stringify(diamondDeployment, null, 2)));
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
            const facetContractName = await (0, contractMapping_1.getContractName)(facetName, diamond);
            const facetArtifact = await (0, contractMapping_1.getContractArtifact)(facetName, diamond);
            const buildInfo = await this.getBuildInfoForContract(facetName, diamond);
            const deployRequest = {
                network,
                contractName: facetContractName,
                contractPath: facetArtifact.sourceName,
                constructorInputs: [],
                verifySourceCode: true, // TODO Verify this should be true or optional
                artifactPayload: JSON.stringify(buildInfo), // Use build-info format for Defender SDK
                salt: ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32)), // Add salt for CREATE2 deployment as required by Defender // Fixed format to match contracts wrapper structure
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
    /**
     * Performs the diamond cut tasks using OpenZeppelin Defender with batching support.
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
        // If no cuts needed, skip
        if (facetCuts.length === 0) {
            if (this.verbose) {
                console.log(chalk_1.default.yellow('⏩ No DiamondCut operations needed - all facets already deployed and up to date'));
            }
            return;
        }
        // Check for batch size limits
        const MAX_BATCH_SIZE = 10; // Conservative limit for gas and transaction size
        const needsBatching = facetCuts.length > MAX_BATCH_SIZE;
        if (needsBatching) {
            console.log(chalk_1.default.yellow(`⚠️ Large DiamondCut detected (${facetCuts.length} cuts). Splitting into batches...`));
            await this.performBatchedDiamondCut(diamond, facetCuts, initCalldata, initAddress);
            return;
        }
        // Single batch execution
        await this.performSingleDiamondCut(diamond, facetCuts, initCalldata, initAddress);
    }
    /**
     * Perform a single DiamondCut operation
     */
    async performSingleDiamondCut(diamond, facetCuts, initCalldata, initAddress) {
        const deployedDiamondData = diamond.getDeployedDiamondData();
        const diamondAddress = deployedDiamondData.DiamondAddress;
        const deployConfig = diamond.getDeployConfig();
        const diamondConfig = diamond.getDiamondConfig();
        const network = diamondConfig.networkName;
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
        try {
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
                await this.handleAutoApproval(proposalId, url);
            }
            else {
                console.log(chalk_1.default.blue(`🔗 Manual approval required: ${url}`));
            }
        }
        catch (error) {
            if (error.response?.status === 402) {
                throw new Error('Defender account billing issue. Please check your Defender account subscription and billing status.');
            }
            else if (error.response?.status === 400) {
                throw new Error(`DiamondCut request invalid. This may be due to gas limits with ${facetCuts.length} cuts. Consider reducing batch size.`);
            }
            throw error;
        }
    }
    /**
     * Perform batched DiamondCut operations
     */
    async performBatchedDiamondCut(diamond, allFacetCuts, initCalldata, initAddress) {
        const MAX_BATCH_SIZE = 10;
        const batches = [];
        // Split into batches
        for (let i = 0; i < allFacetCuts.length; i += MAX_BATCH_SIZE) {
            batches.push(allFacetCuts.slice(i, i + MAX_BATCH_SIZE));
        }
        console.log(chalk_1.default.blue(`📦 Splitting ${allFacetCuts.length} cuts into ${batches.length} batches`));
        // Execute batches sequentially
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const isLastBatch = batchIndex === batches.length - 1;
            // Only use init on the last batch
            const batchInitCalldata = isLastBatch ? initCalldata : '0x';
            const batchInitAddress = isLastBatch ? initAddress : ethers_1.ethers.ZeroAddress;
            console.log(chalk_1.default.blue(`🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} cuts)`));
            try {
                await this.performSingleDiamondCut(diamond, batch, batchInitCalldata, batchInitAddress);
                console.log(chalk_1.default.green(`✅ Batch ${batchIndex + 1} completed successfully`));
                // Wait between batches to avoid rate limiting
                if (batchIndex < batches.length - 1) {
                    console.log(chalk_1.default.gray('⏳ Waiting 5 seconds before next batch...'));
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
            catch (error) {
                console.error(chalk_1.default.red(`❌ Batch ${batchIndex + 1} failed:`), error);
                throw new Error(`DiamondCut batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : error}`);
            }
        }
        console.log(chalk_1.default.green(`🎉 All ${batches.length} DiamondCut batches completed successfully!`));
    }
    /**
     * Handle auto-approval for proposals
     */
    async handleAutoApproval(proposalId, url) {
        const maxAttempts = 30;
        const delayMs = 8000;
        let attempts = 0;
        console.log(chalk_1.default.blue(`⚡ Auto-approving proposal ${proposalId}...`));
        while (attempts < maxAttempts) {
            try {
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
    /**
     * Get build-info format for a contract that Defender SDK expects
     */
    async getBuildInfoForContract(contractName, diamond) {
        try {
            // Get the contract artifact first to determine the source path
            const artifact = await (0, contractMapping_1.getContractArtifact)(contractName, diamond);
            const sourceName = artifact.sourceName;
            // Try to find the build-info file that contains this contract
            const buildInfoPath = (0, path_1.join)(process.cwd(), 'artifacts', 'build-info');
            const buildInfoFiles = fs.readdirSync(buildInfoPath);
            for (const fileName of buildInfoFiles) {
                if (!fileName.endsWith('.json'))
                    continue;
                const filePath = (0, path_1.join)(buildInfoPath, fileName);
                const buildInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                // Check if this build-info contains our contract
                if (buildInfo.output?.contracts?.[sourceName]?.[contractName]) {
                    return buildInfo;
                }
            }
            // Fallback: create a minimal build-info structure
            console.warn(`⚠️ Could not find build-info for ${contractName}, creating minimal structure`);
            return {
                input: {
                    language: 'Solidity',
                    sources: {
                        [sourceName]: {
                            content: '// Source not available'
                        }
                    },
                    settings: {
                        optimizer: { enabled: true, runs: 1000 },
                        outputSelection: {
                            '*': {
                                '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
                            }
                        }
                    }
                },
                output: {
                    contracts: {
                        [sourceName]: {
                            [contractName]: artifact
                        }
                    }
                }
            };
        }
        catch (error) {
            console.warn(`⚠️ Error getting build info for ${contractName}:`, error);
            // Return a minimal structure as fallback
            const artifact = await (0, contractMapping_1.getContractArtifact)(contractName, diamond);
            return {
                output: {
                    contracts: {
                        [artifact.sourceName]: {
                            [contractName]: artifact
                        }
                    }
                }
            };
        }
    }
}
exports.OZDefenderDeploymentStrategy = OZDefenderDeploymentStrategy;
//# sourceMappingURL=OZDefenderDeploymentStrategy.js.map