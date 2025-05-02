import { Diamond } from "../internal/Diamond";
export interface DeploymentStrategy {
    deployDiamond(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<void>;
    updateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    performDiamondCut(diamond: Diamond): Promise<void>;
    runPostDeployCallbacks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=DeploymentStrategy.d.ts.map