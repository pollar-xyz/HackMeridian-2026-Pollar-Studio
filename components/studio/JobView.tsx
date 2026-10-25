"use client";

import { useState } from "react";
import { Check, ExternalLink, GitBranch, RefreshCw } from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import type { App, Job } from "@/lib/mock/types";
import { isTerminal } from "@/lib/mock/jobs";
import { useT } from "@/lib/i18n";
import { JobStepper } from "@/components/JobStepper";
import { LogPanel } from "@/components/LogPanel";
import { StatusChip } from "@/components/StatusChip";
import { CopyButton } from "@/components/CopyButton";
import { Modal, Spinner } from "@/components/Modal";
import { toast } from "@/components/Toast";
import { Button, buttonClass } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { BuiltWith } from "@/components/studio/BuiltWith";

// What Pollar wires into every app. Each item lights up when its log line shows up.
const INTEGRATIONS: Array<{ key: string; label: string; detail: string; match: string }> = [
  { key: "template", label: "Screens from your prompt", detail: "App and components generated", match: "Generating app/" },
  { key: "sdk", label: "Passkey login and wallet", detail: "Pollar SDK wired in", match: "Wiring Pollar SDK" },
  { key: "build", label: "Type checked build", detail: "tsc and pnpm build", match: "pnpm build" },
  { key: "contract", label: "Payment contract", detail: "Deployed on Stellar", match: "Contract live" },
  { key: "sponsor", label: "Sponsored fees", detail: "Users never pay network fees", match: "Sponsor wallet funded" },
  { key: "rails", label: "Stablecoin rails", detail: "QR, Pix and bank transfer", match: "Stablecoin rails enabled" },
  { key: "kyc", label: "Identity checks", detail: "For cashouts to bank accounts", match: "Identity checks connected" },
  { key: "url", label: "Public URL", detail: "Your own pollar.app link", match: "Registered in apps.json" },
];

export function JobView({ appId, onReset, onDetails }: { appId: string; onReset: () => void; onDetails: () => void }) {
  const t = useT();
  const app = useStudioStore((s) => s.apps.find((a) => a.id === appId));
  const job = useStudioStore((s) => {
    const list = s.jobs.filter((j) => j.appId === appId);
    return list[list.length - 1];
  });

  if (!app || !job) return null;
  const published = job.status === "published";
  const failed = job.status === "failed";
  const running = !isTerminal(job.status);
  const retrying = job.status === "retrying" || job.attempt > 1;
  const lastError = [...job.logs].reverse().find((l) => l.includes(" error: "));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">{running ? t("Building your app") : published ? t("Your app is live") : t("Build failed")}</p>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{app.name}</h1>
          <p className="truncate font-mono text-xs text-muted">{app.slug}.pollar.app</p>
        </div>
        <StatusChip status={job.status} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <JobStepper status={job.status} attempt={job.attempt} />
          </div>

          {retrying && running && (
            <Notice>
              {lastError && <span className="block font-mono text-xs text-danger">{lastError.split(" error: ")[1]}</span>}
              <span className="font-medium">{t("Retrying (attempt {n} of 3)", { n: Math.max(job.attempt, 2) })}</span>
            </Notice>
          )}

          <LogPanel logs={job.logs} maxHeight={published ? 260 : 420} />

          {published && <PublishedPanel app={app} onReset={onReset} onDetails={onDetails} />}
          {failed && <FailedPanel app={app} onReset={onReset} />}
        </div>

        <aside className="flex flex-col gap-4">{published ? <LivePreview app={app} /> : <IntegrationList job={job} />}</aside>
      </div>

      {published && <BuiltWith app={app} />}
    </div>
  );
}

