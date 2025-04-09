import { DeploymentStrategy } from "./DeploymentStrategy";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo } from "../types";
import { FacetDeployedInfoRecord, FacetsConfig } from "../schemas";
export declare class BaseRPCDeploymentStrategy implements DeploymentStrategy {
    deployDiamond(diamond: Diamond): Promise<void>;
    deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]>;
    getFacetsAndSelectorsToRemove(existingFacets: FacetDeployedInfoRecord, newConfig: FacetsConfig): Promise<FacetDeploymentInfo[]>;
    performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void>;
}
//# sourceMappingURL=BaseRPCDeploymentStrategy%20copy.d.ts.map