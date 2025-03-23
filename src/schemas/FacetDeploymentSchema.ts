import { z } from 'zod';

export const VersionInfoSchema = z.object({
  deployInit: z.string().optional(),
  upgradeInit: z.string().optional(),
  fromVersions: z.array(z.union([z.string(), z.number()])).optional()
});

export const FacetDeploymentSchema = z.object({
  priority: z.number(),
  versions: z.record(VersionInfoSchema).optional()
});

export const AllFacetsSchema = z.record(FacetDeploymentSchema);

export type VersionInfo = z.infer<typeof VersionInfoSchema>;
export type FacetDeployment = z.infer<typeof FacetDeploymentSchema>;
export type AllFacets = z.infer<typeof AllFacetsSchema>;
