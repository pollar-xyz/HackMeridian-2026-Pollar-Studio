import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getChatModel() {
  const baseURL = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!baseURL || !model) {
    throw new Error("AI_BASE_URL and AI_MODEL must be configured");
  }

  const url = new URL(baseURL);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("AI_BASE_URL must be an HTTP URL");
  }
  if (url.hostname === "ai-gateway.vercel.sh" && !process.env.AI_API_KEY) {
    throw new Error("AI_API_KEY is required for Gateway");
  }

  const provider = createOpenAICompatible({
    name: "studio",
    baseURL,
    apiKey: process.env.AI_API_KEY,
  });

  return provider(model);
}
