import { z } from 'zod';

// Match the structure of IFacetsToDeploy['facetName']['versions'][versionNumber]
export const VersionInfoSchema = z.object({
  deployInit: z.string().optional(),
  upgradeInit: z.string().optional(),
  fromVersions: z.array(z.number()).optional(),
  callback: z.function()
    .args(z.any()) // for INetworkDeployInfo — can be refined
    .returns(z.promise(z.boolean()))
    .optional(),
  deployInclude: z.array(z.string()).optional()
});

// Match the structure of IFacetsToDeploy['facetName']
export const FacetDeploymentSchema = z.object({
  priority: z.number(),
  libraries: z.array(z.string()).optional(),
  versions: z.record(z.coerce.number(), VersionInfoSchema).optional()
});

// Infer types
export type VersionInfo = z.infer<typeof VersionInfoSchema>;
export type FacetDeployment = z.infer<typeof FacetDeploymentSchema>;
export type AllFacets = z.infer<typeof AllFacetsSchema>;

// Match the full IFacetsToDeploy type
export const AllFacetsSchema = z.record(FacetDeploymentSchema);

export const FacetVersionSchema = z.object({
  deployInit: z.string().optional(),
  upgradeInit: z.string().optional(),
  fromVersions: z.array(z.number()).optional(),
});

export const FacetInfoSchema = z.object({
  priority: z.number(),
  versions: z.record(FacetVersionSchema).optional(), // Dynamic keys for versions
});

export const FacetsDeploymentSchema = z.record(FacetInfoSchema); // Dynamic keys for facets

export type FacetVersion = z.infer<typeof FacetVersionSchema>;
export type FacetInfo = z.infer<typeof FacetInfoSchema>;
export type FacetsDeployment = z.infer<typeof FacetsDeploymentSchema>;
