import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(10_000),
});

export const chatRequestSchema = z.object({
  appId: z.string().min(1).max(100).optional(),
  messages: z.array(chatMessageSchema).min(1).max(50).refine((messages) => messages.at(-1)?.role === "user", "The last message must be from the user"),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
