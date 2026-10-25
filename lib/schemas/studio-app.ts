import { z } from "zod";

export const workspaceAppIdSchema = z.union([z.uuid(), z.string().regex(/^prj_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)]);

export const studioAppSchema = z.object({
  id: workspaceAppIdSchema,
  name: z.string().min(1).max(80),
  prompt: z.string().min(1).max(10_000),
  createdAt: z.number(),
  origin: z.string().url().regex(/^https?:\/\//).optional(),
});

export type StudioApp = z.infer<typeof studioAppSchema>;
