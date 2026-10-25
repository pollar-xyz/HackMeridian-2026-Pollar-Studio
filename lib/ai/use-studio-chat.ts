"use client";

import { useEffect, useSyncExternalStore } from "react";
import { streamChat } from "./chat-stream";
import { z } from "zod";
import { chatMessageSchema, chatRequestSchema, type ChatMessage } from "@/lib/schemas/chat";

export type ConversationMessage = ChatMessage & { id: string; incomplete?: boolean };
type Snapshot = {
  messages: ConversationMessage[];
  status: "idle" | "waiting" | "streaming";
  error: string | null;
  initialPrompt?: string;
};
const empty: Snapshot = { messages: [], status: "idle", error: null };
const conversations = new Map<string, Snapshot>();
const listeners = new Set<() => void>();
const controllers = new Map<string, AbortController>();
const savedMessagesSchema = z.array(chatMessageSchema.extend({
  id: z.string(), content: z.string(), incomplete: z.boolean().optional(),
}));
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
function update(id: string, patch: Partial<Snapshot>) {
  conversations.set(id, { ...(conversations.get(id) ?? empty), ...patch });
  listeners.forEach((listener) => listener());
}

function save(appId: string) {
  try {
    const snapshot = conversations.get(appId);
    sessionStorage.setItem(`studio-chat:${appId}`, JSON.stringify({
      messages: snapshot?.messages ?? [], initialPrompt: snapshot?.initialPrompt,
    }));
  } catch { /* Browsers may block storage or run out of space. */ }
}

async function generate(appId: string, history: ConversationMessage[]) {
  if (controllers.has(appId)) return;
  // Keep complete turns within the server's 50-message contract.
  const initialPrompt = conversations.get(appId)?.initialPrompt;
  const turns = initialPrompt ? history.slice(1) : history;
  const recent = turns.filter((m) => !m.incomplete).slice(-47);
  const parsed = chatRequestSchema.safeParse({ messages: [
    ...(initialPrompt ? [{ role: "user" as const, content: initialPrompt.slice(0, 10_000) }] : []),
    ...recent.map(({ role, content }) => ({ role, content: content.slice(0, 10_000) })),
  ] });
  if (!parsed.success) {
    update(appId, { error: "Please use between 1 and 10,000 characters." });
    return;
  }
  const controller = new AbortController();
  controllers.set(appId, controller);
  const assistantId = crypto.randomUUID();
  let content = "";
  update(appId, { messages: history, status: "waiting", error: null });
  save(appId);
  try {
    await streamChat(parsed.data, controller.signal, (delta) => {
      if (controllers.get(appId) !== controller) return;
      content += delta;
      update(appId, {
        status: "streaming",
        messages: [...history, { id: assistantId, role: "assistant", content }],
      });
    });
  } catch (error) {
    if (controllers.get(appId) === controller) update(appId, {
      messages: content ? [...history, { id: assistantId, role: "assistant", content, incomplete: true }] : history,
      error: controller.signal.aborted ? null : error instanceof Error ? error.message : "Could not connect. Please try again.",
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
export function startStudioChat(appId: string, prompt: string) {
  const content = prompt.trim();
  if (!content || content.length > 10_000) return false;
  controllers.get(appId)?.abort();
  controllers.delete(appId);
  update(appId, { messages: [], status: "idle", error: null, initialPrompt: content });
  void generate(appId, [{ id: crypto.randomUUID(), role: "user", content }]);
  return true;
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
      const saved = sessionStorage.getItem(`studio-chat:${appId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Accept conversations saved before the home handoff was added.
        const messages = savedMessagesSchema.parse(Array.isArray(parsed) ? parsed : parsed.messages);
        update(appId, {
          messages,
          initialPrompt: typeof parsed.initialPrompt === "string" ? parsed.initialPrompt : undefined,
          error: messages.at(-1)?.role === "user" ? "The response was interrupted. Please try again." : null,
        });
      }
    } catch { /* Storage is optional; keep the conversation usable without it. */ }
  }, [appId]);

  function send(value: string) {
    if (!value.trim() || controllers.has(appId)) return;
    const history = conversations.get(appId)?.messages ?? [];
    void generate(appId, [...history, { id: crypto.randomUUID(), role: "user", content: value.trim() }]);
  }
  function retry() {
    const history = conversations.get(appId)?.messages ?? [];
    const lastUser = history.findLastIndex((message) => message.role === "user");
    if (lastUser >= 0) void generate(appId, history.slice(0, lastUser + 1));
  }

  return { ...snapshot, send, retry, stop: () => controllers.get(appId)?.abort() };
}
