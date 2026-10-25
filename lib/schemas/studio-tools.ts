import { z } from "zod";

export const studioToolsSchema = z.object({
  blockchain: z.string().trim().min(1).optional(),
  payments: z.array(z.string().trim().min(1)).max(20).optional(),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(50).optional(),
});

export type StudioTools = z.infer<typeof studioToolsSchema>;
