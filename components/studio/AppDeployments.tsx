"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Globe, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth/session";
import { useAgo, useT } from "@/lib/i18n";
import { projectIdSchema } from "@/app/api/chat/schemas/studio-api";
import { deploymentIsActive, deploymentLiveUrl, deploymentsResponseSchema, type StudioDeployment } from "@/lib/schemas/studio-deployment";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button, ButtonAnchor } from "@/components/ui/Button";
import { LogPanel } from "@/components/LogPanel";
import { CopyButton } from "@/components/CopyButton";
import { Spinner } from "@/components/Modal";
import { useStudioResource } from "@/hooks/use-studio-resource";

const readDeployments = async (response: Response) => deploymentsResponseSchema.parse(await response.json());
const readLogs = async (response: Response) => (await response.text()).split(/\r?\n/).filter(Boolean);

export function DeploysTab({ appId }: { appId: string }) {
  const t = useT();
  const userId = useSession()?.id;
  const realProject = projectIdSchema.safeParse(appId).success;
  const { data, loading, error, refresh } = useStudioResource(
    realProject ? `/api/deployments?appId=${encodeURIComponent(appId)}` : null,
    userId, readDeployments, 5_000,
  );

  if (!realProject) return <div className="p-5 text-sm text-muted">{t("Deployment history is available for apps created in Studio.")}</div>;
  if (!userId) return <div className="p-5 text-sm text-muted">{t("Sign in to view deployments.")}</div>;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><Globe size={20} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">{t("App URL")}</h2>
            {data?.url ? <a className="block truncate text-sm text-muted hover:underline" href={data.url} target="_blank" rel="noreferrer">{data.url}</a>
              : <p className="text-sm text-muted">{t("Your app URL appears after the first successful deployment.")}</p>}
          </div>
          {data?.url && <><CopyButton value={data.url} label={t("Copy link")} /><ButtonAnchor href={data.url} target="_blank" rel="noreferrer" variant="secondary" size="sm">{t("Open app")} <ExternalLink size={13} /></ButtonAnchor></>}
        </div>
        <p className="mt-3 text-xs text-muted">{t("Every chat message builds and deploys a new version. This link serves the latest successful version.")}</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface" aria-busy={loading}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold">{t("Deployments")}</h2>
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}><RefreshCw size={13} />{t("Refresh")}</Button>
        </div>
        {error && <div role="alert" className="border-b border-line p-5 text-sm text-danger">{t(error)} <Button variant="secondary" size="sm" onClick={refresh}>{t("Try again")}</Button></div>}
        {loading ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted" role="status"><Spinner />{t("Loading deployments…")}</div>
          : data?.jobs.length ? <ul className="divide-y divide-line">{[...data.jobs].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map(job => <DeployRow key={job.jobId} appId={appId} job={job} userId={userId} />)}</ul>
            : !error && <div className="p-8 text-center text-sm text-muted"><p className="font-medium text-ink">{t("No deployments yet")}</p><p className="mt-1">{t("Send a message in the chat to build and deploy your app.")}</p></div>}
      </section>
    </div>
  );
}

function DeployRow({ appId, job, userId }: { appId: string; job: StudioDeployment; userId: string }) {
  const t = useT();
  const ago = useAgo();
  const active = deploymentIsActive(job);
  const [open, setOpen] = useState(active);
  const { data: logs, error, refresh } = useStudioResource(
    open ? `/api/deployments?appId=${encodeURIComponent(appId)}&jobId=${encodeURIComponent(job.jobId)}` : null,
    userId, readLogs, active ? 3_000 : 0,
  );
  // Fetch final logs when an open deployment transitions out of its active state.
  const url = deploymentLiveUrl(job);
  const start = job.dokploy?.createdAt ?? job.createdAt;
  const duration = job.dokploy?.finishedAt ? Date.parse(job.dokploy.finishedAt) - Date.parse(start) : null;
  const status = job.status === "live" ? "Live" : job.status === "failed" ? "Failed" : job.status === "expired" ? "Expired" : active ? "Deploying" : job.status;

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <li>
        <CollapsibleTrigger asChild>
          <Button variant="unstyled" className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm hover:bg-background" aria-label={`${t("Deployment details")}: ${job.jobId}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${url ? "bg-accent" : job.status === "failed" ? "bg-danger" : active ? "bg-amber-400 live-dot" : "bg-muted"}`} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2"><span className="font-medium">{t(status)}</span>{job.current && url && <span className="rounded-full bg-accent-soft px-2 py-px text-[10px] font-medium text-accent">{t("Current")}</span>}</span>
              <span className="mt-1 block truncate font-mono text-xs text-muted">{job.jobId}</span>
              <span className="block text-xs text-muted">{ago(Date.parse(job.createdAt))}{duration !== null && duration >= 0 ? ` · ${(duration / 1000).toFixed(1)}s` : ""}</span>
            </span>
            <ChevronDown size={14} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t border-line bg-background px-5 py-4">
            {url && <div className="flex flex-wrap items-center gap-2"><a href={url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 break-all text-xs text-accent hover:underline">{url}<ExternalLink size={12} className="shrink-0" /></a><CopyButton value={url} label={t("Copy link")} /></div>}
            {job.status === "expired" && <p className="text-sm text-muted">{t("This version has expired. Send a chat message to deploy a new version.")}</p>}
            {job.dokploy && <dl className="grid gap-1 text-xs text-muted"><div><dt className="inline font-medium">Dokploy: </dt><dd className="inline">{job.dokploy.status}</dd></div><div><dt className="inline font-medium">{t("Deployment ID")}: </dt><dd className="inline break-all font-mono">{job.dokploy.deploymentId}</dd></div></dl>}
            {job.dokploy?.errorMessage && <p role="alert" className="whitespace-pre-wrap break-words text-sm text-danger">{job.dokploy.errorMessage}</p>}
            <h3 className="text-xs font-semibold">{t("Build logs")}</h3>
            {error && <div role="alert" className="text-sm text-danger">{t("Could not load deployment logs.")} <Button variant="secondary" size="sm" onClick={refresh}>{t("Try again")}</Button></div>}
            {logs === undefined ? !error && <p role="status" className="text-xs text-muted">{t("Loading logs…")}</p> : <LogPanel logs={logs} maxHeight={300} />}
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}
