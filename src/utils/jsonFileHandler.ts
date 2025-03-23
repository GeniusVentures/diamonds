import fs from 'fs-extra';
import path from 'path';
import { AllFacetsSchema, AllFacets } from '../schemas/FacetDeploymentSchema';
import { readJsonSync, writeJsonSync, pathExistsSync, removeSync } from "fs-extra";
import { NetworkDeployInfoSchema, INetworkDeployInfo } from "../schemas/DeploymentSchema";

/**
 * Reads and validates a JSON file as INetworkDeployInfo
 */
export function readDeployInfo(path: string): INetworkDeployInfo {
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
      const raw = require("fs-extra").readJsonSync(path);
      NetworkDeployInfoSchema.parse(raw);
      return true;
    } catch {
      return false;
    }
  }
  

const resolvePath = (relativePath: string): string => {
  return path.resolve(process.cwd(), relativePath); // Relative to project root
};

export const loadFacets = async (filePath: string): Promise<AllFacets> => {
  const fullPath = resolvePath(filePath);
  const raw = await fs.readJson(fullPath);
  const parsed = AllFacetsSchema.parse(raw); // Throws if invalid
  return parsed;
};

export const saveFacets = async (filePath: string, data: AllFacets): Promise<void> => {
  const fullPath = resolvePath(filePath);
  await fs.ensureFile(fullPath);
  await fs.writeJson(fullPath, data, { spaces: 2 });
};

export const updateFacet = async (
  filePath: string,
  facetKey: string,
  update: Partial<AllFacets[string]>
): Promise<AllFacets> => {
  const facets = await loadFacets(filePath);
  facets[facetKey] = {
    ...(facets[facetKey] || {}),
    ...update
  };
  await saveFacets(filePath, facets);
  return facets;
};

export const deleteFacet = async (filePath: string, facetKey: string): Promise<AllFacets> => {
  const facets = await loadFacets(filePath);
  delete facets[facetKey];
  await saveFacets(filePath, facets);
  return facets;
};

export const validateFacets = async (filePath: string): Promise<boolean> => {
  try {
    await loadFacets(filePath);
    return true;
  } catch (e) {
    console.error('Validation failed:', e);
    return false;
  }
};
