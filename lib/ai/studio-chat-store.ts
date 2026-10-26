"use client";

import type { StudioTools } from "@/lib/schemas/studio-tools";
import { streamChat } from "./chat-stream";
import {
  chatRequestSchema,
  type ChatMessage,
} from "@/lib/schemas/chat";
import { rememberStudioApp, touchStudioApp } from "./studio-apps-store";
import { chatHistorySchema, studioProjectSchema } from "@/app/api/chat/schemas/studio-api";

export type ConversationMessage = ChatMessage & {
  id: string;
  incomplete?: boolean;
};
type Snapshot = {
  messages: ConversationMessage[];
  status: "idle" | "waiting" | "streaming";
  error: string | null;
  initialPrompt?: string;
  progress?: string;
  warning?: string;
  jobId?: string;
  logText?: string;
  urlStatus?: "building" | "live" | "failed" | "expired";
};
const empty: Snapshot = { messages: [], status: "idle", error: null };
const conversations = new Map<string, Snapshot>();
const listeners = new Set<() => void>();
const controllers = new Map<string, AbortController>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function update(id: string, patch: Partial<Snapshot>) {
  conversations.set(id, { ...(conversations.get(id) ?? empty), ...patch });
  listeners.forEach((listener) => listener());
}

async function generate(
  appId: string,
  history: ConversationMessage[],
  resumeJobId?: string,
  creation?: {
    tools?: StudioTools;
    resolve: (appId: string) => void;
    reject: (error: Error) => void;
  },
) {
  let assigned = !creation;
  if (controllers.has(appId)) return;
  // Keep complete turns within the server's 50-message contract.
  const initialPrompt = conversations.get(appId)?.initialPrompt;
  const turns = initialPrompt ? history.slice(1) : history;
  const recent = turns.filter((m) => !m.incomplete).slice(-47);
  const parsed = chatRequestSchema.safeParse({
    appId: creation ? undefined : appId,
    resumeJobId,
    tools: creation?.tools,
    messages: [
      ...(initialPrompt
        ? [{ role: "user" as const, content: initialPrompt.slice(0, 10_000) }]
        : []),
      ...recent.map(({ role, content }) => ({
        role,
        content: content.slice(0, 10_000),
      })),
    ],
  });
  if (!parsed.success) {
    const error = new Error("Please use between 1 and 10,000 characters.");
    update(appId, { error: error.message });
    creation?.reject(error);
    return;
  }
  if (!creation && !resumeJobId) touchStudioApp(appId);
  const controller = new AbortController();
  controllers.set(appId, controller);
  const assistantId = crypto.randomUUID();
  let content = "";
  update(appId, {
    messages: history,
    status: "waiting",
    error: null,
    progress: undefined,
    warning: undefined,
    jobId: undefined,
    logText: "",
    urlStatus: "building",
  });


  try {
    await streamChat(
      parsed.data,
      controller.signal,
      (delta) => {
        if (controllers.get(appId) !== controller) return;
        content += delta;
        update(appId, {
          status: "streaming",
          messages: [
            ...history,
            { id: assistantId, role: "assistant", content },
          ],
        });
      },
      (serverAppId, name) => {
        if (assigned || !creation) {
          if (serverAppId === appId && name)
            rememberStudioApp(
              appId,
              conversations.get(appId)?.initialPrompt ?? history[0].content,
              name,
            );
          return;
        }
        const pending = conversations.get(appId) ?? empty;
        conversations.delete(appId);
        controllers.delete(appId);
        appId = serverAppId;
        controllers.set(appId, controller);
        update(appId, pending);
        assigned = true;
        rememberStudioApp(
          appId,
          pending.initialPrompt ?? history[0].content,
          name,
        );

        creation.resolve(appId);
      },
      (progress) => {
        if (controllers.get(appId) === controller) update(appId, { progress });
      },
      (warning) => {
        if (controllers.get(appId) === controller) update(appId, { warning });
      },
      {
        onJob(jobId) {
          if (controllers.get(appId) === controller) { update(appId, { jobId, progress: "queued" }); }
        },
        onLog(text, reset) {
          if (controllers.get(appId) !== controller) return;
          const previous = conversations.get(appId)?.logText ?? "";
          update(appId, { logText: (reset ? text : previous + text).slice(-200_000) });
        },
        onDeployment(urlStatus) {
          if (controllers.get(appId) === controller) update(appId, { urlStatus });
        },
        onDone() {
          if (controllers.get(appId) === controller) update(appId, { progress: "succeeded" });
        },
        onPreview(serverAppId, origin) {
          if (serverAppId !== appId || controllers.get(appId) !== controller) return;
          rememberStudioApp(appId, conversations.get(appId)?.initialPrompt ?? history[0].content, undefined, origin);
        },
      },
    );
    if (!assigned) throw new Error("The server did not return an app ID.");
  } catch (error) {
    if (!assigned)
      creation?.reject(
        error instanceof Error ? error : new Error("Could not create the app."),
      );
    if (controllers.get(appId) === controller)
      update(appId, {
        messages: content
          ? [
              ...history,
              { id: assistantId, role: "assistant", content, incomplete: true },
            ]
          : history,
        error: controller.signal.aborted
          ? null
          : error instanceof Error
            ? error.message
            : "Could not connect. Please try again.",
      });
  } finally {
    if (controllers.get(appId) === controller) {
      controllers.delete(appId);
      update(appId, { status: "idle" });

    }
  }
}

