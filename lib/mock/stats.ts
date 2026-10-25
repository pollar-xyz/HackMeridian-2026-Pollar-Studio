import type { App, Rating, Tx } from "./types";
import { MOCK_NOW } from "./data";

export interface AppStats {
  txCount: number; payments: number; volume: number; wallets: number; cashouts: number;
  countries: string[]; lastTxAt: number | null; active: boolean;
}
export interface RatingSummary { avg: number; count: number; mine: number | null }

export function appRating(app: App, ratings: Rating[], email?: string | null): RatingSummary {
  const own = ratings.filter((rating) => rating.appId === app.id);
  return {
    avg: own.length ? own.reduce((sum, rating) => sum + rating.stars, 0) / own.length : 0,
    count: own.length,
    mine: email ? (own.find((rating) => rating.email === email)?.stars ?? null) : null,
  };
}

export function appScore(stats: AppStats, rating: RatingSummary): number {
  const confidence = Math.min(rating.count, 10) / 10;
  return rating.avg * 20 * confidence + Math.log10(1 + stats.volume) * 10 + Math.min(stats.payments, 25);
}

export function appStats(app: App, txs: Tx[]): AppStats {
  const own = txs.filter((tx) => tx.appSlug === app.slug);
  const counts = new Map<string, number>();
  for (const tx of own) counts.set(tx.country, (counts.get(tx.country) ?? 0) + 1);
  const countries = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([country]) => country);
  const lastTxAt = own.length ? Math.max(...own.map((tx) => tx.at)) : null;
  const cashouts = own.filter((tx) => tx.type === "cashout").length;
  return {
    active: lastTxAt !== null && MOCK_NOW - lastTxAt < 6 * 60 * 60 * 1000,
    txCount: own.length,
    payments: own.length - cashouts,
    volume: own.reduce((sum, tx) => sum + tx.amount, 0),
    wallets: new Set(own.map((tx) => tx.from)).size,
    cashouts,
    countries,
    lastTxAt,
  };
}
