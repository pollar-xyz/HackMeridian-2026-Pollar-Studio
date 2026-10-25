import { createParser } from "eventsource-parser";
import { z } from "zod";
import type { ChatRequest } from "@/lib/schemas/chat";

const eventSchema = z.object({
  messageId: z.string(),
  text: z.string().optional(),
  message: z.string().optional(),
});

// SSE frames and UTF-8 characters may span multiple network chunks.
export async function streamChat(
  body: ChatRequest,
  signal: AbortSignal,
  onDelta: (text: string) => void,
  onApp?: (appId: string) => void,
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Could not connect. Please try again.");
  }
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
    throw new Error("Could not connect. Please try again.");
  }

  let finished = false;
  const parser = createParser({
    onEvent(event) {
      if (event.event === "app" && !finished) {
        const data = z.object({ appId: z.string().min(1) }).parse(JSON.parse(event.data));
        onApp?.(data.appId);
        return;
      }
      if (finished || !["delta", "done", "error"].includes(event.event ?? "")) return;
      const data = eventSchema.parse(JSON.parse(event.data));
      if (event.event === "error") throw new Error(data.message ?? "The response was interrupted. Please try again.");
      if (event.event === "delta") {
        if (data.text === undefined) throw new Error("Invalid response");
        onDelta(data.text);
      }
      if (event.event === "done") finished = true;
    },
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (!finished) {
      const { value, done } = await reader.read();
      if (done) {
        parser.feed(decoder.decode());
        break;
      }
      parser.feed(decoder.decode(value, { stream: true }));
    }
    if (!finished) throw new Error("The response was interrupted. Please try again.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
