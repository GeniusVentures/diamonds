import { INetworkDeployInfo, FacetsConfig } from "../schemas";
import { Diamond } from "../internal/Diamond";
import { FacetDeploymentInfo } from "../types";

export interface DeploymentStrategy {
  deployDiamond(diamond: Diamond): Promise<void>;
  deployFacets(diamond: Diamond): Promise<void>;
  performDiamondCut(diamond: Diamond, facetCuts: FacetDeploymentInfo[]): Promise<void>;
}
