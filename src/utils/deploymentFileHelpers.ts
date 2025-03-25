import fs from "fs";
import { join, resolve } from "path";
import { INetworkDeployInfo, IFacetsToDeploy } from "../types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadFacets, saveFacets, updateFacet, deleteFacet, validateFacets } from './jsonFileHandler';
import { readDeployInfo, writeDeployInfo } from "./jsonFileHandler";
import { pathExistsSync } from "fs-extra";

export function loadExistingDeployment(
  networkName: string,
  diamondName: string,
  deploymentFilesPath: string
): INetworkDeployInfo {
  const deploymentPath = join(deploymentFilesPath, diamondName,`${networkName}.json`);

  if (pathExistsSync(deploymentPath)) {
    return readDeployInfo(deploymentPath);
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

export function loadFacetsToDeploy(
  deploymentsPath: string,
  diamondName: string,
  facetsDeploymentPath?: string
): IFacetsToDeploy {
  const file = join(deploymentsPath, diamondName, 'facets.json');
  const valid = validateFacets(file);

  // TODO: This is defaulting to the empty facets if the file is invalid. This decision may not be correct in all cases since it assumes this is a new deployment. If the file was made invalid by a user error, this is not the correct behavior.
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

// TODO This helper is a first draft attempt to read the compiled artifact and uses viem to create a contract interface instead of typeschain. This is a work in progress and may not be the best approach.
// /**
//  * This helper reads the compiled artifact and uses viem to create a contract instance.
//  *
//  * @param diamondName - the name of the diamond contract (matching your artifact name)
//  * @param hre - the Hardhat runtime environment
//  * @param contractAddress - deployed contract address
//  * @returns a viem Contract instance typed with `any` (or a custom type if you create one)
//  */
// export async function getDiamondContractViem(
//   diamondName: string,
//   hre: HardhatRuntimeEnvironment,
//   contractAddress: `0x${string}`
// ): Promise<GetContractReturnType<any, any>> {
//   // Locate the artifacts directory used by Hardhat (adjust the path as needed)
//   const artifactsDir = resolve(hre.config.paths.root, "artifacts/contracts");
  
//   // Construct the path to the specific contract's artifact JSON.
//   // For example, if your contract is defined in "ProxyDiamond.sol"
//   // and the artifact is generated at "artifacts/contracts/ProxyDiamond.sol/ProxyDiamond.json"
//   const artifactPath = join(artifactsDir, `${diamondName}.sol`, `${diamondName}.json`);
  
//   // Read and parse the artifact
//   const artifactContent = fs.readFileSync(artifactPath, "utf8");
//   const artifact = JSON.parse(artifactContent);

//   // Create a public client using viem.
//   // You can adjust the client settings based on your network configuration.
//   const client = createPublicClient({
//     // TODO: this probably fails with current version of multichain 
//     transport: http((hre.network.provider as any).url)
//   });

//   // Create the contract instance. You can supply a proper ABI type if available.
//   const contract = getContract({
//     address: contractAddress,
//     abi: artifact.abi,
//     client: client
//   });

//   return contract;
// }