"use client";

import { useState } from "react";
import Image from "next/image";
import { Coins, LayoutGrid, Search, Star } from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import { useT } from "@/lib/i18n";
import { KIND_LABELS, type AppKind } from "@/lib/mock/types";
import { useStudioAccount, StudioLoading } from "@/components/StudioGate";
import { MarketplaceCard, appStats, appRating, appScore } from "@/components/studio/MarketplaceCard";
import { formatAmount } from "@/lib/mock/format";
import { Segmented } from "@/components/ui/Segmented";
import hero from "@/public/brand/hero.jpg";

type Sort = "top" | "active" | "newest";

export default function MarketplacePage() {
  const account = useStudioAccount();
  const t = useT();
  const apps = useStudioStore((s) => s.apps);
  const txs = useStudioStore((s) => s.txs);
  const ratings = useStudioStore((s) => s.ratings);
  const [sort, setSort] = useState<Sort>("top");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AppKind | "all">("all");

  if (!account) return <StudioLoading />;

  const listed = apps
    .filter((a) => a.status === "published" && a.network === "mainnet" && a.listing)
    .map((app) => {
      const stats = appStats(app, txs);
      const rating = appRating(app, ratings, account.email);
      return { app, stats, rating, score: appScore(stats, rating) };
    });

  const q = query.trim().toLowerCase();
  const filtered = listed.filter(
    (r) =>
      (kind === "all" || r.app.kind === kind) &&
      (!q || [r.app.name, r.app.listing?.tagline ?? "", r.app.maker?.name ?? ""].some((v) => v.toLowerCase().includes(q))),
  );
  const searching = q.length > 0 || kind !== "all";

  const byScore = [...filtered].sort((a, b) => b.score - a.score);
  const featured = !searching && filtered.length >= 4 ? byScore.slice(0, 3) : [];
  const featuredIds = new Set(featured.map((r) => r.app.id));
  const rest = filtered
    .filter((r) => !featuredIds.has(r.app.id))
    .sort((a, b) =>
      sort === "top" ? b.score - a.score : sort === "active" ? b.stats.txCount - a.stats.txCount : b.app.createdAt - a.app.createdAt,
    );

  const listedSlugs = new Set(listed.map((r) => r.app.slug));
  const volume = txs.filter((tx) => listedSlugs.has(tx.appSlug)).reduce((sum, tx) => sum + tx.amount, 0);
  const listedIds = new Set(listed.map((r) => r.app.id));
  const votes = ratings.filter((r) => listedIds.has(r.appId)).length;
  const kinds = Array.from(new Set(listed.map((r) => r.app.kind)));

  const stats = [
    { Icon: LayoutGrid, value: String(listed.length), label: t("apps") },
    { Icon: Coins, value: formatAmount(volume), label: t("stablecoins moved") },
    { Icon: Star, value: String(votes), label: t("ratings") },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative isolate overflow-hidden px-4 pb-8 pt-10 text-white sm:px-6 lg:px-8">
        <Image src={hero} alt="" fill placeholder="blur" sizes="100vw" className="-z-20 object-cover object-[50%_45%]" />
        <div className="absolute inset-0 -z-10 bg-[#0b1a33]/55" aria-hidden />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/75">{t("Built during the event")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{t("Marketplace")}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              {t("Real apps on Stellar. Open one, sign in with a passkey and pay, then rate it.")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {stats.map(({ Icon, value, label }) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur-sm">
                <Icon size={14} className="text-white/80" />
                <span className="font-semibold tabular-nums">{value}</span>
                <span className="text-white/80">{label}</span>
              </span>
            ))}
          </div>

          <label className="flex max-w-xl items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-foreground shadow-sm">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search apps, makers or what they do")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted focus-visible:outline-none"
            />
          </label>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", ...kinds] as Array<AppKind | "all">).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  kind === k ? "border-accent bg-accent text-white" : "border-line bg-surface text-muted hover:text-foreground"
                }`}
              >
                {k === "all" ? t("All") : t(KIND_LABELS[k])}
              </button>
            ))}
          </div>
          <Segmented<Sort>
            value={sort}
            onChange={setSort}
            options={[
              { value: "top", label: t("Top rated") },
              { value: "active", label: t("Most active") },
              { value: "newest", label: t("Newest") },
            ]}
          />
        </div>

        {featured.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{t("Featured this event")}</h2>
              <span className="text-xs text-muted">{t("Best rated and most used, updated live")}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((r) => (
                <MarketplaceCard key={r.app.id} app={r.app} stats={r.stats} rating={r.rating} />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          {featured.length > 0 && <h2 className="text-base font-semibold">{t("All apps")}</h2>}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
              {searching ? t("No apps match that search") : t("No apps published yet")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((r) => (
                <MarketplaceCard key={r.app.id} app={r.app} stats={r.stats} rating={r.rating} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
