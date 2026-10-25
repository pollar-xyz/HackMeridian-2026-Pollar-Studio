"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUp, Check, FileCode2, HelpCircle, Palette, Repeat, Sparkles } from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import { isTerminal } from "@/lib/mock/jobs";
import { useT } from "@/lib/i18n";
import type { App, ChatMessage } from "@/lib/mock/types";
import { KIND_LABELS } from "@/lib/mock/types";
import { JOB_STEPS } from "@/lib/mock/jobs";
import { Spinner } from "@/components/Modal";
import type { JobStatus } from "@/lib/mock/types";
import { Mark } from "@/components/Logo";
import { getMockApp } from "@/lib/mock/get-app";

// Small chips above the input, Claude style. They disappear once the conversation starts.
const SUGGESTIONS: Array<{ text: string; Icon: typeof Palette }> = [
  { text: "Make the buttons green", Icon: Palette },
  { text: "Release the funds every week", Icon: FileCode2 },
  { text: "Settle payments in XLM", Icon: Repeat },
  { text: "What does the contract do?", Icon: HelpCircle },
];

// The conversation that keeps building the app after the first generation.
function ChatPanel({
  app,
  embedded,
}: {
  app: App;
  embedded?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const allChats = useStudioStore((s) => s.chats);
  const jobs = useStudioStore((s) => s.jobs);
  const sendChat = useStudioStore((s) => s.sendChat);
  const messages = useMemo(() => allChats.filter((m) => m.appId === app.id), [allChats, app.id]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // The input starts as one line and grows with the text, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.overflowY = "hidden";
    el.style.height = "auto";
    const height = el.scrollHeight;
    el.style.height = `${Math.min(height, 160)}px`;
    el.style.overflowY = height > 160 ? "auto" : "hidden";
  }, [text]);
  const busy = jobs.some((j) => j.appId === app.id && !isTerminal(j.status));
  const firstJob = useMemo(
    () => jobs.filter((j) => j.appId === app.id && j.trigger === "prompt").sort((a, b) => a.startedAt - b.startedAt)[0],
    [jobs, app.id],
  );
  const live = !!app.previewSha;
  const isPublic = app.status === "published";

  // Start at the top so the original prompt is visible, then follow new messages.
  const seen = useRef(messages.length);
  useEffect(() => {
    const el = listRef.current;
    if (!el || messages.length === seen.current) return;
    seen.current = messages.length;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = (value: string) => {
    if (!value.trim()) return;
    sendChat(app.id, value);
    setText("");
  };

  return (
    <div className={`flex h-full min-h-0 flex-col bg-surface ${embedded ? "" : "rounded-2xl border border-line"}`}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
          style={{ background: app.themeColor ?? "var(--accent)" }}
        >
          {app.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{app.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Sparkles size={12} className="shrink-0 text-accent" />
            <span className="truncate">
              {busy ? t("Rebuilding") : `${t(KIND_LABELS[app.kind])} · Stellar ${app.network ?? "testnet"} · ${app.asset ?? "USDC"}`}
            </span>
          </p>
        </div>
      </div>

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <UserBubble text={app.prompt} />
        <Assistant>
          {live ? (
            <>
              <p>
                {isPublic
                  ? t("Live at {url}. Ask for a change or how something works.", { url: app.url.replace("https://", "") })
                  : t("Your preview is ready. Ask for changes, then hit Publish.")}
              </p>
            </>
          ) : (
            <p>{t("Building {name}: screens, passkey login, wallet and your payment contract on Stellar.", { name: app.name })}</p>
          )}
          {firstJob && !live && <JobStatusLine status={firstJob.status} />}
        </Assistant>

        {messages.map((m) => (m.role === "user" ? <UserBubble key={m.id} text={m.text} /> : <AssistantMessage key={m.id} message={m} onShowTab={(tab) => router.push(`/studio/${app.id}/${tab}`)} />))}

      </div>

      <form
        className="flex flex-col gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        {messages.length === 0 && live && !busy && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(({ text: s, Icon }) => (
              <Button variant="unstyled"
                key={s}
                type="button"
                onClick={() => send(t(s))}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                <Icon size={12} className="text-accent" /> {t(s)}
              </Button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-background py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-accent/40 focus-within:bg-surface">
          <Textarea aria-label={t("Ask for a change or a question")}
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={1}
            placeholder={busy ? t("Rebuilding, you can keep writing") : t("Ask for a change or a question")}
            className="chat-input max-h-40 min-h-0 flex-1 resize-none overflow-y-hidden rounded-none border-0 bg-transparent px-0 py-1.5 text-sm leading-relaxed shadow-none placeholder:text-muted/70"
          />
          <Button variant="primary" size="icon"
            type="submit"
            disabled={!text.trim()}
            aria-label={t("Send")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:opacity-30"
          >
            <ArrowUp size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ChatPage() {
  const { appId } = useParams<{ appId: string }>();
  const app = getMockApp(appId);
  if (!app) return null;
  return <ChatPanel app={app} embedded />;
}

function Assistant({ children }: { children: React.ReactNode }) {
  return (
    <div className="rise flex gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
        <Mark size={13} />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="rise flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent-soft px-3.5 py-2 text-sm leading-relaxed text-foreground">{text}</p>
    </div>
  );
}

function AssistantMessage({ message, onShowTab }: { message: ChatMessage; onShowTab: (tab: "contract" | "preview" | "stack") => void }) {
  const t = useT();
  const job = useStudioStore((s) => (message.jobId ? s.jobs.find((j) => j.id === message.jobId) : undefined));
  const done = job?.status === "published";

  return (
    <Assistant>
      <p>{t(message.text)}</p>

      {message.changes && message.changes.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5 rounded-xl border border-line bg-background p-3">
          {message.changes.map((c) => (
            <li key={c} className="flex items-start gap-2 text-xs">
              <Check size={14} className={`mt-px shrink-0 ${done ? "text-accent" : "text-muted"}`} />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

      {job && !done && <JobStatusLine status={job.status} />}
      {done && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-accent">
            <Check size={13} /> {t("Preview updated")}
          </span>
          <Button variant="unstyled" type="button" onClick={() => onShowTab(message.intent === "contract" ? "contract" : "preview")} className="ml-auto inline-flex items-center gap-1 font-medium text-accent hover:underline">
            {message.intent === "contract" ? <FileCode2 size={12} /> : null}
            {message.intent === "contract" ? t("See the contract") : t("See the app")}
          </Button>
        </div>
      )}

      {message.intent === "question" && (
        <div className="mt-2 flex gap-3 text-xs">
          <Button variant="unstyled" type="button" onClick={() => onShowTab("contract")} className="font-medium text-accent hover:underline">
            {t("Open the contract")}
          </Button>
          <Button variant="unstyled" type="button" onClick={() => onShowTab("stack")} className="font-medium text-accent hover:underline">
            {t("See connected services")}
          </Button>
        </div>
      )}
    </Assistant>
  );
}

// One quiet line while a build runs. The full progress lives in the preview pane, so the chat does not repeat it.
function JobStatusLine({ status }: { status: JobStatus }) {
  const t = useT();
  if (status === "failed") return <p className="mt-2 text-xs font-medium text-danger">{t("The build failed. Rebuild from the Deploys tab.")}</p>;
  const label = JOB_STEPS.find((s) => s.key === status)?.label ?? "Queued";
  return (
    <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted">
      <Spinner className="h-3.5 w-3.5" />
      {t(label)}
    </p>
  );
}
