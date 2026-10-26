import Link from "next/link";
import { PublishedApps } from "@/components/studio/PublishedApps";
import { Suspense } from "react";
import Image from "next/image";
import { Coins, LayoutGrid, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MarketplaceCard } from "@/components/studio/MarketplaceCard";
import { appStats, appRating, appScore } from "@/lib/mock/stats";
import { MOCK_ACCOUNT, MOCK_DATA } from "@/lib/mock/data";
import { KIND_LABELS, type AppKind } from "@/lib/mock/types";
import { formatAmount } from "@/lib/mock/format";
import { getT } from "@/lib/i18n/translate";
import hero from "@/public/brand/hero.jpg";

type Sort = "top" | "active" | "newest";
type SearchParams = Promise<{ q?: string; kind?: string; sort?: string }>;

export default function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true" />}><MarketplaceContent searchParams={searchParams} /></Suspense>;
}

async function MarketplaceContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const t = getT("en");
  const sort: Sort = ["top", "active", "newest"].includes(params.sort ?? "") ? params.sort as Sort : "top";
  const kind = params.kind && params.kind in KIND_LABELS ? params.kind as AppKind : "all";
  const query = params.q?.trim().toLowerCase() ?? "";
  const listed = MOCK_DATA.apps.filter((app) => app.status === "published" && app.network === "mainnet" && app.listing)
    .map((app) => {
      const stats = appStats(app, MOCK_DATA.txs);
      const rating = appRating(app, MOCK_DATA.ratings, MOCK_ACCOUNT.email);
      return { app, stats, rating, score: appScore(stats, rating) };
    });
  const filtered = listed.filter(({ app }) => (kind === "all" || app.kind === kind) &&
    (!query || [app.name, app.listing?.tagline ?? "", app.maker?.name ?? ""].some((value) => value.toLowerCase().includes(query))));
  const searching = query.length > 0 || kind !== "all";
  const featured = !searching && filtered.length >= 4 ? [...filtered].sort((a, b) => b.score - a.score).slice(0, 3) : [];
  const featuredIds = new Set(featured.map(({ app }) => app.id));
  const rest = filtered.filter(({ app }) => !featuredIds.has(app.id)).sort((a, b) =>
    sort === "top" ? b.score - a.score : sort === "active" ? b.stats.txCount - a.stats.txCount : b.app.createdAt - a.app.createdAt);
  const listedSlugs = new Set(listed.map(({ app }) => app.slug));
  const volume = MOCK_DATA.txs.filter((tx) => listedSlugs.has(tx.appSlug)).reduce((sum, tx) => sum + tx.amount, 0);
  const listedIds = new Set(listed.map(({ app }) => app.id));
  const votes = MOCK_DATA.ratings.filter((rating) => listedIds.has(rating.appId)).length;
  const kinds = Array.from(new Set(listed.map(({ app }) => app.kind)));
  const stats = [
    { Icon: LayoutGrid, value: String(listed.length), label: t("apps") },
    { Icon: Coins, value: formatAmount(volume), label: t("stablecoins moved") },
    { Icon: Star, value: String(votes), label: t("ratings") },
  ];
  const href = (next: { q?: string; kind?: string; sort?: Sort }) => {
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.kind && next.kind !== "all") search.set("kind", next.kind);
    if (next.sort && next.sort !== "top") search.set("sort", next.sort);
    return `/studio/marketplace${search.size ? `?${search}` : ""}`;
  };

  return <div className="flex flex-col">
    <section className="relative isolate overflow-hidden px-4 pb-8 pt-10 text-white sm:px-6 lg:px-8">
      <Image src={hero} alt="" fill placeholder="blur" sizes="100vw" className="-z-20 object-cover object-[50%_45%]" />
      <div className="absolute inset-0 -z-10 bg-[#0b1a33]/55" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div><p className="text-xs font-medium uppercase tracking-wide text-white/75">{t("Built during the event")}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{t("Marketplace")}</h1><p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">{t("Real apps on Stellar. Open one, sign in with a passkey and pay, then rate it.")}</p></div>
        <div className="flex flex-wrap gap-2">{stats.map(({ Icon, value, label }) => <span key={label} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm backdrop-blur-sm"><Icon size={14} className="text-white/80" /><span className="font-semibold tabular-nums">{value}</span><span className="text-white/80">{label}</span></span>)}</div>
        <form action="/studio/marketplace" className="flex max-w-xl items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-foreground shadow-sm">
          <Search size={16} className="shrink-0 text-muted" /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="sort" value={sort} /><Input name="q" aria-label={t("Search apps, makers or what they do")} defaultValue={params.q} placeholder={t("Search apps, makers or what they do")} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
        </form>
      </div>
    </section>
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-background" aria-busy="true" />}><PublishedApps query={params.q} /></Suspense>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t("Marketplace")} className="flex flex-wrap gap-2">{["all", ...kinds].map((item) => <Link key={item} href={href({ q: params.q, kind: item, sort })} aria-current={kind === item ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${kind === item ? "border-accent bg-accent text-white" : "border-line bg-surface text-muted hover:text-foreground"}`}>{item === "all" ? t("All") : t(KIND_LABELS[item as AppKind])}</Link>)}</nav>
        <nav aria-label={t("Sort apps")} className="flex gap-1 rounded-lg border border-line p-1">{([{ value: "top", label: "Top rated" }, { value: "active", label: "Most active" }, { value: "newest", label: "Newest" }] as const).map((option) => <Link key={option.value} href={href({ q: params.q, kind, sort: option.value })} aria-current={sort === option.value ? "page" : undefined} className={`rounded-md px-2.5 py-1.5 text-xs ${sort === option.value ? "bg-background font-medium text-foreground" : "text-muted hover:text-foreground"}`}>{t(option.label)}</Link>)}</nav>
      </div>
      {featured.length > 0 && <section className="flex flex-col gap-3"><div className="flex items-center gap-2"><h2 className="text-base font-semibold">{t("Featured this event")}</h2><span className="text-xs text-muted">{t("Best rated and most used, updated live")}</span></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{featured.map((item) => <MarketplaceCard key={item.app.id} app={item.app} stats={item.stats} rating={item.rating} />)}</div></section>}
      <section className="flex flex-col gap-3">{featured.length > 0 && <h2 className="text-base font-semibold">{t("All apps")}</h2>}{filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">{searching ? t("No apps match that search") : t("No apps published yet")}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{rest.map((item) => <MarketplaceCard key={item.app.id} app={item.app} stats={item.stats} rating={item.rating} />)}</div>}</section>
    </div>
  </div>;
}
