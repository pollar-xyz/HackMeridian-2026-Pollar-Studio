import { useSyncExternalStore } from "react";
import type { RailCountry } from "./types";
import type { Account, App, Asset, ChatMessage, Listing, CreditEntry, Job, Network, PlanId, Rating, SharedPart, Target, Tx } from "./types";
import { buildSeed } from "./seed";

export const STORAGE_KEY = "pollar-studio";
export const STARTING_CREDITS = 500;
export const GENERATION_LIMIT = 5;
export const MAINNET_COSTS = { contract: 150, sponsor: 50 } as const;

export function sharedSponsorFrom(app: App, apps: App[]): App | undefined {
  if (!app.shared?.includes("sponsor")) return undefined;
  return apps.find((a) => a.id !== app.id && a.maker?.email === app.maker?.email && a.network === "mainnet" && a.shared?.includes("sponsor"));
}
export function mainnetCost(app: App, apps: App[]) {
  const sponsor = sharedSponsorFrom(app, apps) ? 0 : MAINNET_COSTS.sponsor;
  return { contract: MAINNET_COSTS.contract, sponsor, total: MAINNET_COSTS.contract + sponsor };
}

const seed = buildSeed(Date.UTC(2026, 9, 23));
const account: Account = { email: "maker@pollar.app", name: "Pollar Maker", credits: STARTING_CREDITS, generationsUsed: 2, plan: "free" };
export interface StudioState {
  hydrated: boolean; seeded: boolean; account: Account | null; savedAccounts: Record<string, Account>;
  apps: App[]; jobs: Job[]; txs: Tx[]; ledger: CreditEntry[]; ratings: Rating[]; chats: ChatMessage[]; migrations: string[];
  setHydrated(): void; ensureSeed(): void; resumeInterruptedJobs(): void; login(email: string): void; logout(): void;
  createApp(prompt: string, options?: { asset?: Asset; assets?: Asset[]; countries?: RailCountry[]; network?: Network; target?: Target }): string;
  upgradePlan(plan: PlanId, paidUsdc?: number): void; updateProfile(patch: { name?: string }): void; rebuildApp(appId: string, reason: "push" | "manual"): string;
  exportToGithub(appId: string): void; simulatePush(appId: string, message?: string): void; addTx(tx: Tx): void;
  spendCredits(n: number, reason: string, appId?: string): void; addCredits(n: number, reason: string, paidUsdc?: number): void;
  rotateApiKey(appId: string): void; rateApp(appId: string, stars: Rating["stars"]): void; sendChat(appId: string, text: string): void;
  publishListing(appId: string, listing: Omit<Listing, "listedAt"> | null): void; setSubdomain(appId: string, subdomain: string): string | null;
  setShared(appId: string, parts: SharedPart[]): void; publishApp(appId: string): void;
  deployMainnet(appId: string, form: { payoutWallet: string; asset: Asset; businessName: string }): void; unpublishApp(appId: string): void;
}

const noop = () => {};
const state: StudioState = {
  hydrated: true, seeded: true, account, savedAccounts: {}, apps: seed.apps, jobs: seed.jobs, txs: seed.txs,
  ledger: [], ratings: seed.ratings, chats: [], migrations: [], setHydrated: noop, ensureSeed: noop, resumeInterruptedJobs: noop,
  login: noop, logout: noop, createApp: () => "mock-app", upgradePlan: noop, updateProfile: noop, rebuildApp: () => "mock-job",
  exportToGithub: noop, simulatePush: noop, addTx: noop, spendCredits: noop, addCredits: noop, rotateApiKey: noop,
  rateApp: noop, sendChat: noop, publishListing: noop, setSubdomain: () => null, setShared: noop, publishApp: noop,
  deployMainnet: noop, unpublishApp: noop,
};
const subscribe = () => () => {};
export function useStudioStore<T>(selector: (state: StudioState) => T): T {
  useSyncExternalStore(subscribe, () => state, () => state);
  return selector(state);
}
export function hydrateStudioStore(): void {}
export function syncStudioStoreFromStorage(): void {}

const RESERVED = ["www", "app", "api", "admin", "pollar", "studio", "docs", "mail", "help", "support", "status", "preview"];
export function subdomainProblem(sub: string, appId: string, apps: App[]): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(sub)) return "Use 3 to 32 letters, numbers or dashes";
  if (sub.includes("--")) return "Double dashes are reserved for previews";
  if (RESERVED.includes(sub)) return "That address is reserved by Pollar";
  if (apps.some((a) => a.id !== appId && a.url === `https://${sub}.pollar.app`)) return "That address is taken";
  return null;
}
