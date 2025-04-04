/**
 * CRUD and validation helpers for JSON files
 * 
 * These should all be synchronous and handle issues like empty files or non-existent files
 * gracefully in a way that allows for control by the caller, e.g. gives the caller the
 * ability to create an empty file on failure.
 */

import {
  readJsonSync,
  writeJsonSync,
  pathExistsSync,
  removeSync,
  ensureFileSync,
  existsSync
} from "fs-extra";
import { join, resolve } from "path";
import {
  FacetsConfigSchema,
  NetworkDeployInfoSchema,
  INetworkDeployInfo,
  FacetsDeployment,
} from "../schemas/DeploymentSchema";
import { OK } from "zod";

export function readDeployFilePathDiamondNetwork(
  networkName: string,
  diamondName: string,
  deploymentsPath: string,
  createNew: boolean = false
): INetworkDeployInfo {
  const filePath = join(deploymentsPath, diamondName, `${networkName}.json`);
  return readDeployFile(filePath, createNew);
}

/**
 * Reads and validates a JSON file as INetworkDeployInfo
 * @param path - The path to the deployment file.
 * @param createIfMissing - If true, creates a new deployment file with default values if 
 * the file does not exist. Otherwise this will throw an error if the file does not exist.
 * @returns The parsed and validated deployment object.
 */
export function readDeployFile(path: string, createNew: boolean = false)
  : INetworkDeployInfo {
  // The caller should have already checked for the file's existence,
  if (!pathExistsSync(path) && !createNew) {
    throw new Error(`Deployment file not found: ${path}`);
  } else if (!pathExistsSync(path) && createNew) {
    createNewDeployFile(path);
  }

  // TODO this may be redundant given the failure of the safeParse below into a type.
  // if (!validateDeploymentFileOnly(path)) {
  //   throw new Error(`Invalid deployment file: ${path}`);
  // }

  const raw = readJsonSync(path);
  const parsed = NetworkDeployInfoSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid deployment format: ${JSON.stringify(parsed.error.format(), null, 2)}`);
  }

  return parsed.data;
}

/**
 * Resolves the absolute path of a file relative to the project root.
 * @param relativePath - The relative path to resolve.
 * @returns The absolute path.
 */
const resolvePath = (relativePath: string): string => {
  return resolve(process.cwd(), relativePath);
};

/**
 * Creates a new deployment file with default empty values
 * @param path - The path to the deployment file.
 */
export function createNewDeployFile(path: string) {
  const defaultDeployment: INetworkDeployInfo = {
    DiamondAddress: "",
    DeployerAddress: "",
    FacetDeployedInfo: {}, // Empty object for facets
    ExternalLibraries: {}, // Empty object for external libraries
    protocolVersion: 0, // Default protocol version
  };

  // Validate the default deployment object before writing
  const validated = NetworkDeployInfoSchema.parse(defaultDeployment);
  writeJsonSync(path, validated, { spaces: 2 });
}

/**
 * Writes JSON to file
 */
export function writeDeployInfo(path: string, data: INetworkDeployInfo) {
  const validated = NetworkDeployInfoSchema.parse(data);
  writeJsonSync(path, validated, { spaces: 2 });
}

/**
 * Update deployment JSON file
 */
export function updateDeployInfo(path: string, updater: (data: INetworkDeployInfo) => void) {
  const data = readDeployFile(path);
  updater(data);
  writeDeployInfo(path, data);
}

/**
 * Deletes the deployment file
 */
export function deleteDeployInfo(path: string) {
  if (pathExistsSync(path)) {
    removeSync(path);
  }
}

/**
 * Validates the Deployment File without loading it.
 * @param path 
 * @returns 
 */
export function validateDeployFile(path: string): boolean {
  try {
    if (!pathExistsSync(path)) {
      console.log(`Deployment file not found: ${path}`);
      return false;
    }
    const raw = readJsonSync(path);
    NetworkDeployInfoSchema.parse(raw);
    return true;
  } catch {
    return false;
  }
}


export function loadFacetsConfig(
  deploymentsPath: string,
  diamondName: string,
  facetsDeploymentPath?: string
): FacetsDeployment {
  const file = join(deploymentsPath, diamondName, 'facets.json');
  const valid = validateFacetsConfig(file);

  // TODO: This is defaulting empty.  This should be a separate function to createNew().
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
  const facets = readFacetsConfig(file);
  return facets;
}

// TODO We choose not to make this  for now, however this could all be loaded earlier as 
// part of a configuration. This would need to happen before trying to get the first
// instance of the deployer (at start?), when we are not locking the deployment objects 
// during deployment to prevent duplication of the singleton before it is ready to return.
// This is would be a good use of hardhat-diamonds.
/**
 * Loads and validates the facets file.
 * @param filePath - The path to the facets file.
 * @returns The parsed and validated facets object.
 */
export const readFacetsConfig = (filePath: string): FacetsDeployment => {
  try {
    const fullPath = resolvePath(filePath);

    // Read the JSON file
    const raw = readJsonSync(fullPath);

    // Validate and parse the JSON data
    return FacetsConfigSchema.parse(raw);
  } catch (e) {
    console.error('Failed to load facets:', e);
    throw e;
  }
};

/**
 * Saves the facets object to a file.
 * @param filePath - The path to the facets file.
 * @param data - The facets object to save.
 */
export const saveFacetsConfig = (filePath: string, data: FacetsDeployment): void => {
  const fullPath = resolvePath(filePath);
  ensureFileSync(fullPath);
  writeJsonSync(fullPath, data, { spaces: 2 });
};

/**
 * Updates a specific facet in the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to update.
 * @param update - The partial update to apply to the facet.
 * @returns The updated facets object.
 */
export const updateFacetConfig = (
  filePath: string,
  facetKey: string,
  update: Partial<FacetsDeployment>
): FacetsDeployment => {
  const facets = readFacetsConfig(filePath);
  facets[facetKey] = {
    ...(facets[facetKey] || {}),
    ...update,
  };
  saveFacetsConfig(filePath, facets);
  return facets;
};

/**
 * Deletes a specific facet from the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to delete.
 * @returns The updated facets object.
 */
export const deleteFacet = (filePath: string, facetKey: string): FacetsDeployment => {
  const facets = readFacetsConfig(filePath);
  delete facets[facetKey];
  saveFacetsConfig(filePath, facets);
  return facets;
};

/**
 * Validates that the facets file exists, is valid JSON, and conforms to the schema.
 * @param filePath - The path to the facets file.
 * @returns A boolean indicating whether the file is valid.
 */
export const validateFacetsConfig = (filePath: string): boolean => {
  try {
    const fullPath = resolvePath(filePath);

    // Check if the file exists
    if (!existsSync(fullPath)) {
      console.error(`Validation failed: File does not exist at path "${filePath}"`);
      return false;
    }

    // Read the file and parse it as JSON
    const raw = readJsonSync(fullPath);

    // Validate the JSON against the schema
    FacetsConfigSchema.parse(raw);

    // If all checks pass, return true
    return true;
  } catch (e) {
    console.error('Validation failed:', e);
    return false;
  }
};