import { z } from "zod";

export const FacetInfoSchema = z.object({
  address: z.string(),
  tx_hash: z.string(),
  version: z.number().optional(),
  funcSelectors: z.array(z.string()).optional(),
});

export const NetworkDeployInfoSchema = z.object({
  DiamondAddress: z.string().optional(),
  DeployerAddress: z.string(),
  FacetDeployedInfo: z.record(FacetInfoSchema),
  ExternalLibraries: z.record(z.string()).optional(),
  protocolVersion: z.number().optional(),
});

export type INetworkDeployInfo = z.infer<typeof NetworkDeployInfoSchema>;