// Start outside the hook so navigation from the home cannot abort the request.
export function startStudioChat(prompt: string, tools?: StudioTools): Promise<string> {
  const content = prompt.trim();
  if (!content || content.length > 10_000)
    return Promise.reject(
      new Error("Please use between 1 and 10,000 characters."),
    );
  // This key tracks a local request only; the app ID always comes from the API.
  const pendingId = `pending:${crypto.randomUUID()}`;
  update(pendingId, {
    messages: [],
    status: "idle",
    error: null,
    initialPrompt: content,
  });
  return new Promise((resolve, reject) => {
    void generate(
      pendingId,
      [{ id: crypto.randomUUID(), role: "user", content }],
      undefined,
      { resolve, reject, tools },
    );
  });
}

const restoring = new Set<string>();
async function restoreConversation(appId: string) {
  if (restoring.has(appId) || controllers.has(appId)) return;
  restoring.add(appId);
  update(appId, { status: "waiting", error: null });
  try {
    const response = await fetch(`/api/chat?appId=${encodeURIComponent(appId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo recuperar la conversación.");
    const raw = await response.json();
    const project = studioProjectSchema.parse(raw.project);
    const { messages: turns } = chatHistorySchema.parse(raw);
    if (controllers.has(appId)) return;
    const messages: ConversationMessage[] = turns.flatMap(turn => [
      { id: `${turn.jobId}:user`, role: "user" as const, content: turn.prompt },
      ...(turn.summary ? [{ id: `${turn.jobId}:assistant`, role: "assistant" as const, content: turn.summary }] : []),
    ]);
    const last = turns.at(-1);
    rememberStudioApp(appId, turns[0]?.prompt || project.identity.description || "Studio project", project.identity.displayName,
      last?.urlStatus === "live" ? last.url ?? undefined : project.url ?? undefined);
    update(appId, { messages, initialPrompt: turns[0]?.prompt, jobId: last?.jobId, progress: last?.status,
      urlStatus: last?.urlStatus, status: "idle", error: last?.error ?? (last?.urlStatus === "failed" ? "Deployment failed" : last?.status === "failed" ? "Generation failed" : null) });

    if (last && last.status !== "queued" && last.status !== "running" && last.urlStatus !== "building") {
      void fetch(`/api/chat?jobId=${encodeURIComponent(last.jobId)}&logs=1`, { cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error("Could not recover generation logs");
        const logText = await response.text();
        if (!controllers.has(appId) && conversations.get(appId)?.jobId === last.jobId) update(appId, { logText: logText.slice(-200_000) });
      }).catch(() => {
        if (!controllers.has(appId) && conversations.get(appId)?.jobId === last.jobId) update(appId, { warning: "Could not recover generation logs" });
      });
    }
    if (last && (last.status === "queued" || last.status === "running" || (last.status === "succeeded" && last.urlStatus === "building"))) {
      const history = last.summary ? messages.slice(0, -1) : messages;
      void generate(appId, history, last.jobId);
    }
  } catch (error) {
    update(appId, { status: "idle", error: error instanceof Error ? error.message : "No se pudo recuperar la conversación." });
  } finally { restoring.delete(appId); }
}

function send(appId: string, value: string) {
  if (!value.trim() || controllers.has(appId) || restoring.has(appId)) return;
  const history = conversations.get(appId)?.messages ?? [];
  void generate(appId, [
    ...history,
    { id: crypto.randomUUID(), role: "user", content: value.trim() },
  ]);
}

function retry(appId: string) {
  if (controllers.has(appId) || restoring.has(appId)) return;
  const current = conversations.get(appId);
  if (current?.jobId && (current.progress === "queued" || current.progress === "running" || current.urlStatus === "building")) {
    void restoreConversation(appId);
    return;
  }
  const history = conversations.get(appId)?.messages ?? [];
  const lastUser = history.findLastIndex(
    (message) => message.role === "user",
  );
  if (lastUser >= 0) void generate(appId, history.slice(0, lastUser + 1));
  else if (appId.startsWith("prj_")) void restoreConversation(appId);
}


export const studioChatStore = {
  subscribe,
  getSnapshot: (appId: string) => conversations.get(appId) ?? empty,
  getServerSnapshot: () => empty,
  ensureLoaded(appId: string) {
    if (appId.startsWith("prj_") && !conversations.has(appId) && !controllers.has(appId)) {
      void restoreConversation(appId);
    }
  },
  send,
  retry,
  stop: (appId: string) => controllers.get(appId)?.abort(),
};
