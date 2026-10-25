import Link from "next/link";
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCaption } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getT } from "@/lib/i18n/translate";
import { MOCK_ACCOUNT, MOCK_DATA, MOCK_NOW } from "@/lib/mock/data";
import { GENERATION_LIMIT } from "@/lib/mock/store-constants";
import { appStats } from "@/lib/mock/stats";
import { formatAmount } from "@/lib/mock/format";
import { AppRow, appState, type AppState } from "@/components/AppCard";
import { buttonClass } from "@/components/ui/button-variants";

type Filter = "all" | AppState;
type SearchParams = Promise<{ status?: string; q?: string }>;

export default function MyAppsPage({ searchParams }: { searchParams: SearchParams }) {
  return <Suspense fallback={<div className="mx-auto w-full max-w-5xl px-4 py-8" aria-busy="true" />}><MyAppsContent searchParams={searchParams} /></Suspense>;
}

async function MyAppsContent({ searchParams }: { searchParams: SearchParams }) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const t = getT("en");
  const filter: Filter = ["all", "preview", "testnet", "mainnet"].includes(rawStatus ?? "") ? rawStatus as Filter : "all";
  const query = rawQuery?.trim().toLowerCase() ?? "";
  const mine = MOCK_DATA.apps
    .filter((app) => app.maker?.email === MOCK_ACCOUNT.email)
    .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt));
  const counts: Record<AppState, number> = { preview: 0, testnet: 0, mainnet: 0 };
  const real = { volume: 0, txs: 0, users: new Set<string>(), payments: 0, cashouts: 0 };
  const test = { volume: 0, txs: 0 };
  for (const app of mine) {
    const state = appState(app);
    counts[state] += 1;
    for (const tx of MOCK_DATA.txs.filter((item) => item.appSlug === app.slug)) {
      if (state === "mainnet") {
        real.volume += tx.amount; real.txs += 1; real.users.add(tx.from);
        if (tx.type === "cashout") real.cashouts += 1; else real.payments += 1;
      } else { test.volume += tx.amount; test.txs += 1; }
    }
  }
  const shown = mine.filter((app) =>
    (filter === "all" || appState(app) === filter) &&
    (!query || [app.name, app.prompt, app.url].some((value) => value.toLowerCase().includes(query))),
  );
  const live = counts.mainnet + counts.testnet;
  const filters: Array<{ value: Filter; label: string; count: number }> = [
    { value: "all", label: "All", count: mine.length },
    { value: "mainnet", label: "Mainnet", count: counts.mainnet },
    { value: "testnet", label: "Testnet", count: counts.testnet },
    { value: "preview", label: "Previews", count: counts.preview },
  ];
  const hrefFor = (next: Filter) => {
    const params = new URLSearchParams();
    if (next !== "all") params.set("status", next);
    if (rawQuery) params.set("q", rawQuery);
    const qs = params.toString();
    return `/studio/apps${qs ? `?${qs}` : ""}`;
  };
  const ago = (at: number) => {
    const seconds = Math.floor(Math.max(0, MOCK_NOW - at) / 1000);
    if (seconds < 10) return t("just now");
    if (seconds < 60) return t("{n}s ago", { n: seconds });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("{n}m ago", { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("{n}h ago", { n: hours });
    return t("{n}d ago", { n: Math.floor(hours / 24) });
  };
  const limitReached = (MOCK_ACCOUNT.plan ?? "free") === "free" && MOCK_ACCOUNT.generationsUsed >= GENERATION_LIMIT;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex items-end justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight">{t("My apps")}</h1><p className="mt-0.5 text-sm text-muted">{(MOCK_ACCOUNT.plan ?? "free") === "free" ? t("{used} of {limit} generations used on the free plan", { used: MOCK_ACCOUNT.generationsUsed, limit: GENERATION_LIMIT }) : live ? t("{n} live apps", { n: live }) : t("Nothing live yet")}</p></div>
        {limitReached ? <Link href="/studio?settings=plan" className={buttonClass("primary", "md")}>{t("Upgrade plan")}</Link> : <Link href="/studio" className={buttonClass("primary", "md")}><Plus size={16} />{t("New app")}</Link>}
      </header>

      {mine.length > 0 && <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-4 sm:divide-x [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-line sm:[&>div:nth-child(-n+2)]:border-b-0">
        <Figure label={t("Moved on mainnet")} value={formatAmount(real.volume)} note={real.txs ? t("Real money") : t("No real payments yet")} />
        <Figure label={t("Transactions")} value={real.txs} note={real.txs ? t("{p} payments · {c} cashouts", { p: real.payments, c: real.cashouts }) : t("On mainnet")} />
        <Figure label={t("Users who paid")} value={real.users.size} note={t("Unique wallets")} />
        <Figure label={t("Test money")} value={formatAmount(test.volume)} note={t("{n} transactions on testnet and previews", { n: test.txs })} muted />
      </dl>}

      {mine.length === 0 ? <div className="flex flex-col items-center gap-3 border-t border-line py-16 text-center"><p className="text-base font-medium">{t("No apps yet")}</p><p className="max-w-sm text-sm text-muted">{t("Describe an app on the home page. You get a preview to review, then publish it on testnet or mainnet.")}</p><Link href="/studio" className={buttonClass("secondary", "md")}><Plus size={16} />{t("New app")}</Link></div> : <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 border-b border-line sm:flex-row sm:items-end sm:justify-between">
          <nav aria-label={t("Filter apps by status")} className="-mb-px flex gap-5 overflow-x-auto">
            {filters.map((item) => <Link key={item.value} href={hrefFor(item.value)} aria-current={filter === item.value ? "page" : undefined} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-sm ${filter === item.value ? "border-foreground font-medium text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>{t(item.label)}<span className="font-mono text-xs text-muted tabular-nums">{item.count}</span></Link>)}
          </nav>
          {mine.length > 4 && <form action="/studio/apps" className="relative mb-2 sm:w-56"><Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><input type="hidden" name="status" value={filter} /><Input name="q" aria-label={t("Search")} defaultValue={rawQuery} placeholder={t("Search")} className="w-full rounded-lg border border-line bg-transparent py-1.5 pl-8 pr-3 text-sm" /></form>}
        </div>
        {shown.length === 0 ? <p className="py-12 text-center text-sm text-muted">{t("Nothing here with this filter.")}</p> : <div className="overflow-hidden rounded-xl border border-line bg-surface"><Table className="min-w-[34rem]"><TableCaption className="sr-only">{t("My apps")}</TableCaption><TableHeader><TableRow className="text-[11px] uppercase tracking-wide"><TableHead>{t("App")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead className="text-right">{t("Moved")}</TableHead><TableHead className="text-right">{t("Updated")}</TableHead></TableRow></TableHeader><TableBody>{shown.map((app) => <AppRow key={app.id} app={app} stats={appStats(app, MOCK_DATA.txs)} when={ago(app.publishedAt ?? app.createdAt)} />)}</TableBody></Table></div>}
      </section>}
    </div>
  );
}

function Figure({ label, value, note, muted }: { label: string; value: React.ReactNode; note: string; muted?: boolean }) {
  return <div className="px-4 py-3"><dt className="text-xs text-muted">{label}</dt><dd className={`mt-0.5 font-mono text-xl font-medium tabular-nums ${muted ? "text-muted" : ""}`}>{value}</dd><dd className="truncate text-[11px] text-muted">{note}</dd></div>;
}
