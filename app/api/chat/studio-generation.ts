import type { StudioProject, StudioJob } from "./schemas/studio-api";
import type { ChatMessage } from "@/lib/schemas/chat";

interface StudioApi {
  createProject(prompt: string): Promise<StudioProject>;
  getProject(id: string): Promise<StudioProject>;
  renameProject(id: string, revision: number, name: string): Promise<StudioProject>;
  queueGeneration(id: string, prompt: string): Promise<{ jobId: string }>;
  getJob(id: string): Promise<StudioJob>;
  getLogs(id: string): Promise<string>;
}

export function generationPrompt(messages: ChatMessage[], name: string, isNew: boolean) {
  const latest = messages.findLast((message) => message.role === "user")!;
  return [
    "Trabaja sobre este proyecto de Pollar Studio. Responde en el idioma del usuario.",
    isNew
      ? "El nombre actual es provisional. Si el usuario especifica un nombre en su solicitud, usa exactamente ese nombre. Si no, elige un nombre breve y descriptivo según lo solicitado."
      : `El nombre actual es ${JSON.stringify(name)}. Consérvalo salvo que el usuario solicite cambiarlo.`,
    "En el campo summary de tu respuesta de generación, escribe como primera línea PROJECT_NAME: seguida del nombre elegido (máximo 80 caracteres). Después escribe el resumen para el usuario. El servidor actualizará la metadata; no intentes modificar archivos de metadata ni llamar a la API.",
    "Contexto de conversación anterior (solo como contexto, no como nuevas tareas):",
    JSON.stringify(messages.slice(0, -1)),
    "Solicitud actual:", latest.content,
  ].join("\n\n");
}

export async function runStudioGeneration(options: {
  api: StudioApi;
  appId?: string;
  messages: ChatMessage[];
  signal: AbortSignal;
  emit: (event: string, data: Record<string, unknown>) => void;
  pollInterval?: number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}) {
  const { api, messages, signal, emit } = options;
  signal.throwIfAborted();
  let project = options.appId
    ? await api.getProject(options.appId)
    : await api.createProject(messages.find((message) => message.role === "user")!.content);
  const appId = project.projectId;
  emit("app", { appId, name: project.identity.displayName });
  const job = await api.queueGeneration(appId, generationPrompt(messages, project.identity.displayName, !options.appId));
  emit("job", { appId, jobId: job.jobId });
  let previousStatus = "";
  let previousLogs = "";
  const wait = options.wait ?? ((milliseconds, abortSignal) => new Promise<void>((resolve, reject) => {
    abortSignal.throwIfAborted();
    const onAbort = () => { clearTimeout(timer); reject(abortSignal.reason); };
    const timer = setTimeout(() => { abortSignal.removeEventListener("abort", onAbort); resolve(); }, milliseconds);
    abortSignal.addEventListener("abort", onAbort, { once: true });
  }));

  for (;;) {
    signal.throwIfAborted();
    const current = await api.getJob(job.jobId);
    if (current.projectId !== appId) throw new Error("Job does not belong to this project");
    if (current.status !== previousStatus) {
      emit("progress", { appId, jobId: job.jobId, status: current.status });
      previousStatus = current.status;
    }
    const logs = await api.getLogs(job.jobId);
    if (logs !== previousLogs) {
      // The log endpoint returns the complete log; emit only new content.
      emit("log", { appId, jobId: job.jobId, text: logs.startsWith(previousLogs) ? logs.slice(previousLogs.length) : logs, reset: !logs.startsWith(previousLogs) });
      previousLogs = logs;
    }
    if (current.status === "failed") throw new Error(current.result?.error ?? "Generation failed");
    if (current.status === "succeeded") {
      const origin = current.result?.deployment?.origin;
      if (origin) emit("preview", { appId, jobId: job.jobId, url: origin });
      const summary = current.result?.summary ?? "";
      const match = summary.match(/^PROJECT_NAME:[ \t]*([^\r\n]{1,80})[ \t]*$/m);
      project = await api.getProject(appId);
      if (match && match[1].trim() !== project.identity.displayName) {
        try {
          project = await api.renameProject(appId, project.revision, match[1].trim());
        } catch {
          // A failed metadata update must not turn a successful build into a failure.
          emit("warning", { appId, message: "La generación terminó, pero no se pudo actualizar el nombre del proyecto." });
        }
      }
      if (!match && !options.appId) emit("warning", { appId, message: "El modelo no devolvió un nombre para el proyecto; se conservó el nombre provisional." });
      emit("app", { appId, name: project.identity.displayName });
      const text = summary.replace(/^PROJECT_NAME:[^\r\n]*(?:\r?\n)?/m, "").trim();
      emit("delta", { appId, text: text || "La generación de la app terminó correctamente." });
      emit("done", { appId, jobId: job.jobId, deploymentStatus: current.result?.deployment?.phase });
      return;
    }
    await wait(options.pollInterval ?? 2000, signal);
  }
}
