"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";

function parseLine(line: string): { time: string; text: string; error: boolean } {
  const space = line.indexOf(" ");
  if (space === -1) return { time: "", text: line, error: false };
  const rawTime = line.slice(0, space);
  const time = /^\[\d{4}-\d{2}-\d{2}T/.test(rawTime)
    ? new Date(rawTime.slice(1, -1)).toLocaleTimeString([], { hour12: false })
    : rawTime;
  let text = line.slice(space + 1);
  const error = /^(error:|Generation failed:|Deployment failed:)/i.test(text);
  if (text.startsWith("error:")) text = text.slice(6).trim();
  return { time, text, error };
}

export function LogPanel({ logs, maxHeight = 260 }: { logs: string[]; maxHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (logs.length === 0) follow.current = true;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div
      ref={ref}
      onScroll={() => {
        const el = ref.current;
        if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
      }}
      style={{ maxHeight }}
      className="overflow-y-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs leading-6 text-stone-200"
    >
      {logs.length === 0 && <div className="text-stone-500">{t("Waiting for the first log line")}</div>}
      {logs.map((line, i) => {
        const { time, text, error } = parseLine(line);
        return (
          <div key={i} className="flex gap-3">
            <span className="w-16 shrink-0 text-right text-stone-500 tabular-nums">{time}</span>
            <span className={`min-w-0 flex-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${error ? "text-red-400" : ""}`}>{text}</span>
          </div>
        );
      })}
    </div>
  );
}
