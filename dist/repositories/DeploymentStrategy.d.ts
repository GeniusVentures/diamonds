import { FacetDeploymentInfo } from "../types";
import { Diamond } from "../internal/Diamond";
export interface DeploymentStrategy {
    deployDiamond(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]>;
    performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void>;
    getFacetsAndSelectorsToRemove(diamond: Diamond): Promise<FacetDeploymentInfo[]>;
}
//# sourceMappingURL=DeploymentStrategy.d.ts.map