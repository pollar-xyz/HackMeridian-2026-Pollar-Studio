import { z } from "zod";

export const studioAppSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  prompt: z.string().min(1).max(10_000),
  createdAt: z.number(),
});

export type StudioApp = z.infer<typeof studioAppSchema>;
