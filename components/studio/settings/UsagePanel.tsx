"use client";

import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useStudioStore, GENERATION_LIMIT } from "@/lib/mock/store";
import { useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { useStudioAccount } from "@/components/StudioGate";
import { StatTile } from "@/components/ui/StatTile";

export function UsagePanel() {
  const account = useStudioAccount();
  const t = useT();
  const ledger = useStudioStore((s) => s.ledger);
  const apps = useStudioStore((s) => s.apps);
  const jobs = useStudioStore((s) => s.jobs);

  if (!account) return null;
  const spent = ledger.filter((e) => e.amount > 0);
  const total = spent.reduce((sum, e) => sum + e.amount, 0);
  const byApp = apps
    .map((app) => ({
      app,
      credits: spent
        .filter((e) => e.appId === app.id)
        .reduce((sum, e) => sum + e.amount, 0),
      builds: jobs.filter((j) => j.appId === app.id).length,
    }))
    .filter((row) => row.credits > 0 || row.builds > 0)
    .sort((a, b) => b.credits - a.credits);
  const max = Math.max(1, ...byApp.map((r) => r.credits));
  const freePlan = (account.plan ?? "free") === "free";

  return (
    <PanelHeader
      title={t("Usage")}
      description={t("Where your credits went, app by app.")}
    >
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-3">
          <StatTile label={t("Credits spent")} value={total} />
          <StatTile
            label={t("Builds")}
            value={jobs.filter((j) => !j.id.startsWith("job_seed")).length}
          />
          <StatTile
            label={t("Generations")}
            value={
              freePlan
                ? `${account.generationsUsed} / ${GENERATION_LIMIT}`
                : account.generationsUsed
            }
          />
        </dl>

        <div className="rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-3 text-sm font-medium">
            {t("By app")}
          </div>
          {byApp.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              {t("Nothing spent yet. Generate your first app from Home.")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {byApp.map(({ app, credits, builds }) => (
                <li
                  key={app.id}
                  className="flex flex-col gap-2 px-5 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/studio/${app.id}`}
                      className="min-w-0 truncate font-medium hover:underline"
                    >
                      {app.name}
                    </Link>
                    <span className="shrink-0 text-xs text-muted">
                      {t("{n} builds", { n: builds })} ·{" "}
                      <span className="tabular-nums text-foreground">
                        {t("{n} credits", { n: credits })}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={(credits / max) * 100}
                    aria-label="Credits used"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-background"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PanelHeader>
  );
}
