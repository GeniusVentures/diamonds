import fs from "fs";
import { join, resolve } from "path";
import { INetworkDeployInfo, IFacetsToDeploy } from "./types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { createPublicClient, http, getContract } from "viem";
// import { GetContractReturnType } from "viem";

export function loadExistingDeployment(networkName: string, diamondName: string, deploymentFilesPath: string) : INetworkDeployInfo  {
    let initialDeployInfo: INetworkDeployInfo;
    const deploymentPath = join(
        deploymentFilesPath,
        networkName + ".json"
    );
    if (fs.existsSync(deploymentPath)) {
        initialDeployInfo = JSON.parse(fs.readFileSync(deploymentPath).toString());
    } else {
      // defaults to the DiamondCutFacet and DiamondLoupeFacet as a minimum for a Diamond 
      initialDeployInfo = {
        DiamondAddress: "",
        DeployerAddress: "",
        FacetDeployedInfo: {
          "DiamondCutFacet": {
            address: "",
            tx_hash: "",
          },
          "DiamondLoupeFacet": {
            address: "",
            tx_hash: "",
          }
        }
      };
    }
    return initialDeployInfo;
}

export function loadFacetsToDeploy(diamondName: string, facetsDeploymentPath: string) : IFacetsToDeploy {
    let facetsToDeploy: IFacetsToDeploy;
    const facetsDeploymentConfig = join(
        facetsDeploymentPath,
        diamondName,
        "facets.json"
    );
    if (fs.existsSync(facetsDeploymentConfig)) {
      return facetsToDeploy = JSON.parse(fs.readFileSync(facetsDeploymentPath).toString());
    }
    // defaults to only include the DiamondCutFacet IFacetsToDeploy object
    facetsToDeploy = {
      "DiamondCutFacet": {
        priority: 0,
        versions: {
          0.0: {}
        },
      },
      "DiamondLoupeFacet": {
        priority: 1,
        versions: {
          0.0: {}
        },
      }
    }; 
            
    return facetsToDeploy;
}

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