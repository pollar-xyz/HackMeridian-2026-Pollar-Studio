"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/lib/i18n";

interface CopyButtonProps {
  value: string;
  label?: string;
  compact?: boolean;
}

export function CopyButton({ value, label, compact }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? t("Copied") : t("Copy")}
        className="rounded p-1 text-muted hover:bg-background hover:text-foreground"
      >
        {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-background"
    >
      {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
      {copied ? t("Copied") : label ?? t("Copy")}
    </button>
  );
}
