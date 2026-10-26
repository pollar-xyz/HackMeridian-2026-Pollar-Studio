import { z } from "zod";

// GET /api/v1/projects/{id}/contracts: the app's Soroban contracts, as soroban-factory deployed them.
export const projectContractSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["pending", "deployed"]),
  contractId: z.string().nullable(),
  wasmHash: z.string().nullable(),
  deployedAt: z.string().nullable(),
  jobId: z.string().nullable(),
  explorerUrl: z.string().url().nullable(),
  files: z.array(z.object({ path: z.string(), content: z.string() })),
});

export const projectContractsSchema = z.object({
  network: z.string(),
  address: z.string().nullable(),
  contracts: z.array(projectContractSchema),
});

export type ProjectContracts = z.infer<typeof projectContractsSchema>;
export type ProjectContract = z.infer<typeof projectContractSchema>;
