import { streamText } from "ai";
import { getChatModel } from "@/lib/ai/model";
import { chatRequestSchema } from "@/lib/schemas/chat";

const encoder = new TextEncoder();

export async function POST(request: Request) {
  // TODO: Enforce real session authorization and usage limits when available.
  const parsed = chatRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json({ error: "Mensajes inválidos" }, { status: 400 });
  }

  let model: ReturnType<typeof getChatModel>;
  try {
    model = getChatModel();
  } catch {
    return Response.json(
      { error: "El servicio de IA no está configurado" },
      { status: 503 },
    );
  }

  const messageId = crypto.randomUUID();
  const cancellation = new AbortController();
  const signal = AbortSignal.any([
    request.signal,
    cancellation.signal,
    AbortSignal.timeout(120_000),
  ]);
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (!closed) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        }
      }

      try {
        const result = streamText({
          model,
          instructions: [
            "Eres el asistente de Pollar Studio.",
            "Responde en el idioma del usuario.",
            "Ayuda a construir y configurar su aplicación.",
            "No afirmes haber aplicado cambios que no ejecutaste.",
          ].join(" "),
          messages: parsed.data.messages,
          maxOutputTokens: 2048,
          abortSignal: signal,
        });

        let finished = false;
        for await (const part of result.stream) {
          if (signal.aborted) break;
          if (part.type === "text-delta") {
            send("delta", { messageId, text: part.text });
          } else if (part.type === "error") {
            throw part.error;
          } else if (part.type === "finish") {
            finished = true;
            send("done", { messageId });
          }
        }
        if (!finished && !closed && !request.signal.aborted) {
          throw new Error("Generation did not finish");
        }
      } catch {
        if (!closed && !request.signal.aborted) {
          send("error", {
            messageId,
            code: "GENERATION_FAILED",
            message: "No se pudo completar la respuesta",
          });
        }
      } finally {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    cancel() {
      closed = true;
      cancellation.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
