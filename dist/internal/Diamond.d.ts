import { INetworkDeployInfo, FacetsConfig } from "../schemas";
import { FacetCallbackManager } from "./FacetCallbackManager";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "ethers";
import { DeploymentRepository } from "../utils/DeploymentRepository";
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
    callbackManager: FacetCallbackManager;
    private deployInfo;
    private facetsConfig;
    private repository;
    deployer: Signer | undefined;
    provider: JsonRpcProvider | undefined;
    deployInfoFilePath: string;
    facetsConfigFilePath: string;
    createNewDeploymentFile: boolean;
    constructor(config: DiamondConfig, repository: DeploymentRepository);
    getDeployInfo(): INetworkDeployInfo;
    updateDeployInfo(info: INetworkDeployInfo): void;
    getFacetsConfig(): FacetsConfig;
    isUpgradeDeployment(): boolean;
    private selectorRegistry;
    registerSelectors(selectors: string[]): void;
    isSelectorRegistered(selector: string): boolean;
}
export default Diamond;
//# sourceMappingURL=Diamond.d.ts.map