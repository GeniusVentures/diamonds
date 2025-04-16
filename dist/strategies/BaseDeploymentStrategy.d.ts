import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo } from "../types";
export declare class BaseDeploymentStrategy implements DeploymentStrategy {
    protected verbose: boolean;
    constructor(verbose?: boolean);
    deployDiamond(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]>;
    getFacetsAndSelectorsToRemove(diamond: Diamond): Promise<FacetDeploymentInfo[]>;
    performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void>;
}
//# sourceMappingURL=BaseDeploymentStrategy.d.ts.map