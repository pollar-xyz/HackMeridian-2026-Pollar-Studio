"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { App, Rating, Tx } from "@/lib/mock/types";
import { KIND_LABELS } from "@/lib/mock/types";

import { readLocal, writeLocal } from "@/lib/mock/local-state";
import { useT } from "@/lib/i18n";
import { buildSession, sessionKey } from "@/components/generated/context";
import { AppLogo, Banner } from "./ListingArt";
import { Stars, type RatingSummary } from "@/components/ui/Stars";
import { useStudioStore } from "@/lib/mock/store";
import { toast } from "@/components/Toast";

export interface AppStats {
  txCount: number;
  payments: number;
  volume: number;
  wallets: number;
  cashouts: number;
  countries: string[];
  lastTxAt: number | null;
  active: boolean; // a payment in the last 6 hours
}

export function appRating(
  app: App,
  ratings: Rating[],
  email?: string | null,
): RatingSummary {
  const own = ratings.filter((r) => r.appId === app.id);
  const mine = email
    ? (own.find((r) => r.email === email)?.stars ?? null)
    : null;
  return {
    avg: own.length ? own.reduce((sum, r) => sum + r.stars, 0) / own.length : 0,
    count: own.length,
    mine,
  };
}

// One number to rank the marketplace: rating first, then real money movement.
export function appScore(stats: AppStats, rating: RatingSummary): number {
  const confidence = Math.min(rating.count, 10) / 10;
  return (
    rating.avg * 20 * confidence +
    Math.log10(1 + stats.volume) * 10 +
    Math.min(stats.payments, 25)
  );
}

export function appStats(app: App, txs: Tx[]): AppStats {
  const own = txs.filter((t) => t.appSlug === app.slug);
  const counts = new Map<string, number>();
  for (const t of own) counts.set(t.country, (counts.get(t.country) ?? 0) + 1);
  const countries = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  const lastTxAt = own.length ? Math.max(...own.map((t) => t.at)) : null;
  const cashouts = own.filter((t) => t.type === "cashout").length;
  return {
    active: lastTxAt !== null && Date.now() - lastTxAt < 6 * 60 * 60 * 1000,
    txCount: own.length,
    payments: own.length - cashouts,
    volume: own.reduce((sum, t) => sum + t.amount, 0),
    wallets: new Set(own.map((t) => t.from)).size,
    cashouts,
    countries,
    lastTxAt,
  };
}

// A scaled down live frame of the generated app inside a phone shaped frame.
export function AppThumb({ app, height = 240 }: { app: App; height?: number }) {
  // Open a demo session for this app so the frame shows its real home screen instead of the login.
  useEffect(() => {
    if (!readLocal(sessionKey(app.slug)))
      writeLocal(sessionKey(app.slug), buildSession(app.slug));
  }, [app.slug]);
  const scale = 0.55;
  const width = Math.round(390 * scale);
  return (
    <div
      className="flex justify-center overflow-hidden bg-background pt-5"
      style={{ height }}
    >
      <div
        className="relative shrink-0 border border-b-0 border-line bg-surface shadow-sm"
        style={{
          width,
          height: height - 20,
          borderRadius: "18px 18px 0 0",
          clipPath: "inset(0 round 18px 18px 0 0)",
        }}
      >
        <iframe
          title={`${app.name} thumbnail`}
          src={`/preview/${app.slug}`}
          tabIndex={-1}
          loading="lazy"
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{
            width: 390,
            height: Math.ceil((height - 20) / scale),
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

// One app in the marketplace: what it is, how much it moved, try it.
export function MarketplaceCard({
  app,
  stats,
  rating,
}: {
  app: App;
  stats: AppStats;
  rating: RatingSummary;
}) {
  const t = useT();
  const rateApp = useStudioStore((s) => s.rateApp);
  const myEmail = useStudioStore((s) => s.account?.email);
  const mine = !!app.maker && app.maker.email === myEmail;
  const makerName = app.maker?.name ?? "Pollar maker";
  const listing = app.listing ?? {
    tagline: app.prompt,
    logo: { color: "#005db4", pattern: "none" as const },
    banner: { color: "#005db4", pattern: "dots" as const },
    listedAt: app.createdAt,
  };

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* The whole card opens the app; inner controls sit above this link. */}
      <a
        href={`/preview/${app.slug}`}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 z-0"
        aria-label={t("Open {name}", { name: app.name })}
      />

      <div className="pointer-events-none relative">
        <Banner app={app} art={listing.banner} height={112} />
        <Badge className="absolute right-3 top-3 border-white/10 bg-ink/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
          {stats.active && (
            <span className="live-dot mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white align-middle" />
          )}
          {t(KIND_LABELS[app.kind])}
        </Badge>
      </div>

      <div className="pointer-events-none relative flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="flex items-end justify-between gap-3">
          <AppLogo
            app={app}
            art={listing.logo}
            size={56}
            className="relative z-10 -mt-7 border-4 border-surface"
          />
          <span className="pointer-events-auto relative z-10">
            <Stars
              value={rating.avg}
              count={rating.count}
              mine={rating.mine}
              size={14}
              label={t("Rate this app")}
              newLabel={t("New, rate it")}
              onRate={(stars) => {
                rateApp(app.id, stars);
                toast(
                  t("Thanks, you rated {name} {n} stars", {
                    name: app.name,
                    n: stars,
                  }),
                );
              }}
            />
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold transition-colors group-hover:text-accent">
            {app.name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted">{listing.tagline}</p>
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-line pt-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            {makerName.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {makerName}
          </span>
          {mine && (
            <Link
              href={`/studio/${app.id}`}
              className="pointer-events-auto relative z-10 shrink-0 text-xs font-semibold text-accent hover:underline"
            >
              {t("Yours")}
            </Link>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors group-hover:bg-accent-strong">
            {t("Open")} <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Card>
  );
}
