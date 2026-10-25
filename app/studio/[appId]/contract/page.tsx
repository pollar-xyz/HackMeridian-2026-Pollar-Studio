import { Suspense } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { App, Tx } from "@/lib/mock/types";
import { ContractView } from "@/components/studio/ContractView";
import { getMockApp } from "@/lib/mock/get-app";
import { MOCK_DATA, MOCK_NOW } from "@/lib/mock/data";
import { COUNTRY_NAMES } from "@/lib/mock/types";
import { shortHash, shortWallet } from "@/lib/mock/random";
import { formatAmount } from "@/lib/mock/format";
import { getT } from "@/lib/i18n/translate";

export default function ContractPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<PageSkeleton />}><ContractContent params={params} /></Suspense>;
}

function PageSkeleton() {
  return <div className="flex flex-col gap-4 p-4" aria-busy="true"><div className="h-56 animate-pulse rounded-2xl bg-surface" /><div className="h-48 animate-pulse rounded-2xl bg-surface" /></div>;
}

async function ContractContent({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const app = getMockApp(appId);
  if (!app) return null;
  const txs = MOCK_DATA.txs.filter((tx) => tx.appSlug === app.slug);
  return <div className="flex flex-col gap-4 p-4 sm:p-5"><ContractView app={app} /><Movements app={app} txs={txs} /></div>;
}

function Movements({ app, txs }: { app: App; txs: Tx[] }) {
  const t = getT("en");
  const asset = app.asset ?? "USDC";
  const sorted = [...txs].sort((a, b) => b.at - a.at);
  const inflow = txs.filter((tx) => tx.type === "payment").reduce((sum, tx) => sum + tx.amount, 0);
  const outflow = txs.filter((tx) => tx.type === "cashout").reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">{t("What went through the contract")}</h2>{txs.length > 0 && <p className="text-xs text-muted"><span className="font-semibold text-accent-strong">+{formatAmount(inflow)}</span> {t("in")} · <span className="font-semibold text-foreground">-{formatAmount(outflow)}</span> {t("to banks")} · {asset}</p>}</div>
      {sorted.length === 0 ? <p className="mt-3 rounded-xl bg-background px-4 py-6 text-center text-sm text-muted">{t("Nothing yet. Open the app, sign in with the passkey and pay, it shows up here right away.")}</p> : <ul className="mt-3 divide-y divide-line">{sorted.slice(0, 12).map((tx) => { const isCashout = tx.type === "cashout"; return <li key={tx.id} className="flex items-center gap-3 py-2.5 text-sm"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCashout ? "bg-background text-muted" : "bg-accent-soft text-accent"}`}>{isCashout ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}</span><div className="min-w-0 flex-1"><p className="font-medium">{isCashout ? t("Cashout to bank") : t("Payment")}</p><p className="truncate text-xs text-muted">{COUNTRY_NAMES[tx.country]} · {shortWallet(tx.from)} · <span className="font-mono">{shortHash(tx.hash)}</span></p></div><div className="shrink-0 text-right"><p className={`tabular-nums ${isCashout ? "" : "text-accent-strong"}`}>{isCashout ? "-" : "+"}{formatAmount(tx.amount)} <span className="text-xs text-muted">{asset}</span></p><p className="text-xs text-muted">{relativeTime(tx.at, t)}</p></div></li>; })}</ul>}
    </section>
  );
}

function relativeTime(at: number, t: ReturnType<typeof getT>) {
  const seconds = Math.floor(Math.max(0, MOCK_NOW - at) / 1000);
  if (seconds < 10) return t("just now");
  if (seconds < 60) return t("{n}s ago", { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("{n}m ago", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("{n}h ago", { n: hours });
  return t("{n}d ago", { n: Math.floor(hours / 24) });
}
