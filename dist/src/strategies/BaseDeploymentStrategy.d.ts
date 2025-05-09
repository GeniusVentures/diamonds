import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetCuts } from "../types";
export declare class BaseDeploymentStrategy implements DeploymentStrategy {
    protected verbose: boolean;
    constructor(verbose?: boolean);
    protected preDeployDiamond(diamond: Diamond): Promise<void>;
    protected preDeployDiamondTasks(diamond: Diamond): Promise<void>;
    deployDiamond(diamond: Diamond): Promise<void>;
    protected _deployDiamond(diamond: Diamond): Promise<void>;
    postDeployDiamond(diamond: Diamond): Promise<void>;
    protected postDeployDiamondTasks(diamond: Diamond): Promise<void>;
    preDeployFacets(diamond: Diamond): Promise<void>;
    protected preDeployFacetsTasks(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<void>;
    protected _deployFacets(diamond: Diamond): Promise<void>;
    postDeployFacets(diamond: Diamond): Promise<void>;
    protected postDeployFacetsTasks(diamond: Diamond): Promise<void>;
    updateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    protected preUpdateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    protected postUpdateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    protected _updateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    performDiamondCut(diamond: Diamond): Promise<void>;
    protected prePerformDiamondCut(diamond: Diamond): Promise<void>;
    protected postPerformDiamondCut(diamond: Diamond): Promise<void>;
    protected _performDiamondCut(diamond: Diamond): Promise<void>;
    getInitCalldata(diamond: Diamond): Promise<[string, string]>;
    getFacetCuts(diamond: Diamond): Promise<FacetCuts>;
    validateNoOrphanedSelectors(facetCuts: FacetCuts): Promise<void>;
    postDiamondCutDeployedDataUpdate(diamond: Diamond, txHash: string): Promise<void>;
    runPostDeployCallbacks(diamond: Diamond): Promise<void>;
    protected preRunPostDeployCallbacks(diamond: Diamond): Promise<void>;
    protected postRunPostDeployCallbacks(diamond: Diamond): Promise<void>;
    protected _runPostDeployCallbacks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=BaseDeploymentStrategy.d.ts.map