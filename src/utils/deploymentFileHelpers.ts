import { join } from "path";
import { INetworkDeployInfo, FacetsConfig } from "../schemas";
import {
  readFacetsConfig,
  validateFacetsConfig,
  readDeployFile,
  writeDeployInfo
} from "./jsonFileHandler";
import { pathExistsSync } from "fs-extra";

export function loadDeployInfo(
  networkName: string,
  diamondName: string,
  deploymentFilesPath: string
): INetworkDeployInfo {
  const deploymentPath = join(deploymentFilesPath, diamondName, `${networkName}.json`);

  if (pathExistsSync(deploymentPath)) {
    return readDeployFile(deploymentPath);
  }

  const defaultDeployment: INetworkDeployInfo = {
    DiamondAddress: "",
    DeployerAddress: "",
    FacetDeployedInfo: {
      DiamondCutFacet: {
        address: "",
        tx_hash: "",
      },
      DiamondLoupeFacet: {
        address: "",
        tx_hash: "",
      },
    },
  };

  writeDeployInfo(deploymentPath, defaultDeployment);
  return defaultDeployment;
}

export function loadFacetsConfigFile(
  deploymentsPath: string,
  diamondName: string,
  facetsDeploymentPath?: string
): FacetsConfig {
  const file = join(deploymentsPath, diamondName, 'facets.json');
  const valid = validateFacets(file);

  // TODO: This is defaulting empty.  This should be in the Diamond or Deployer.
  if (!valid) {
    return {
      DiamondCutFacet: {
        priority: 10,
        versions: {
          0.0: {},
        },
      },
      DiamondLoupeFacet: {
        priority: 20,
        versions: {
          0.0: {},
        },
      },
    };
  }

  // TODO This does not load the callbacks.  This needs to be done separately.
  const facets = loadFacets(file);
  return facets;
}