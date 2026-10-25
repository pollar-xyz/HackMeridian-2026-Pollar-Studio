import { chatRequestSchema } from "@/lib/schemas/chat";
import { createStudioApi, StudioApiError } from "./studio-api";
import { runStudioGeneration } from "./studio-generation";

const encoder = new TextEncoder();

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return Response.json({ error: "Se requiere una sesión autenticada" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const jobId = params.get("jobId");
  const appId = params.get("appId");
  if (jobId && !/^job_[\w-]+$/.test(jobId)) return Response.json({ error: "Job inválido" }, { status: 400 });
  if (appId && !/^prj_[0-9a-f-]{36}$/i.test(appId)) return Response.json({ error: "Proyecto inválido" }, { status: 400 });
  try {
    const api = createStudioApi(authorization, request.signal);
    if (jobId && params.get("logs") === "1") {
      return new Response(await api.getLogs(jobId), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    }
    const result = jobId ? await api.getJob(jobId) : appId
      ? { project: await api.getProject(appId), ...await api.getChat(appId) }
      : await api.listProjects();
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo recuperar el preview" }, { status: error instanceof StudioApiError ? error.status : 502 });
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) {
    return Response.json({ error: "Se requiere una sesión autenticada" }, { status: 401 });
  }
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Mensajes inválidos" }, { status: 400 });

  const cancellation = new AbortController();
  const signal = AbortSignal.any([request.signal, cancellation.signal, AbortSignal.timeout(10 * 60_000)]);
  let api: ReturnType<typeof createStudioApi>;
  try {
    api = createStudioApi(authorization, signal);
  } catch {
    return Response.json({ error: "La API del Studio no está configurada correctamente" }, { status: 503 });
  }
  const messageId = crypto.randomUUID();
  let appId = parsed.data.appId;
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: string, data: Record<string, unknown>) {
        if (!closed) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify({ messageId, ...data })}\n\n`));
      }
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15_000);
      try {
        await runStudioGeneration({
          api, appId, resumeJobId: parsed.data.resumeJobId, tools: parsed.data.tools, messages: parsed.data.messages, signal,
          emit(event, data) {
            if (event === "app") appId = data.appId as string;
            send(event, data);
          },
        });
      } catch (error) {
        if (!closed && !request.signal.aborted) {
          send("error", {
            appId,
            code: signal.aborted ? "GENERATION_TIMEOUT" : error instanceof StudioApiError ? error.code : "GENERATION_FAILED",
            message: signal.aborted ? "La espera terminó. El trabajo puede seguir ejecutándose en el servidor." : error instanceof Error ? error.message : "No se pudo completar la generación",
          });
        }
      } finally {
        clearInterval(heartbeat);
        if (!closed) { closed = true; controller.close(); }
      }
    },
    cancel() { closed = true; cancellation.abort(); },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
