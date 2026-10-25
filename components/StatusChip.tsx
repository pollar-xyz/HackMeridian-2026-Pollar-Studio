"use client";

import type { JobStatus } from "@/lib/mock/types";
import { useT } from "@/lib/i18n";

type ChipStatus = JobStatus | "draft" | "live" | "paid" | "pending" | "verified";

const STYLES: Record<ChipStatus, string> = {
  queued: "bg-background text-muted border-line",
  generating: "bg-accent-soft text-accent-strong border-accent/20",
  building: "bg-accent-soft text-accent-strong border-accent/20",
  retrying: "bg-warn-soft text-warn border-warn-line",
  publishing: "bg-accent-soft text-accent-strong border-accent/20",
  published: "bg-accent text-white border-accent",
  failed: "bg-danger-soft text-danger border-danger/20",
  draft: "bg-background text-muted border-line",
  live: "bg-accent-soft text-accent-strong border-accent/20",
  paid: "bg-accent text-white border-accent",
  pending: "bg-background text-muted border-line",
  verified: "bg-accent-soft text-accent-strong border-accent/20",
};

const LABELS: Record<ChipStatus, string> = {
  queued: "Queued",
  generating: "Generating",
  building: "Building",
  retrying: "Retrying",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
  draft: "Draft",
  live: "Live",
  paid: "Paid",
  pending: "Pending",
  verified: "Verified",
};

export function StatusChip({ status, label }: { status: ChipStatus; label?: string }) {
  const t = useT();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status === "live" && <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />}
      {label ?? t(LABELS[status])}
    </span>
  );
}
