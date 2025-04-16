import { z } from "zod";

// Schema for a single facet's deployment information
export const FacetDeployedInfoSchema = z.object({
  address: z.string().optional(), // Address of the deployed facet
  tx_hash: z.string().optional(), // Transaction hash of the deployment
  version: z.number().optional(), // Version of the facet
  funcSelectors: z.array(z.string()).optional(), // Function selectors for the facet
  verified: z.boolean().optional(), // Whether the facet is verified
});

// Schema for all deployed facets
export const FacetDeployedInfoRecordSchema = z.record(FacetDeployedInfoSchema);

// Schema for external libraries
export const ExternalLibrariesSchema = z.record(z.string());

// Schema for the network deployment information
export const NetworkDeployInfoSchema = z.object({
  DiamondAddress: z.string().optional(), // Address of the deployed diamond
  DeployerAddress: z.string(), // Address of the deployer
  FacetDeployedInfo: FacetDeployedInfoRecordSchema.optional(), // Information about deployed facets
  ExternalLibraries: ExternalLibrariesSchema.optional(), // External libraries used in the deployment
  protocolVersion: z.number().optional(), // Protocol version
});

/**
 * Schema for the version information of a facet configuration to be deployed
 */
export const FacetVersionConfigSchema = z.object({
  deployInit: z.string().optional(),
  upgradeInit: z.string().optional(),
  fromVersions: z.array(z.number()).optional(),
  callbacks: z.array(z.string()).optional(),
  deployInclude: z.array(z.string()).optional()
});

/**
 * Schema for the deployment information of a single facet
*/
export const FacetConfigSchema = z.object({
  // Infer TypeScript types from schemas
  priority: z.number(),
  libraries: z.array(z.string()).optional(),
  versions: z.record(z.coerce.number(), FacetVersionConfigSchema).optional()
});

/**
 * Schema for the deployment configuration information of ALL facets to be deployed
 */
export const FacetsConfigSchema = z.record(FacetConfigSchema);

export const DeployConfigSchema = z.object({
  protocolVersion: z.number(),
  protocolInitFacet: z.string().optional(),
  protocolCallback: z.string().optional(),
  facets: z.record(FacetConfigSchema)
});

// Inferred types from Zod schemas
export type FacetVersionConfig = z.infer<typeof FacetVersionConfigSchema>;
export type FacetConfig = z.infer<typeof FacetConfigSchema>;
export type FacetsConfig = z.infer<typeof FacetsConfigSchema>;
export type DeployConfig = z.infer<typeof DeployConfigSchema>;

// export type FacetsDeployment = z.infer<typeof FacetsConfigSchema>;
export type FacetDeployedInfo = z.infer<typeof FacetDeployedInfoSchema>;
export type FacetDeployedInfoRecord = z.infer<typeof FacetDeployedInfoRecordSchema>;
export type INetworkDeployInfo = z.infer<typeof NetworkDeployInfoSchema>;
