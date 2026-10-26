"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Sparkles, Square, RotateCcw, TriangleAlert } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Spinner } from "@/components/Modal";
import { Mark } from "@/components/Logo";
import { useStudioChat } from "@/hooks/use-studio-chat";
import { ChatMarkdown } from "@/components/studio/ChatMarkdown";
import { CopyButton } from "@/components/CopyButton";

// The conversation that keeps building the app after the first generation.
export function StudioChatPanel({
  appId,
  embedded,
}: {
  appId: string;
  embedded?: boolean;
}) {
  const t = useT();
  const { messages, status, progress, warning, error, dataLoss, send: sendMessage, stop, retry, confirmDataLoss, dismissDataLoss } = useStudioChat(appId);
  const generating = status !== "idle";
  const follow = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
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
  useEffect(() => {
    const el = listRef.current;
    if (el && follow.current) el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [messages, status]);

  const send = (value: string) => {
    if (!value.trim() || generating || value.trim().length > 10_000) return;
    follow.current = true;
    sendMessage(value);
    setText("");
    inputRef.current?.focus();
  };

  return (
    <div className={`flex h-full min-h-0 flex-col bg-surface ${embedded ? "" : "rounded-2xl border border-line"}`}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          <Mark size={18} light />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Pollar Studio</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Sparkles size={12} className="shrink-0 text-accent" />
            <span className="truncate">
              {generating ? t("Thinking…") : t("Conversation")}
            </span>
          </p>
        </div>
      </div>

      <div ref={listRef} role="log" aria-label={t("Conversation")} aria-live="off" onScroll={() => {
        const el = listRef.current;
        if (!el) return;
        follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setShowLatest(!follow.current);
      }} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => message.role === "user" ? (
          <UserBubble key={message.id} text={message.content} />
        ) : (
          <Assistant key={message.id}>
            <ChatMarkdown text={message.content} />
            {message.incomplete && <p className="mt-2 text-xs text-muted">{t("Response stopped")}</p>}
            {(!generating || index !== messages.length - 1) && <div className="mt-2"><CopyButton value={message.content} compact /></div>}
          </Assistant>
        ))}
        {status === "waiting" && <Assistant><p role="status" className="flex items-center gap-2 text-muted"><Spinner className="h-3.5 w-3.5" />{t(progress === "queued" ? "Generation queued" : progress === "running" ? "Generating your app…" : "Thinking…")}</p></Assistant>}
        {warning && <p role="status" className="rounded-xl border border-line p-3 text-xs text-muted">{warning}</p>}
        {error && <div role="alert" className="rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm">
          <p>{t(error)}</p>
          <Button variant="unstyled" type="button" onClick={retry} disabled={generating} className="mt-2 inline-flex items-center gap-1.5 text-accent disabled:opacity-40"><RotateCcw size={13} />{t("Try again")}</Button>
        </div>}
        {dataLoss && <DataLossConfirmation statements={dataLoss} disabled={generating} onConfirm={confirmDataLoss} onDismiss={dismissDataLoss} />}

      </div>

      {showLatest && <Button variant="unstyled" type="button" onClick={() => {
        follow.current = true;
        setShowLatest(false);
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }} className="mx-auto inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted"><ArrowDown size={12} />{t("Latest messages")}</Button>}
      <form
        className="flex flex-col gap-2 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-background py-1.5 pl-3.5 pr-1.5 transition-colors focus-within:border-accent/40 focus-within:bg-surface">
          <Textarea aria-label={t("Ask for a change or a question")}
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(text);
              }
            }}
            maxLength={10_000}
            rows={1}
            placeholder={t("Ask for a change or a question")}
            className="chat-input max-h-40 min-h-0 flex-1 resize-none overflow-y-hidden rounded-none border-0 bg-transparent px-0 py-1.5 text-sm leading-relaxed shadow-none placeholder:text-muted/70"
          />
          {generating ? <Button variant="primary" size="icon" type="button" onClick={stop} aria-label={t("Stop response")} className="h-8 w-8 shrink-0 rounded-full"><Square size={13} fill="currentColor" /></Button> : <Button variant="primary" size="icon"
            type="submit"
            disabled={!text.trim()}
            aria-label={t("Send")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:opacity-30"
          >
            <ArrowUp size={16} />
          </Button>}
        </div>
      </form>
    </div>
  );
}

/** The last message would delete database data: nothing ran, and it waits for the owner's decision. */
function DataLossConfirmation({ statements, disabled, onConfirm, onDismiss }: {
  statements: string[];
  disabled: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <div role="alertdialog" aria-labelledby="data-loss-title" aria-describedby="data-loss-description" className="rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm">
      <p id="data-loss-title" className="flex items-center gap-2 font-semibold text-danger"><TriangleAlert size={15} className="shrink-0" />{t("This change would delete data")}</p>
      <p id="data-loss-description" className="mt-1.5 text-muted">{t("It removes data already saved in your app's database, and it cannot be undone. Nothing has changed yet.")}</p>
      {statements.length > 0 && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-line bg-surface p-2 font-mono text-xs">{statements.join("\n")}</pre>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="danger" size="sm" type="button" onClick={onConfirm} disabled={disabled}>{t("Delete the data and continue")}</Button>
        <Button variant="secondary" size="sm" type="button" onClick={onDismiss} disabled={disabled}>{t("Keep my data")}</Button>
      </div>
      <p className="mt-2 text-xs text-muted">{t("To keep it, ask for the change in a way that does not remove fields, for example hiding them instead.")}</p>
    </div>
  );
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
