import { z } from "zod";
import { marketplaceListingSchema } from "@/lib/schemas/marketplace";
import { projectToolsSchema } from "@/lib/schemas/studio-built-with";

export const projectIdSchema = z.string().regex(/^prj_[0-9a-f-]{36}$/i);
export const studioProjectSchema = z.object({
  projectId: projectIdSchema,
  revision: z.number().int().positive(),
  marketplace: marketplaceListingSchema.optional(),
  identity: z.object({ displayName: z.string().min(1), description: z.string(), slug: z.string() }),
  createdAt: z.string(),
  tools: projectToolsSchema.optional(),
  updatedAt: z.string().optional(),
  url: z.string().url().nullable().optional(),
  /** Optional packages the app uses; "database" means it stores its users' data. */
  capabilities: z.array(z.string()).optional(),
});
export const queuedJobSchema = z.object({ jobId: z.string().regex(/^job_[\w-]+$/), status: z.enum(["queued", "running", "succeeded", "failed"]) });
export const studioJobSchema = queuedJobSchema.extend({
  url: z.string().url().nullable().optional(),
  urlStatus: z.enum(["building", "live", "failed", "expired"]).optional(),
  projectId: projectIdSchema,
  result: z.object({
    summary: z.string().optional(),
    error: z.string().optional(),
    deployment: z.object({
      phase: z.enum(["queued", "deploying", "succeeded", "failed"]),
      origin: z.string().url().regex(/^https?:\/\//).optional(),
    }).optional(),
  }).optional(),
});
export type StudioProject = z.infer<typeof studioProjectSchema>;
export type StudioJob = z.infer<typeof studioJobSchema>;

export const chatHistorySchema = z.object({ messages: z.array(z.object({
  jobId: z.string(), prompt: z.string(), status: z.enum(["queued", "running", "succeeded", "failed"]),
  summary: z.string().nullable().optional(), error: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(), urlStatus: z.enum(["building", "live", "failed", "expired"]),
  errorCode: z.string().nullable().optional(), destructive: z.array(z.string()).nullable().optional(),
  answered: z.boolean().optional(),
  createdAt: z.string(),
})) });
export const projectListSchema = z.object({ projects: z.array(studioProjectSchema) });
const tokensSchema = z.object({ inputTokens: z.number(), outputTokens: z.number(), reasoningTokens: z.number().optional() });
export const usageReportSchema = z.object({ projects: z.array(z.object({
  projectId: z.string(), title: z.string(), usage: z.object({ byModel: z.record(z.string(), tokensSchema) }),
})) });
