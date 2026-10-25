"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, FileText, Folder, GitBranch, GitCommitHorizontal, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import type { App, Job } from "@/lib/mock/types";
import { useStudioStore } from "@/lib/mock/store";
import { isTerminal } from "@/lib/mock/jobs";
import { useAgo, useT } from "@/lib/i18n";
import { formatDuration } from "@/lib/mock/format";
import { JobStepper } from "@/components/JobStepper";
import { LogPanel } from "@/components/LogPanel";
import { CopyButton } from "@/components/CopyButton";
import { Modal, Spinner } from "@/components/Modal";
import { toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

const REPO_TREE: Array<{
  name: string;
  dir?: boolean;
  depth: number;
  note?: string;
}> = [
  { name: "AGENTS.md", depth: 0, note: "Rules for your AI" },
  { name: "app", dir: true, depth: 0, note: "Screens" },
  { name: "components", dir: true, depth: 0, note: "UI pieces" },
  { name: "contracts", dir: true, depth: 0, note: "Payment contract" },
  { name: "lib", dir: true, depth: 0 },
  { name: "pollar.ts", depth: 1, note: "Pollar SDK setup" },
  { name: ".env.example", depth: 0 },
  { name: "package.json", depth: 0 },
];

function shortSha(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

const TRIGGER_LABEL = {
  prompt: "Prompt",
  push: "GitHub",
  manual: "Manual",
  chat: "Chat",
} as const;

export function DeploysTab({ app, jobs }: { app: App; jobs: Job[] }) {
  const t = useT();
  const exportToGithub = useStudioStore((s) => s.exportToGithub);
  const simulatePush = useStudioStore((s) => s.simulatePush);
  const rebuildApp = useStudioStore((s) => s.rebuildApp);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [showTree, setShowTree] = useState(false);
  const activeJob = jobs.find((j) => !isTerminal(j.status));
  const repoPath = app.github?.repoUrl.replace("https://github.com/", "");

  const connect = () => {
    setConnecting(true);
    setTimeout(() => {
      exportToGithub(app.id);
      setConnecting(false);
      toast(t("Repository created"));
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface p-5">
        {!app.github ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
              <GitBranch size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t("Connect GitHub")}</p>
              <p className="text-sm text-muted">
                {t(
                  "We create a repo with the full code. Every push to main redeploys to the same link.",
                )}
              </p>
            </div>
            <Button variant="ink" onClick={connect}>
              {t("Export to GitHub")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                <GitBranch size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={app.github.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 truncate font-mono text-sm font-semibold hover:underline"
                >
                  {repoPath} <ExternalLink size={12} className="text-muted" />
                </a>
                <p className="flex items-center gap-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 font-mono">
                    <GitBranch size={11} /> main
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />{" "}
                    {t("Auto deploy on push")}
                  </span>
                </p>
              </div>
              <CopyButton
                value={`git clone ${app.github.repoUrl}.git`}
                label={t("Copy clone command")}
              />
            </div>

            <form
              className="flex flex-col gap-2 rounded-xl bg-background p-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (activeJob) return;
                simulatePush(app.id, message);
                setMessage("");
              }}
            >
              <GitCommitHorizontal
                size={16}
                className="hidden shrink-0 text-muted sm:block"
              />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t(
                  "Commit message, for example: change the hero text",
                )}
                className={`${inputClass} flex-1 bg-surface py-2 text-sm`}
              />
              <Button type="submit" disabled={!!activeJob}>
                {t("Simulate push to main")}
              </Button>
            </form>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-sm font-semibold">{t("Deployments")}</h3>
          {jobs[0]?.status === "failed" && !activeJob && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => rebuildApp(app.id, "manual")}
            >
              <RefreshCw size={12} /> {t("Rebuild")}
            </Button>
          )}
        </div>
        <ul className="divide-y divide-line">
          {jobs.map((job) => (
            <DeployRow
              key={job.id}
              job={job}
              live={!!app.publishedSha && job.commit?.sha === app.publishedSha}
              preview={
                job.commit?.sha === app.previewSha &&
                app.previewSha !== app.publishedSha
              }
            />
          ))}
        </ul>
      </section>

      <Collapsible asChild open={showTree} onOpenChange={setShowTree}>
        <section className="rounded-2xl border border-line bg-surface">
          <CollapsibleTrigger asChild>
            <Button
              variant="unstyled"
              type="button"
              className="flex w-full items-center justify-between px-5 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {t("What is in the repo")}
                </span>
                <span className="block text-xs text-muted">
                  {t(
                    "AGENTS.md carries the template rules so your own AI keeps building the same way.",
                  )}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted transition-transform ${showTree ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="border-t border-line px-5 py-3 font-mono text-sm">
              {REPO_TREE.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center gap-2 py-1"
                  style={{ paddingLeft: f.depth * 20 }}
                >
                  {f.dir ? (
                    <Folder size={14} className="text-accent" />
                  ) : (
                    <FileText size={14} className="text-muted" />
                  )}
                  <span>{f.name}</span>
                  {f.note && (
                    <span className="ml-auto font-sans text-xs text-muted">
                      {t(f.note)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </section>
      </Collapsible>

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

function DeployRow({
  job,
  live,
  preview,
}: {
  job: Job;
  live: boolean;
  preview: boolean;
}) {
  const t = useT();
  const ago = useAgo();
  const [open, setOpen] = useState(!isTerminal(job.status));
  const duration = job.finishedAt ? job.finishedAt - job.startedAt : null;
  const dot =
    job.status === "published"
      ? "bg-[#28c840]"
      : job.status === "failed"
        ? "bg-danger"
        : "bg-amber-400 live-dot";
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <li>
        <CollapsibleTrigger asChild>
          <Button
            variant="unstyled"
            type="button"
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-background"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {job.commit?.message ??
                    (job.trigger === "prompt"
                      ? t("Initial generation from your prompt")
                      : t(TRIGGER_LABEL[job.trigger]))}
                </span>
                {live && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-medium text-accent">
                    {t("Live")}
                  </span>
                )}
                {preview && (
                  <span className="shrink-0 rounded-full bg-warn-soft px-1.5 py-px text-[10px] font-medium text-warn">
                    {t("Preview")}
                  </span>
                )}
              </span>
              <span className="block truncate text-xs text-muted">
                <span className="font-mono">
                  {job.commit?.sha ?? shortSha(job.id)}
                </span>{" "}
                · {t(TRIGGER_LABEL[job.trigger])} · {ago(job.startedAt)}
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted">
              {duration !== null ? formatDuration(duration) : t("running")}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t border-line bg-background px-5 py-4">
            <JobStepper status={job.status} attempt={job.attempt} />
            <LogPanel logs={job.logs} maxHeight={220} />
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

// The values the app runs with, as a .env you can copy into your own repo.
