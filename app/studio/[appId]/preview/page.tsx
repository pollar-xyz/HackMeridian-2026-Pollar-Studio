import { Suspense } from "react";
import { getT } from "@/lib/i18n/translate";
import { getWorkspaceMockApp, getWorkspaceMockJobs } from "@/lib/mock/workspace";
import { isTerminal } from "@/lib/mock/jobs";
import { JobStepper } from "@/components/JobStepper";
import { LogPanel } from "@/components/LogPanel";
import { IntegrationList } from "@/components/studio/JobView";
import { PreviewFrame } from "@/components/studio/PreviewFrame";
import { MockGeneration } from "@/components/studio/MockGeneration";
import { GenerationPreview } from "@/components/studio/GenerationPreview";

export default function PreviewPage({ params, searchParams }: { params: Promise<{ appId: string }>; searchParams: Promise<{ generate?: string }> }) {
  return <Suspense fallback={<div className="min-h-96 flex-1 animate-pulse bg-surface" aria-busy="true" />}><PreviewContent params={params} searchParams={searchParams} /></Suspense>;
}

async function PreviewContent({ params, searchParams }: { params: Promise<{ appId: string }>; searchParams: Promise<{ generate?: string }> }) {
  const [{ appId }, query] = await Promise.all([params, searchParams]);
  const app = getWorkspaceMockApp(appId);
  const t = getT("en");
  if (!app) return null;
  if (query.generate === "1") return <MockGeneration app={app} />;
  const jobs = getWorkspaceMockJobs(app);
  const job = jobs[0];

  if (!app.previewSha) {
    if (job && !isTerminal(job.status)) {
      return <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="flex min-w-0 flex-col gap-4"><div className="rounded-2xl border border-line bg-surface p-4"><JobStepper status={job.status} attempt={job.attempt} /></div><LogPanel logs={job.logs} maxHeight={420} /></div><IntegrationList job={job} /></div>;
    }
    return <p className="m-5 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">{t("The preview appears once the first build finishes.")}</p>;
  }
  return <GenerationPreview appId={appId}><PreviewFrame app={app} /></GenerationPreview>;
}
