import { Diamond } from "../core/Diamond";
export interface DeploymentStrategy {
    preDeployDiamond(diamond: Diamond): Promise<void>;
    deployDiamond(diamond: Diamond): Promise<void>;
    postDeployDiamond(diamond: Diamond): Promise<void>;
    preDeployFacets(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<void>;
    postDeployFacets(diamond: Diamond): Promise<void>;
    preUpdateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    updateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    postUpdateFunctionSelectorRegistry(diamond: Diamond): Promise<void>;
    prePerformDiamondCut(diamond: Diamond): Promise<void>;
    performDiamondCut(diamond: Diamond): Promise<void>;
    postPerformDiamondCut(diamond: Diamond): Promise<void>;
    preRunPostDeployCallbacks(diamond: Diamond): Promise<void>;
    runPostDeployCallbacks(diamond: Diamond): Promise<void>;
    postRunPostDeployCallbacks(diamond: Diamond): Promise<void>;
}
//# sourceMappingURL=DeploymentStrategy.d.ts.map