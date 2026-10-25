"use client";

import { useEffect, useSyncExternalStore } from "react";
import { streamChat } from "./chat-stream";
import { z } from "zod";
import {
  chatMessageSchema,
  chatRequestSchema,
  type ChatMessage,
} from "@/lib/schemas/chat";
import { rememberStudioApp } from "./studio-apps";
import { getSession } from "@/lib/auth/session";

export function getChatAccessToken() {
  return (process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_STUDIO_DEV_TOKEN : undefined) ?? getSession()?.token;
}

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
};
const empty: Snapshot = { messages: [], status: "idle", error: null };
const conversations = new Map<string, Snapshot>();
const listeners = new Set<() => void>();
const controllers = new Map<string, AbortController>();
const savedMessagesSchema = z.array(
  chatMessageSchema.extend({
    id: z.string(),
    content: z.string(),
    incomplete: z.boolean().optional(),
  }),
);
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

function save(appId: string) {
  if (appId.startsWith("pending:")) return;
  try {
    const snapshot = conversations.get(appId);
    localStorage.setItem(
      `studio-chat:${appId}`,
      JSON.stringify({
        messages: snapshot?.messages ?? [],
        initialPrompt: snapshot?.initialPrompt,
        jobId: snapshot?.jobId,
        logText: snapshot?.logText,
        progress: snapshot?.progress,
      }),
    );
  } catch {
    /* Browsers may block storage or run out of space. */
  }
}

async function generate(
  appId: string,
  history: ConversationMessage[],
  creation?: {
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
  });
  save(appId);

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
        save(appId);
        creation.resolve(appId);
      },
      (progress) => {
        if (controllers.get(appId) === controller) update(appId, { progress });
      },
      getChatAccessToken(),
      (warning) => {
        if (controllers.get(appId) === controller) update(appId, { warning });
      },
      {
        onJob(jobId) {
          if (controllers.get(appId) === controller) update(appId, { jobId, progress: "queued" });
        },
        onLog(text, reset) {
          if (controllers.get(appId) !== controller) return;
          const previous = conversations.get(appId)?.logText ?? "";
          update(appId, { logText: (reset ? text : previous + text).slice(-200_000) });
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
      save(appId);
    }
  }
}

// Start outside the hook so navigation from the home cannot abort the request.
export function startStudioChat(prompt: string): Promise<string> {
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
      { resolve, reject },
    );
  });
}

export function useStudioChat(appId: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => conversations.get(appId) ?? empty,
    () => empty,
  );
  useEffect(() => {
    if (conversations.has(appId)) return;
    try {
      const saved =
        localStorage.getItem(`studio-chat:${appId}`) ??
        sessionStorage.getItem(`studio-chat:${appId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Accept conversations saved before the home handoff was added.
        const messages = savedMessagesSchema.parse(
          Array.isArray(parsed) ? parsed : parsed.messages,
        );
        update(appId, {
          messages,
          initialPrompt:
            typeof parsed.initialPrompt === "string"
              ? parsed.initialPrompt
              : undefined,
          jobId: typeof parsed.jobId === "string" ? parsed.jobId : undefined,
          logText: typeof parsed.logText === "string" ? parsed.logText : undefined,
          progress: typeof parsed.progress === "string" ? parsed.progress : undefined,
          error:
            messages.at(-1)?.role === "user"
              ? "The response was interrupted. Please try again."
              : null,
        });
      }
    } catch {
      /* Storage is optional; keep the conversation usable without it. */
    }
  }, [appId]);

  function send(value: string) {
    if (!value.trim() || controllers.has(appId)) return;
    const history = conversations.get(appId)?.messages ?? [];
    void generate(appId, [
      ...history,
      { id: crypto.randomUUID(), role: "user", content: value.trim() },
    ]);
  }
  function retry() {
    const history = conversations.get(appId)?.messages ?? [];
    const lastUser = history.findLastIndex(
      (message) => message.role === "user",
    );
    if (lastUser >= 0) void generate(appId, history.slice(0, lastUser + 1));
  }

  return {
    ...snapshot,
    send,
    retry,
    stop: () => controllers.get(appId)?.abort(),
  };
}
