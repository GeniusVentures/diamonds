import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetCuts } from "../types";
export declare class BaseDeploymentStrategy implements DeploymentStrategy {
    protected verbose: boolean;
    constructor(verbose?: boolean);
    deployDiamond(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<void>;
    private _deployFacets;
    updateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    private _updateFunctionSelectorRegistry;
    performDiamondCut(diamond: Diamond): Promise<void>;
    getInitCalldata(diamond: Diamond): Promise<[string, string]>;
    getFacetCuts(diamond: Diamond): Promise<FacetCuts>;
    validateNoOrphanedSelectors(facetCuts: FacetCuts): Promise<void>;
    postDiamondCutDeployedDataUpdate(diamond: Diamond, txHash: string): Promise<void>;
    runPostDeployCallbacks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=BaseDeploymentStrategy.d.ts.map