import { z } from "zod";

const amount = z.string().regex(/^-?\d+(\.\d+)?$/);

/** A project's Pollar app credits, as the Studio API reads them from hub-api (100 credits = 1 USD). */
export const pollarCreditsSchema = z.object({
  credits: z.object({
    applicationId: z.string(),
    network: z.string(),
    billingModel: z.string(),
    available: amount,
    paid: amount,
    promo: amount,
    overdraft: amount,
    spent: z.object({ from: z.string(), to: z.string(), total: amount, events: z.array(z.object({ event: z.string(), count: z.number(), credits: amount })) }),
    movements: z.array(z.object({ id: z.string(), kind: z.string(), credits: amount, event: z.string().nullable(), reason: z.string().nullable(), at: z.string() })),
  }).nullable(),
});
export type PollarCredits = z.infer<typeof pollarCreditsSchema>["credits"];
