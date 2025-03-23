import fs from 'fs-extra';
import path from 'path';
import { AllFacetsSchema, AllFacets } from '../schemas/FacetDeploymentSchema';

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
