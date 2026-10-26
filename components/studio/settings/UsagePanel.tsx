"use client";

import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { StatTile } from "@/components/ui/StatTile";
import { useStudioCredits } from "@/hooks/use-studio-credits";

export function UsagePanel() {
  const t = useT();
  const { credits, error, loading } = useStudioCredits();
  const apps = credits?.apps.filter((row) => row.credits > 0 || row.builds > 0) ?? [];
  const max = Math.max(1, ...apps.map((r) => r.credits));

  return (
    <PanelHeader
      title={t("Usage")}
      description={t("Where your credits went, app by app.")}
    >
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-background" aria-busy="true" />
        : error || !credits ? <p role="alert" className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">{t(error ?? "Could not load your credits.")}</p>
        : <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-3 gap-3">
          <StatTile label={t("Credits spent")} value={credits.spent} />
          <StatTile label={t("Builds")} value={credits.builds} />
          <StatTile label={t("Apps")} value={`${credits.newApps.used} / ${credits.newApps.limit}`} />
        </dl>
        <p className="text-xs text-muted">{t("Each message costs credits for the AI work it takes: reading your app and writing the changes. Answers without a build cost less.")}</p>

        <div className="rounded-2xl border border-line bg-surface">
          <div className="border-b border-line px-5 py-3 text-sm font-medium">
            {t("By app")}
          </div>
          {apps.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              {t("Nothing spent yet. Generate your first app from Home.")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {apps.map(({ appId, name, credits: spent, builds }) => (
                <li
                  key={appId}
                  className="flex flex-col gap-2 px-5 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/studio/${appId}`}
                      className="min-w-0 truncate font-medium hover:underline"
                    >
                      {name}
                    </Link>
                    <span className="shrink-0 text-xs text-muted">
                      {t("{n} builds", { n: builds })} ·{" "}
                      <span className="tabular-nums text-foreground">
                        {t("{n} credits", { n: spent })}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={(spent / max) * 100}
                    aria-label={t("Credits used")}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-background"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>}
    </PanelHeader>
  );
}
