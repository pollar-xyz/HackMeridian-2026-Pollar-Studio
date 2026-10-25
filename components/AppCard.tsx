"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import Link from "next/link";
import { Link2, Store } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { formatAmount } from "@/lib/mock/format";
import { useT } from "@/lib/i18n";
import type { AppStats } from "./studio/MarketplaceCard";
import { AppLogo } from "./studio/ListingArt";

export type AppState = "preview" | "testnet" | "mainnet";

// Where an app stands: a preview nobody can open yet, live with test money, or live with real money.
export function appState(app: App): AppState {
  if (app.status !== "published") return "preview";
  return app.network === "mainnet" ? "mainnet" : "testnet";
}

const STATE: Record<AppState, { label: string; dot: string }> = {
  preview: { label: "Preview", dot: "bg-muted/50" },
  testnet: { label: "Testnet", dot: "bg-amber-400" },
  mainnet: { label: "Mainnet", dot: "bg-emerald-500" },
};

// One row in My apps. Quiet by default: name and address, status, money, last change. The app name opens its detail view.
export function AppRow({
  app,
  stats,
  when,
}: {
  app: App;
  stats: AppStats;
  when: string;
}) {
  const t = useT();
  const state = appState(app);
  const live = state !== "preview";
  const sub = app.url.replace("https://", "").replace(".pollar.app", "");
  const address = live ? `${sub}.pollar.app` : `preview--${sub}.pollar.app`;
  const changes = live && app.previewSha !== app.publishedSha;
  const logo = app.listing?.logo ?? {
    color: app.themeColor ?? "#005db4",
    pattern: "none" as const,
  };

  return (
    <TableRow className="group">
      <TableCell>
        <Link href={`/studio/${app.id}`} className="block rounded-lg">
          <span className="flex min-w-0 items-center gap-3">
            <AppLogo app={app} art={logo} size={32} className="rounded-lg" />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">{app.name}</span>
                {app.listing && (
                  <Store
                    size={12}
                    className="shrink-0 text-muted"
                    aria-label={t("In marketplace")}
                  />
                )}
                {live && (app.shared?.length ?? 0) > 0 && (
                  <Link2
                    size={12}
                    className="shrink-0 text-muted"
                    aria-label={t("Shares data on Pollar")}
                  />
                )}
              </span>
              <span className="block truncate font-mono text-xs text-muted">
                {address}
              </span>
            </span>
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <span className="flex flex-col gap-0.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${STATE[state].dot}`} />
            {t(STATE[state].label)}
          </span>
          {changes && (
            <span className="text-warn">{t("Unpublished changes")}</span>
          )}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono text-xs tabular-nums">
        {stats.txCount > 0 ? (
          <>
            {formatAmount(stats.volume)}{" "}
            <span className="text-muted">{app.asset ?? "USDC"}</span>
          </>
        ) : (
          <span className="text-muted">-</span>
        )}
      </TableCell>
      <TableCell className="text-right text-xs text-muted">{when}</TableCell>
    </TableRow>
  );
}
