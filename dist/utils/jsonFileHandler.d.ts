/**
 * CRUD and validation helpers for JSON files
 *
 * These should all be synchronous and handle issues like empty files or non-existent files
 * gracefully in a way that allows for control by the caller, e.g. gives the caller the
 * ability to create an empty file on failure.
 */
import { INetworkDeployInfo, DeployConfig } from "../schemas/DeploymentSchema";
export declare function readDeployFilePathDiamondNetwork(networkName: string, diamondName: string, deploymentId: string, deploymentsPath: string, createNew?: boolean): INetworkDeployInfo;
/**
 * Reads and validates a JSON file as INetworkDeployInfo
 * @param path - The path to the deployment file.
 * @param createIfMissing - If true, creates a new deployment file with default values if
 * the file does not exist. Otherwise this will throw an error if the file does not exist.
 * @returns The parsed and validated deployment object.
 */
export declare function readDeployFile(path: string, createNew?: boolean): INetworkDeployInfo;
/**
 * Creates a new deployment file with default empty values
 * @param path - The path to the deployment file.
 */
export declare function createNewDeployFile(path: string): void;
/**
 * Writes JSON to file
 */
export declare function writeDeployInfo(path: string, data: INetworkDeployInfo): void;
/**
 * Update deployment JSON file
 */
export declare function updateDeployInfo(path: string, updater: (data: INetworkDeployInfo) => void): void;
/**
 * Deletes the deployment file
 */
export declare function deleteDeployInfo(path: string): void;
/**
 * Validates the Deployment File without loading it.
 * @param path
 * @returns
 */
export declare function validateDeployFile(path: string): boolean;
export declare function loadFacetsConfig(deploymentsPath: string, diamondName: string): DeployConfig;
/**
 * Loads and validates the facets file.
 * @param filePath - The path to the facets file.
 * @returns The parsed and validated facets object.
 */
export declare const readDeployConfig: (filePath: string) => DeployConfig;
/**
 * Saves the Diamond Config object to a file.
 * @param filePath - The path to the facets file.
 * @param data - The facets object to save.
 */
export declare const saveDeployConfig: (filePath: string, data: DeployConfig) => void;
/**
 * Updates a specific facet in the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to update.
 * @param update - The partial update to apply to the facet.
 * @returns The updated facets object.
 */
export declare const updateFacetConfig: (filePath: string, facetKey: string, update: Partial<DeployConfig["facets"][string]>) => DeployConfig;
/**
 * Deletes a specific facet from the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to delete.
 * @returns The updated facets object.
 */
export declare const deleteFacet: (filePath: string, facetKey: string) => DeployConfig;
/**
 * Validates that the facets file exists, is valid JSON, and conforms to the schema.
 * @param filePath - The path to the facets file.
 * @returns A boolean indicating whether the file is valid.
 */
export declare const validateDeployConfig: (filePath: string) => boolean;
//# sourceMappingURL=jsonFileHandler.d.ts.map