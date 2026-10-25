"use client";

import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { JOB_STEPS, stepIndex } from "@/lib/mock/jobs";
import type { JobStatus } from "@/lib/mock/types";
import { Spinner } from "./Modal";
import { useT } from "@/lib/i18n";

// Build progress as one segmented bar plus the current step in words.
// Only one label is shown at a time, so it never overlaps in narrow panes or longer languages.
export function JobStepper({
  status,
  attempt,
}: {
  status: JobStatus;
  attempt: number;
}) {
  const t = useT();
  const total = JOB_STEPS.length;
  const done = status === "published";
  const failed = status === "failed";
  const retrying = status === "retrying";
  // "retrying" is not a step of its own, it is a second try of Building.
  const current = done
    ? total - 1
    : retrying
      ? JOB_STEPS.findIndex((s) => s.key === "building")
      : Math.max(0, stepIndex(status));
  const step = JOB_STEPS[current];

  const label = failed
    ? t("Build failed")
    : done
      ? t(step.label)
      : `${t(step.label)}${step.key === "building" && attempt > 1 ? ` (${t("try {n}", { n: attempt })})` : ""}`;

  return (
    <div
      className="flex w-full flex-col gap-2.5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            failed
              ? "bg-danger-soft text-danger"
              : done
                ? "bg-accent text-white"
                : ""
          }`}
        >
          {failed ? (
            <X size={12} />
          ) : done ? (
            <Check size={12} />
          ) : (
            <Spinner className="h-4 w-4" />
          )}
        </span>
        <span
          className={`min-w-0 flex-1 truncate font-medium ${failed ? "text-danger" : retrying ? "text-warn" : ""}`}
        >
          {label}
        </span>
        {!failed && (
          <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
            {t("{n} of {total}", { n: current + 1, total })}
          </span>
        )}
      </div>

      <Progress
        value={done ? 100 : ((current + (failed ? 0 : 0.5)) / total) * 100}
        aria-label={label}
        indicatorClassName={
          failed ? "bg-danger" : retrying ? "bg-warn" : undefined
        }
      />
    </div>
  );
}
