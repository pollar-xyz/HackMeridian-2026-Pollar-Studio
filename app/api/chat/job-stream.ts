import { createParser } from "eventsource-parser";
import { z } from "zod";

const state = z.enum(["queued", "running", "succeeded", "failed"]);
const urlStatus = z.enum(["building", "live", "failed", "expired"]);
const url = z.string().url().regex(/^https?:\/\//).nullable().optional();
export const phaseSchema = z.object({ status: state, urlStatus: urlStatus.optional(), url });
export const completionSchema = phaseSchema.extend({
  summary: z.string().nullable().optional(), error: z.string().nullable().optional(),
  errorCode: z.string().nullable().optional(), destructive: z.array(z.string()).nullable().optional(),
});
export type JobEvent = { event: "log"; data: { line: string } } | { event: "phase"; data: z.infer<typeof phaseSchema> } | { event: "done"; data: z.infer<typeof completionSchema> };

export async function readJobStream(response: Response, emit: (event: JobEvent) => void) {
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("El servidor no devolvió un stream SSE.");
  let finished = false;
  const parser = createParser({ onEvent(frame) {
    if (finished) return;
    if (frame.event === "log") emit({ event: "log", data: z.object({ line: z.string() }).parse(JSON.parse(frame.data)) });
    if (frame.event === "phase") emit({ event: "phase", data: phaseSchema.parse(JSON.parse(frame.data)) });
    if (frame.event === "done") {
      const data = completionSchema.parse(JSON.parse(frame.data));
      emit({ event: "done", data });
      finished = true;
    }
  } });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (!finished) {
      const { done, value } = await reader.read();
      if (done) { parser.feed(decoder.decode()); break; }
      parser.feed(decoder.decode(value, { stream: true }));
    }
    if (!finished) throw new Error("Se interrumpió el stream del job. Vuelve a abrir la app para recuperar su estado.");
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
