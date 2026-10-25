"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";

function parseLine(line: string): { time: string; text: string; error: boolean } {
  const space = line.indexOf(" ");
  if (space === -1) return { time: "", text: line, error: false };
  const time = line.slice(0, space);
  let text = line.slice(space + 1);
  const error = text.startsWith("error:");
  if (error) text = text.slice(6).trim();
  return { time, text, error };
}

export function LogPanel({ logs, maxHeight = 260 }: { logs: string[]; maxHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <div
      ref={ref}
      style={{ maxHeight }}
      className="overflow-y-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs leading-6 text-stone-200"
    >
      {logs.length === 0 && <div className="text-stone-500">{t("Waiting for the first log line")}</div>}
      {logs.map((line, i) => {
        const { time, text, error } = parseLine(line);
        return (
          <div key={i} className="flex gap-3">
            <span className="w-12 shrink-0 text-right text-stone-500 tabular-nums">{time}</span>
            <span className={error ? "text-red-400" : ""}>{text}</span>
          </div>
        );
      })}
    </div>
  );
}
