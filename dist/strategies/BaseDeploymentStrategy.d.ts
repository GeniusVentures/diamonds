import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
export declare class BaseDeploymentStrategy implements DeploymentStrategy {
    protected verbose: boolean;
    constructor(verbose?: boolean);
    deployDiamond(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<void>;
    private _deployFacets;
    updateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    private _updateFunctionSelectorRegistry;
    performDiamondCut(diamond: Diamond): Promise<void>;
    runPostDeployCallbacks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=BaseDeploymentStrategy.d.ts.map