export function IntegrationList({ job }: { job: Job }) {
  const t = useT();
  const done = INTEGRATIONS.map((i) => job.logs.some((l) => l.includes(i.match)));
  const nextIndex = done.findIndex((d) => !d);
  const running = !isTerminal(job.status);
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">{t("What Pollar is wiring in")}</h2>
      <p className="mt-0.5 text-xs text-muted">{t("The plumbing comes with the template. The agent only writes your screens.")}</p>
      <ol className="mt-4 flex flex-col gap-3">
        {INTEGRATIONS.map((item, i) => {
          const isDone = done[i];
          const isNext = running && i === nextIndex;
          return (
            <li key={item.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                  isDone ? "border-accent bg-accent text-white" : isNext ? "border-accent bg-accent-soft" : "border-line bg-background text-muted"
                }`}
              >
                {isDone ? <Check size={12} /> : isNext ? <Spinner className="h-3 w-3" /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-sm ${isDone || isNext ? "font-medium text-foreground" : "text-muted"}`}>{t(item.label)}</p>
                <p className="text-xs text-muted">{t(item.detail)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LivePreview({ app }: { app: App }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("Live preview")}</h2>
        <StatusChip status="live" />
      </div>
      <div className="mx-auto overflow-hidden rounded-xl border border-line bg-background" style={{ width: 300, height: 540 }}>
        <iframe title={`${app.name} preview`} src={`/preview/${app.slug}`} className="origin-top-left" style={{ width: 390, height: 702, transform: "scale(0.769)" }} />
      </div>
      <p className="text-center text-xs text-muted">{t("This is the real app. Sign in with the passkey and make a payment.")}</p>
    </div>
  );
}

function PublishedPanel({ app, onReset, onDetails }: { app: App; onReset: () => void; onDetails: () => void }) {
  const t = useT();
  const exportToGithub = useStudioStore((s) => s.exportToGithub);
  const [connecting, setConnecting] = useState(false);

  const connect = () => {
    setConnecting(true);
    setTimeout(() => {
      exportToGithub(app.id);
      setConnecting(false);
      toast(t("Repository created"));
    }, 1200);
  };

  return (
    <div className="rise flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-accent-strong">{t("Published")}</p>
          <p className="truncate font-mono text-lg font-semibold">{app.url}</p>
          <p className="text-xs text-muted">{t("Passkey login, wallet, stablecoin payments and bank cashout are live for your users.")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a href={`/preview/${app.slug}`} target="_blank" rel="noreferrer" className={buttonClass("primary")}>
            {t("Open app")} <ExternalLink size={14} />
          </a>
          <Button variant="secondary" onClick={onDetails}>
            {t("Details")}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t("Keep building with your own tools")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("Export the code to GitHub. You own it. Open it in Cursor, Claude Code or any editor. Every push to main rebuilds and redeploys to the same link, with the Pollar plumbing untouched.")}
        </p>
        {!app.github ? (
          <Button variant="ink" className="mt-4" onClick={connect}>
            <GitBranch size={16} /> {t("Export to GitHub")}
          </Button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all rounded-md bg-background px-2 py-1 font-mono text-sm">{app.github.repoUrl}</code>
              <CopyButton value={app.github.repoUrl} />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-ink p-3 font-mono text-xs leading-6 text-stone-200">{`git clone ${app.github.repoUrl}.git
cd ${app.slug}
pnpm install && pnpm dev   # AGENTS.md tells your AI how the template works
git push origin main       # redeploys to ${app.slug}.pollar.app`}</pre>
            <button type="button" onClick={onDetails} className="self-start text-sm font-medium text-accent hover:underline">
              {t("Simulate a push from the Export tab")}
            </button>
          </div>
        )}
      </div>

      <button type="button" onClick={onReset} className="self-start text-sm font-medium text-accent hover:underline">
        {t("Start another app")}
      </button>

      <Modal open={connecting}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <GitBranch size={28} />
          <p className="text-sm font-medium">{t("Connecting to GitHub")}</p>
          <Spinner />
        </div>
      </Modal>
    </div>
  );
}

function FailedPanel({ app, onReset }: { app: App; onReset: () => void }) {
  const t = useT();
  const rebuildApp = useStudioStore((s) => s.rebuildApp);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft p-6 text-center">
      <p className="text-sm font-medium text-danger">{t("The build failed")}</p>
      <p className="text-xs text-muted">{t("Retry the build. Credits are only charged for the steps that run.")}</p>
      <div className="flex gap-2">
        <Button variant="ink" onClick={() => rebuildApp(app.id, "manual")}>
          <RefreshCw size={14} /> {t("Rebuild")}
        </Button>
        <Button variant="secondary" onClick={onReset}>
          {t("Start another app")}
        </Button>
      </div>
    </div>
  );
}
