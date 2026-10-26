import type { StudioTools } from "@/lib/schemas/studio-tools";
import type { StudioProject, StudioJob } from "./schemas/studio-api";
import type { ChatMessage } from "@/lib/schemas/chat";
import type { JobEvent } from "./job-stream";

/** The change would delete database data: the owner decides, then it is sent again with confirmDataLoss. */
export class DataLossConfirmationError extends Error {
  readonly statements: string[];
  constructor(statements: string[], message: string) {
    super(message);
    this.statements = statements;
  }
}

interface StudioApi {
  createProject(prompt: string, tools?: StudioTools): Promise<StudioProject>;
  getProject(id: string): Promise<StudioProject>;
  queueGeneration(id: string, prompt: string, tools?: StudioTools, confirmDataLoss?: boolean): Promise<{ jobId: string }>;
  getJob(id: string): Promise<StudioJob>;
  streamJob(id: string, emit: (event: JobEvent) => void): Promise<void>;
}

/** The contract ids a version went live with, as a short footer the owner can copy or open on stellar.expert. */
// The footer a reply gets once its version deployed Soroban contracts; the chat store reuses it when restoring history.
export function contractsNote(contracts: Record<string, string> | null | undefined): string {
  const entries = Object.entries(contracts ?? {});
  if (!entries.length) return "";
  const lines = entries.map(([name, id]) => `- **${name}**: \`${id}\` ([stellar.expert](https://stellar.expert/explorer/testnet/contract/${id}))`);
  return `\n\n${entries.length === 1 ? "Contrato desplegado en Stellar testnet:" : "Contratos desplegados en Stellar testnet:"}\n${lines.join("\n")}`;
}

export async function runStudioGeneration(options: {
  api: StudioApi; tools?: StudioTools; appId?: string; resumeJobId?: string; confirmDataLoss?: boolean; messages: ChatMessage[];
  signal: AbortSignal; emit: (event: string, data: Record<string, unknown>) => void;
}) {
  const { api, messages, signal, emit } = options;
  signal.throwIfAborted();
  if (options.resumeJobId && !options.appId) throw new Error("Se requiere un proyecto para retomar un job.");
  let project = options.appId ? await api.getProject(options.appId) : await api.createProject(messages[0].content, options.tools);
  const appId = project.projectId;
  emit("app", { appId, name: project.identity.displayName });
  const job = options.resumeJobId
    ? await api.getJob(options.resumeJobId)
    : await api.queueGeneration(appId, messages.findLast(message => message.role === "user")!.content, options.tools, options.confirmDataLoss);
  if ("projectId" in job && job.projectId !== appId) throw new Error("Job does not belong to this project");
  emit("job", { appId, jobId: job.jobId });
  let completion: Extract<JobEvent, { event: "done" }>["data"] | undefined;
  await api.streamJob(job.jobId, frame => {
    signal.throwIfAborted();
    if (frame.event === "log") {
      emit("log", { appId, jobId: job.jobId, text: frame.data.line + "\n", reset: false });
      return;
    }
    const phase = frame.data;
    emit("progress", { appId, jobId: job.jobId, status: phase.status });
    emit("deployment", { appId, jobId: job.jobId, url: phase.url ?? null, urlStatus: phase.urlStatus });
    if (phase.urlStatus === "live" && phase.url) emit("preview", { appId, jobId: job.jobId, url: phase.url });
    if (frame.event === "done") completion = frame.data;
  });
  if (!completion) throw new Error("El job terminó sin un resultado.");
  if (completion.errorCode === "destructive_migration") throw new DataLossConfirmationError(completion.destructive ?? [], completion.error ?? "This change would delete data");
  if (completion.status !== "succeeded" || completion.urlStatus === "failed") throw new Error(completion.error ?? "Generation failed");
  try {
    project = await api.getProject(appId);
    emit("app", { appId, name: project.identity.displayName });
  } catch {
    emit("warning", { appId, message: "No se pudo actualizar el nombre del proyecto. Se recuperará al abrir la app." });
  }
  emit("delta", { appId, text: (completion.summary || "La generación de la app terminó correctamente.") + contractsNote(completion.contracts) });
  emit("done", { appId, jobId: job.jobId, urlStatus: completion.urlStatus });
}
