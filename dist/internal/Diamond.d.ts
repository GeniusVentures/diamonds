import { DeployedDiamondData, DeployConfig, FacetsConfig } from "../schemas";
import { CallbackManager } from "./CallbackManager";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "ethers";
import { DeploymentRepository } from "../repositories/DeploymentRepository";
import { DiamondConfig } from "../types";
export declare class Diamond {
    private static instances;
    diamondName: string;
    networkName: string;
    chainId: number;
    deploymentsPath: string;
    contractsPath: string;
    deploymentId: string;
    facetSelectors: string[];
    callbackManager: CallbackManager;
    private deployedDiamondData;
    private config;
    private facetsConfig;
    private repository;
    signer: Signer | undefined;
    provider: JsonRpcProvider | undefined;
    deployConfig: DeployConfig;
    constructor(config: DiamondConfig, repository: DeploymentRepository);
    getDeployedDiamondData(): DeployedDiamondData;
    updateDeployedDiamondData(data: DeployedDiamondData): void;
    getDiamondConfig(): DiamondConfig;
    getDeployConfig(): DeployConfig;
    getFacetsConfig(): FacetsConfig;
    isUpgradeDeployment(): boolean;
    selectorRegistry: Set<string>;
    registerSelectors(selectors: string[]): void;
    isSelectorRegistered(selector: string): boolean;
    initializerRegistry: Map<string, string>;
    registerInitializers(facetName: string, initFunction: string): void;
}
export default Diamond;
//# sourceMappingURL=Diamond.d.ts.map