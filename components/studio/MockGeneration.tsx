"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { App, JobStatus } from "@/lib/mock/types";
import { JobStepper } from "@/components/JobStepper";
import { LogPanel } from "@/components/LogPanel";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { getT } from "@/lib/i18n/translate";

const DURATION = 7_000;
const EVENTS: Array<{ at: number; line: string; status?: JobStatus }> = [
  { at: 0, line: "Job queued", status: "queued" },
  { at: 600, line: "Reading prompt", status: "generating" },
  { at: 1_300, line: "Picking app template" },
  { at: 2_100, line: "Generating app screens and components" },
  { at: 3_100, line: "Wiring passkey login, wallet and payments", status: "building" },
  { at: 3_800, line: "Installing dependencies" },
  { at: 4_600, line: "Checking the build" },
  { at: 5_300, line: "Preparing the Stellar contract", status: "publishing" },
  { at: 6_100, line: "Setting up the preview link" },
  { at: DURATION, line: "Preview ready for review", status: "published" },
];

export function MockGeneration({ app }: { app: App }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const t = getT("en");

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(Date.now() - startedAt, DURATION);
      setElapsed(next);
      if (next >= DURATION) window.clearInterval(timer);
    }, 150);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsed >= DURATION) router.replace(`/studio/${app.id}/preview`, { scroll: false });
  }, [app.id, elapsed, router]);

  const status = EVENTS.reduce<JobStatus>((current, event) => event.at <= elapsed && event.status ? event.status : current, "queued");
  const logs = EVENTS.filter((event) => event.at <= elapsed).map((event) => `${(event.at / 1000).toFixed(1)}s ${event.line}`);
  if (status === "published") return <PreviewFrame app={app} />;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-line bg-surface p-4"><JobStepper status={status} attempt={1} /></div>
        <LogPanel logs={logs} maxHeight={420} />
      </section>
      <aside className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">{t("What Pollar is wiring in")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("The plumbing comes with the template. The agent only writes your screens.")}</p>
        <p className="mt-4 text-xs text-muted">{app.name}</p>
      </aside>
    </div>
  );
}
