"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCaption,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useStudioStore, GENERATION_LIMIT } from "@/lib/mock/store";
import { useAgo, useT } from "@/lib/i18n";
import { AppRow, appState, type AppState } from "@/components/AppCard";
import { useStudioAccount, StudioLoading } from "@/components/StudioGate";
import { appStats } from "@/components/studio/MarketplaceCard";
import { formatAmount } from "@/lib/mock/format";
import { Button, buttonClass } from "@/components/ui/Button";
import { useUiStore } from "@/lib/mock/ui-store";

type Filter = "all" | AppState;

export default function MyAppsPage() {
  const account = useStudioAccount();
  const t = useT();
  const ago = useAgo();
  const apps = useStudioStore((s) => s.apps);
  const txs = useStudioStore((s) => s.txs);
  const openSettings = useUiStore((s) => s.openSettings);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Only the apps this account made. The showcase apps belong to other makers and live in the marketplace.
  const mine = useMemo(
    () =>
      apps
        .filter((a) => a.maker?.email === account?.email)
        .sort(
          (a, b) =>
            (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt),
        ),
    [apps, account?.email],
  );

  // Real money only counts mainnet. Testnet and previews move play money, shown apart so nobody mixes them up.
  const { count, real, test } = useMemo(() => {
    const count: Record<AppState, number> = {
      preview: 0,
      testnet: 0,
      mainnet: 0,
    };
    const real = {
      volume: 0,
      txs: 0,
      users: new Set<string>(),
      payments: 0,
      cashouts: 0,
    };
    const test = { volume: 0, txs: 0 };
    for (const app of mine) {
      const state = appState(app);
      count[state] += 1;
      const own = txs.filter((tx) => tx.appSlug === app.slug);
      if (state === "mainnet") {
        for (const tx of own) {
          real.volume += tx.amount;
          real.txs += 1;
          real.users.add(tx.from);
          if (tx.type === "cashout") real.cashouts += 1;
          else real.payments += 1;
        }
      } else {
        for (const tx of own) {
          test.volume += tx.amount;
          test.txs += 1;
        }
      }
    }
    return { count, real, test };
  }, [mine, txs]);

  if (!account) return <StudioLoading />;

  const freePlan = (account.plan ?? "free") === "free";
  const limitReached = freePlan && account.generationsUsed >= GENERATION_LIMIT;
  const q = query.trim().toLowerCase();
  const shown = mine.filter(
    (a) =>
      (filter === "all" || appState(a) === filter) &&
      (!q ||
        [a.name, a.prompt, a.url].some((v) => v.toLowerCase().includes(q))),
  );
  const live = count.mainnet + count.testnet;

  // The tabs double as the summary: no separate metric cards repeating the same numbers.
  const FILTERS: Array<{ value: Filter; label: string; n: number }> = [
    { value: "all", label: "All", n: mine.length },
    { value: "mainnet", label: "Mainnet", n: count.mainnet },
    { value: "testnet", label: "Testnet", n: count.testnet },
    { value: "preview", label: "Previews", n: count.preview },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("My apps")}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {freePlan
              ? t("{used} of {limit} generations used on the free plan", {
                  used: account.generationsUsed,
                  limit: GENERATION_LIMIT,
                })
              : live
                ? t("{n} live apps", { n: live })
                : t("Nothing live yet")}
          </p>
        </div>
        {limitReached ? (
          <Button onClick={() => openSettings("plan")}>
            {t("Upgrade plan")}
          </Button>
        ) : (
          <Link href="/studio" className={buttonClass("primary", "md")}>
            <Plus size={16} /> {t("New app")}
          </Link>
        )}
      </header>

      {mine.length > 0 && (
        <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-4 sm:divide-x [&>div:nth-child(-n+2)]:border-b [&>div:nth-child(-n+2)]:border-line sm:[&>div:nth-child(-n+2)]:border-b-0">
          <Figure
            label={t("Moved on mainnet")}
            value={formatAmount(real.volume)}
            note={real.txs ? t("Real money") : t("No real payments yet")}
          />
          <Figure
            label={t("Transactions")}
            value={real.txs}
            note={
              real.txs
                ? t("{p} payments · {c} cashouts", {
                    p: real.payments,
                    c: real.cashouts,
                  })
                : t("On mainnet")
            }
          />
          <Figure
            label={t("Users who paid")}
            value={real.users.size}
            note={t("Unique wallets")}
          />
          <Figure
            label={t("Test money")}
            value={formatAmount(test.volume)}
            note={t("{n} transactions on testnet and previews", {
              n: test.txs,
            })}
            muted
          />
        </dl>
      )}

      {mine.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-t border-line py-16 text-center">
          <p className="text-base font-medium">{t("No apps yet")}</p>
          <p className="max-w-sm text-sm text-muted">
            {t(
              "Describe an app on the home page. You get a preview to review, then publish it on testnet or mainnet.",
            )}
          </p>
          <Link href="/studio" className={buttonClass("secondary", "md")}>
            <Plus size={16} /> {t("New app")}
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 border-b border-line sm:flex-row sm:items-end sm:justify-between">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as Filter)}
              className="min-w-0"
            >
              <TabsList
                aria-label={t("Filter apps by status")}
                className="-mb-px h-auto justify-start gap-5 overflow-x-auto rounded-none border-b border-line bg-transparent p-0"
              >
              {FILTERS.map((f) => {
                const active = filter === f.value;
                return (
                  <TabsTrigger
                    key={f.value}
                    value={f.value}
                    className={`inline-flex h-auto shrink-0 gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-0 text-sm font-normal shadow-none transition-colors hover:bg-transparent data-[state=active]:border-foreground data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none ${
                      active
                        ? "text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {t(f.label)}
                    <span className="font-mono text-xs text-muted tabular-nums">
                      {f.n}
                    </span>
                  </TabsTrigger>
                );
              })}
              </TabsList>
            </Tabs>
            {mine.length > 4 && (
              <label className="relative mb-2 sm:w-56">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <Input
                  aria-label={t("Search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search")}
                  className="w-full rounded-lg border border-line bg-transparent py-1.5 pl-8 pr-3 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
                />
              </label>
            )}
          </div>

          {shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">
              {t("Nothing here with this filter.")}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <Table className="min-w-[34rem]">
                <TableCaption className="sr-only">{t("My apps")}</TableCaption>
                <TableHeader>
                  <TableRow className="text-[11px] uppercase tracking-wide">
                    <TableHead>{t("App")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead className="text-right">{t("Moved")}</TableHead>
                    <TableHead className="text-right">{t("Updated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((app) => (
                    <AppRow
                      key={app.id}
                      app={app}
                      stats={appStats(app, txs)}
                      when={ago(app.publishedAt ?? app.createdAt)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Figure({
  label,
  value,
  note,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  muted?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={`mt-0.5 font-mono text-xl font-medium tabular-nums ${muted ? "text-muted" : ""}`}
      >
        {value}
      </dd>
      <dd className="truncate text-[11px] text-muted">{note}</dd>
    </div>
  );
}
