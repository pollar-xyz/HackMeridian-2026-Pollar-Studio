import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { KIND_LABELS } from "@/lib/mock/types";
import { AppLogo, Banner } from "./ListingArt";
import type { RatingSummary } from "@/lib/mock/stats";
import type { AppStats } from "@/lib/mock/stats";
import { RatingControl } from "./RatingControl";
import { MOCK_ACCOUNT } from "@/lib/mock/data";
import { getT } from "@/lib/i18n/translate";
export { appStats, appRating, appScore } from "@/lib/mock/stats";
export type { AppStats } from "@/lib/mock/stats";

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
  const t = getT("en");
  const myEmail = MOCK_ACCOUNT.email;
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
            <RatingControl
              value={rating.avg}
              count={rating.count}
              mine={rating.mine}
              appId={app.id}
              appName={app.name}
              labels={{ rate: t("Rate this app"), new: t("New, rate it"), thanks: t("Thanks, you rated {name} {n} stars", { name: app.name, n: "{n}" }) }}
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
