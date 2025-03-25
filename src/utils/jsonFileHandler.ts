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
import path from 'path';
import { FacetsDeployment, FacetsDeploymentSchema, FacetInfo } from '../schemas/FacetDeploymentSchema';
import { NetworkDeployInfoSchema, INetworkDeployInfo } from "../schemas/DeploymentSchema";

/**
 * Resolves the absolute path of a file relative to the project root.
 * @param relativePath - The relative path to resolve.
 * @returns The absolute path.
 */
const resolvePath = (relativePath: string): string => {
  return path.resolve(process.cwd(), relativePath);
};

/**
 * Reads and validates a JSON file as INetworkDeployInfo
 */
export function readDeployInfo(path: string): INetworkDeployInfo {
  
  // TODO should this be false or an error given that the caller should have validated themselves and then if they wanted this they should have created the file. Alternatively we could use ensureFileSync() to automatically create the file.
  // if (!validateDeploymentFileOnly(path)) {
  //   return false;
  // }
  if (!pathExistsSync(path)) {
    throw new Error(`Deployment file not found: ${path}`);
  }

  const raw = readJsonSync(path);
  const parsed = NetworkDeployInfoSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid deployment format: ${JSON.stringify(parsed.error.format(), null, 2)}`);
  }

  return parsed.data;
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
  const data = readDeployInfo(path);
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
export function validateDeploymentFileOnly(path: string): boolean {
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
export const loadFacets = (filePath: string): FacetsDeployment => {
  try {
    const fullPath = resolvePath(filePath);

    // Read the JSON file
    const raw = readJsonSync(fullPath);

    // Validate and parse the JSON data
    return FacetsDeploymentSchema.parse(raw);
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
export const saveFacets = (filePath: string, data: FacetsDeployment): void => {
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
export const updateFacet = (
  filePath: string,
  facetKey: string,
  update: Partial<FacetInfo>
): FacetsDeployment => {
  const facets = loadFacets(filePath);
  facets[facetKey] = {
    ...(facets[facetKey] || {}),
    ...update,
  };
  saveFacets(filePath, facets);
  return facets;
};

/**
 * Deletes a specific facet from the facets file.
 * @param filePath - The path to the facets file.
 * @param facetKey - The key of the facet to delete.
 * @returns The updated facets object.
 */
export const deleteFacet =  (filePath: string, facetKey: string): FacetsDeployment => {
  const facets =  loadFacets(filePath);
  delete facets[facetKey];
   saveFacets(filePath, facets);
  return facets;
};

/**
 * Validates that the facets file exists, is valid JSON, and conforms to the schema.
 * @param filePath - The path to the facets file.
 * @returns A boolean indicating whether the file is valid.
 */
export const validateFacets = (filePath: string): boolean => {
  try {
    const fullPath = resolvePath(filePath);

    // Check if the file exists
    if (!existsSync(fullPath)) {
      console.error(`Validation failed: File does not exist at path "${filePath}"`);
      return false;
    }

    // Read the file and parse it as JSON
    const raw =  readJsonSync(fullPath);

    // Validate the JSON against the schema
    FacetsDeploymentSchema.parse(raw);

    // If all checks pass, return true
    return true;
  } catch (e) {
    console.error('Validation failed:', e);
    return false;
  }
};