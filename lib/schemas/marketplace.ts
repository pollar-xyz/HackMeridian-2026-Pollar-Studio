import { z } from "zod";

export const listingArtSchema = z.object({
  color: z.string().regex(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i),
  pattern: z.enum(["none", "dots", "grid", "waves"]),
  image: z.string().max(350_000).regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/).optional(),
});
export const marketplaceInputSchema = z.object({
  title: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(6).max(80),
  url: z.string().trim().max(2048).url().refine(value => { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; }),
  logo: listingArtSchema.optional(),
  banner: listingArtSchema.optional(),
});
export const marketplaceListingSchema = marketplaceInputSchema.extend({
  logo: listingArtSchema, banner: listingArtSchema, makerName: z.string(), publishedAt: z.string(), updatedAt: z.string(), published: z.boolean(),
});
export const publicListingSchema = marketplaceListingSchema.omit({ published: true }).extend({ projectId: z.string() });
export const marketplaceListSchema = z.object({ listings: z.array(publicListingSchema) });
export type MarketplaceInput = z.infer<typeof marketplaceInputSchema>;
export type MarketplaceListing = z.infer<typeof marketplaceListingSchema>;
export type PublicListing = z.infer<typeof publicListingSchema>;
