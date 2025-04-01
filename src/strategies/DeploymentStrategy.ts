import { FacetDeploymentInfo } from "../types";
import { Diamond } from "../internal/Diamond";
import { FacetDeployedInfoRecord, FacetsConfig } from "../schemas";

export interface DeploymentStrategy {
  deployDiamond(diamond: Diamond): Promise<void>;
  deployFacets(diamond: Diamond): Promise<FacetDeploymentInfo[]>;
  performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void>;
  getFacetsAndSelectorsToRemove(
    existingFacets: FacetDeployedInfoRecord,
    newConfig: FacetsConfig
  ): Promise<FacetDeploymentInfo[]>;
}
