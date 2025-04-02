"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDeployInfo = loadDeployInfo;
const path_1 = require("path");
const jsonFileHandler_1 = require("./jsonFileHandler");
const fs_extra_1 = require("fs-extra");
function loadDeployInfo(networkName, diamondName, deploymentFilesPath) {
    const deploymentPath = (0, path_1.join)(deploymentFilesPath, diamondName, `${networkName}.json`);
    if ((0, fs_extra_1.pathExistsSync)(deploymentPath)) {
        return (0, jsonFileHandler_1.readDeployFile)(deploymentPath);
    }
    const defaultDeployment = {
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
    (0, jsonFileHandler_1.writeDeployInfo)(deploymentPath, defaultDeployment);
    return defaultDeployment;
}
// export function loadFacetsConfigFile(
//   deploymentsPath: string,
//   diamondName: string,
//   facetsDeploymentPath?: string
// ): FacetsConfig {
//   const file = join(deploymentsPath, diamondName, 'facets.json');
//   const valid = validateFacetsConfig(file);
//   // TODO: This is defaulting empty.  This should be in the Diamond or Deployer.
//   if (!valid) {
//     return {
//       DiamondCutFacet: {
//         priority: 10,
//         versions: {
//           0.0: {},
//         },
//       },
//       DiamondLoupeFacet: {
//         priority: 20,
//         versions: {
//           0.0: {},
//         },
//       },
//     };
//   }
//   // TODO This does not load the callbacks.  This needs to be done separately.
//   const facets = loadFacetsConfig(file);
//   return facets;
// }
//# sourceMappingURL=deploymentFileHelpers.js.map