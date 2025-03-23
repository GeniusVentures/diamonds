import fs from "fs";
import path from "path";
import { INetworkDeployInfo, IFacetsToDeploy } from "./types";
import { IDeployments } from "./types";
import {  HardhatUserConfig } from "hardhat/types";

// supplies the diamonds config with 
class Diamonds {
    // return all the networks by getting all available deployments from the deployments.json file
    // and iterating over them to get the deployment for each network
    static async getDeployments(
        diamondName: string, 
        deploymentsPath: string
    ): Promise<IDeployments> {
        const diamondNames = fs.readdirSync(deploymentsPath);
        const deployments: IDeployments = {};
        for (const diamondName of diamondNames) {
            const networkNames = fs.readdirSync(path.join(deploymentsPath, diamondName));
            for (const networkName of networkNames) {
                deployments[networkName] = this.getDeployment(networkName, diamondName, deploymentsPath);
            }
        }
        return deployments;
    }
    
    // return the deployment for a particular network based on the diamondName, networkname and the hardhat user config
    public static getDeployment(
        networkName: string, 
        diamondName: string, 
        deploymentsPath: string
    ) : INetworkDeployInfo  {
        let initialDeployInfo: INetworkDeployInfo;
        // get the deployment path from the config or default to diamonds/deployments
        const deploymentFilePath = path.join(
            deploymentsPath,
            diamondName,
            // TODO - parse the deployments into individual files
            // networkName + ".json"
            "deployments.json"
        );
        if (fs.existsSync(deploymentFilePath)) {
            initialDeployInfo = JSON.parse(fs.readFileSync(deploymentFilePath).toString());
        } else {
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
    
    public getFacetsToDeploy(diamondName: string, facetsDeploymentPath: string) : IFacetsToDeploy | null {
        let facetsToDeploy: IFacetsToDeploy;
        const facetsDeploymentConfig = path.join(
            facetsDeploymentPath,
            diamondName,
            "facets.json"
        );
        if (fs.existsSync(facetsDeploymentConfig)) {
          return facetsToDeploy = JSON.parse(fs.readFileSync(facetsDeploymentPath).toString());
        } 
        return null;
    }
}

export default Diamonds;