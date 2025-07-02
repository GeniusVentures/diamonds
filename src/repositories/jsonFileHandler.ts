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
  DeployConfigSchema,
  DeployedDiamondDataSchema,
  DeployedDiamondData,
  DeployConfig
} from "../schemas/DeploymentSchema";
import { OK } from "zod";

export function readDeployFilePathDiamondNetwork(
  networkName: string,
  diamondName: string,
  deploymentId: string,
  deploymentsPath: string,
  createNew: boolean = false
): DeployedDiamondData {
  const filePath = join(deploymentsPath, diamondName, `${deploymentId}.json`);
  return readDeployFile(filePath, createNew);
}

/**
 * Reads and validates a JSON file as DeployedDiamondData
 * @param path - The path to the deployment file.
 * @param createIfMissing - If true, creates a new deployment file with default values if 
 * the file does not exist. Otherwise this will throw an error if the file does not exist.
 * @returns The parsed and validated deployment object.
 */
export function readDeployFile(path: string, createNew: boolean = true)
  : DeployedDiamondData {
  let raw: any;
  if (!pathExistsSync(path) && createNew) {
    createNewDeployFile(path);
    raw = readJsonSync(path);

    const parsed = DeployedDiamondDataSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid deployment format: ${JSON.stringify(parsed.error.format(), null, 2)}`);
    }

    return parsed.data;
  } else if (pathExistsSync(path)) {
    raw = readJsonSync(path);
    const parsed = DeployedDiamondDataSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid deployment format: ${JSON.stringify(parsed.error.format(), null, 2)}`);
    }
    return parsed.data;
  }

  // This is a mock deployment object with empty values
  return defaultDeployment();
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
 * Default deployment object with empty values
 * This is used to create a new deployment file if it does not exist or for a mock deployment.
 * @type {DeployedDiamondData}
 */
export function defaultDeployment(): DeployedDiamondData {
  return {
    DiamondAddress: "",
    DeployerAddress: "",
    DeployedFacets: {}, // Empty object for facets
    ExternalLibraries: {}, // Empty object for external libraries
    protocolVersion: 0, // Default protocol version
  };
}
/**
 * Creates a new deployment file with default empty values
 * @param path - The path to the deployment file.
 */
export function createNewDeployFile(path: string) {
  // Ensure the directory exists before writing
  ensureFileSync(path);
  // Validate the default deployment object before writing
  const validated = DeployedDiamondDataSchema.parse(defaultDeployment());
  writeJsonSync(path, validated, { spaces: 2 });
}

/**
 * Writes JSON to file
 */
export function writeDeployInfo(path: string, data: DeployedDiamondData) {
  const validated = DeployedDiamondDataSchema.parse(data);
  writeJsonSync(path, validated, { spaces: 2 });
}

/**
 * Update deployment JSON file
 */
export function updateDeployInfo(path: string, updater: (data: DeployedDiamondData) => void) {
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
    DeployedDiamondDataSchema.parse(raw);
    return true;
  } catch {
    return false;
  }
}

export function loadFacetsConfig(
  deploymentsPath: string,
  diamondName: string
): DeployConfig {
  const file = join(deploymentsPath, diamondName, `${diamondName}.config.json`);
  const valid = validateDeployConfig(file);

  const facets = readDeployConfig(file);
  return facets;
}

/**
 * Loads and validates the facets file.
 * @param filePath - The path to the facets file.
 * @returns The parsed and validated facets object.
 */
export const readDeployConfig = (filePath: string): DeployConfig => {
  try {
    const fullPath = resolvePath(filePath);

    // Read the JSON file
    const raw = readJsonSync(fullPath);

    // Validate and parse the JSON data
    return DeployConfigSchema.parse(raw);
  } catch (e) {
    console.error('Failed to load facets:', e);
    throw e;
  }
};

/**
 * Saves the Diamond Config object to a file.
 * @param filePath - The path to the facets file.
 * @param data - The facets object to save.
 */
export const saveDeployConfig = (filePath: string, data: DeployConfig): void => {
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
  update: Partial<DeployConfig["facets"][string]>
): DeployConfig => {
  const deployConfig = readDeployConfig(filePath);
  deployConfig.facets[facetKey] = {
    ...(deployConfig.facets[facetKey] || {}),
    ...update,
  };
  saveDeployConfig(filePath, deployConfig);
  return deployConfig;
};

/**
 * Deletes a specific facet from the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to delete.
 * @returns The updated facets object.
 */
export const deleteFacet = (filePath: string, facetKey: string): DeployConfig => {
  const deployConfig = readDeployConfig(filePath);
  delete deployConfig.facets[facetKey];
  saveDeployConfig(filePath, deployConfig);
  return deployConfig;
};

/**
 * Validates that the facets file exists, is valid JSON, and conforms to the schema.
 * @param filePath - The path to the facets file.
 * @returns A boolean indicating whether the file is valid.
 */
export const validateDeployConfig = (filePath: string): boolean => {
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
    DeployConfigSchema.parse(raw);

    // If all checks pass, return true
    return true;
  } catch (e) {
    console.error('Validation failed:', e);
    return false;
  }
};