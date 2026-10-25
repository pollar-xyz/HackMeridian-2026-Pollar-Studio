"use client";

import { useMemo, type ReactNode } from "react";
import { JobStepper } from "@/components/JobStepper";
import { LogPanel } from "@/components/LogPanel";
import { Button } from "@/components/ui/Button";
import { useStudioChat } from "@/hooks/use-studio-chat";
import { generationStep } from "@/lib/ai/generation-step";
import { useT } from "@/lib/i18n";

export function GenerationPreview({ appId, children }: { appId: string; children: ReactNode }) {
  const { status, progress, jobId, logText = "", error, retry } = useStudioChat(appId);
  const t = useT();
  const logs = useMemo(() => logText.split(/\r?\n/).filter(Boolean), [logText]);
  const active = status !== "idle";
  if (!active && !error && progress !== "failed") return children;
  const step = error ? "failed" : generationStep(progress, logText);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5" aria-busy={active}>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <JobStepper status={step} attempt={1} />
      </div>
      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-3 px-1">
          <h2 className="text-sm font-medium">{t("Generation logs")}</h2>
          {jobId && <span className="truncate font-mono text-[11px] text-muted" title={jobId}>{jobId}</span>}
        </div>
        <LogPanel logs={logs} maxHeight={420} />
      </section>
      {error && <div role="alert" className="rounded-xl border border-danger/25 p-3 text-sm">
        <p>{t(error)}</p>
        <Button variant="unstyled" type="button" disabled={active} onClick={retry} className="mt-2 text-accent disabled:opacity-40">{t("Try again")}</Button>
      </div>}
    </div>
  );
}
