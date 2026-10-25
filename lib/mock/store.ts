"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RailCountry } from "./types";
import type { Account, App, Asset, ChatMessage, Listing, CreditEntry, Job, JobTrigger, Network, PlanId, Rating, SharedPart, Target, Tx } from "./types";
import { planChat } from "./chat";
import { planById } from "./plans";
import { classifyPrompt, deriveName } from "./classify";
import { makeRng, newId, randomApiKey, randomContractId, randomHash, randomWallet, walletAddress } from "./random";
import { buildSeed, SEED_LISTINGS, SEED_MAKERS } from "./seed";
import { runJob, isTerminal, type JobRunnerApi } from "./jobs";

export const STORAGE_KEY = "pollar-studio";
export const STARTING_CREDITS = 500;
export const GENERATION_LIMIT = 5;
export const MAINNET_COSTS = { contract: 150, sponsor: 50 } as const;

// Another app by the same maker that already runs a shared sponsor wallet on mainnet. Sharing it skips the funding.
export function sharedSponsorFrom(app: App, apps: App[]): App | undefined {
  if (!app.shared?.includes("sponsor")) return undefined;
  return apps.find(
    (a) => a.id !== app.id && a.maker?.email === app.maker?.email && a.network === "mainnet" && a.shared?.includes("sponsor"),
  );
}

export function mainnetCost(app: App, apps: App[]) {
  const sponsor = sharedSponsorFrom(app, apps) ? 0 : MAINNET_COSTS.sponsor;
  return { contract: MAINNET_COSTS.contract, sponsor, total: MAINNET_COSTS.contract + sponsor };
}

interface StudioState {
  hydrated: boolean;
  seeded: boolean;
  account: Account | null;
  savedAccounts: Record<string, Account>; // credits survive logout and login with the same email
  apps: App[];
  jobs: Job[];
  txs: Tx[];
  ledger: CreditEntry[];
  ratings: Rating[];
  chats: ChatMessage[];
  migrations: string[];

  setHydrated(): void;
  ensureSeed(): void;
  resumeInterruptedJobs(): void;

  login(email: string): void;
  logout(): void;
  createApp(prompt: string, options?: { asset?: Asset; assets?: Asset[]; countries?: RailCountry[]; network?: Network; target?: Target }): string;
  upgradePlan(plan: PlanId, paidUsdc?: number): void;
  updateProfile(patch: { name?: string }): void;
  rebuildApp(appId: string, reason: "push" | "manual"): string;
  exportToGithub(appId: string): void;
  simulatePush(appId: string, message?: string): void;
  addTx(tx: Tx): void;
  spendCredits(n: number, reason: string, appId?: string): void;
  addCredits(n: number, reason: string, paidUsdc?: number): void;
  rotateApiKey(appId: string): void;
  rateApp(appId: string, stars: Rating["stars"]): void;
  sendChat(appId: string, text: string): void;
  publishListing(appId: string, listing: Omit<Listing, "listedAt"> | null): void;
  setSubdomain(appId: string, subdomain: string): string | null; // returns an error message or null
  setShared(appId: string, parts: SharedPart[]): void;
  publishApp(appId: string): void; // makes the reviewed preview live on the public address
  deployMainnet(appId: string, form: { payoutWallet: string; asset: Asset; businessName: string }): void;
  unpublishApp(appId: string): void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => {
      const runnerApi: JobRunnerApi = {
        getJob: (jobId) => get().jobs.find((j) => j.id === jobId),
        getApp: (appId) => get().apps.find((a) => a.id === appId),
        patchJob: (jobId, patch) =>
          set((s) => ({ jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch, updatedAt: Date.now() } : j)) })),
        appendLog: (jobId, line) =>
          set((s) => ({
            jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, logs: [...j.logs, line], updatedAt: Date.now() } : j)),
          })),
        finishBuild: (appId, sha) => {
          const existing = get().apps.find((a) => a.id === appId)?.contractId;
          const contractId = existing ?? randomContractId();
          set((s) => ({
            apps: s.apps.map((a) => (a.id === appId ? { ...a, contractId, previewSha: sha } : a)),
          }));
          return contractId;
        },
        spendCredits: (amount, reason, appId) => get().spendCredits(amount, reason, appId),
        applyPatch: (appId, patch) => set((s) => ({ apps: s.apps.map((a) => (a.id === appId ? { ...a, ...patch } : a)) })),
      };

      const startJob = (appId: string, trigger: JobTrigger, extra?: Pick<Job, "changes" | "patch" | "commit">): string => {
        const app = get().apps.find((a) => a.id === appId);
        const defaultMessage =
          trigger === "prompt"
            ? "Initial generation from your prompt"
            : trigger === "chat"
              ? (extra?.changes?.[0] ?? "Change from chat")
              : trigger === "manual"
                ? "Manual rebuild"
                : "Update from GitHub";
        const job: Job = {
          commit: extra?.commit ?? { sha: randomHash().slice(0, 7), message: app ? defaultMessage : defaultMessage },
          ...extra,
          id: newId("job"),
          appId,
          status: "queued",
          attempt: 1,
          logs: [],
          startedAt: Date.now(),
          updatedAt: Date.now(),
          trigger,
        };
        set((s) => ({
          jobs: [...s.jobs, job],
          apps: s.apps.map((a) => (a.id === appId ? { ...a, jobIds: [...a.jobIds, job.id] } : a)),
        }));
        runJob(job.id, runnerApi);
        return job.id;
      };

      return {
        hydrated: false,
        seeded: false,
        account: null,
        savedAccounts: {},
        apps: [],
        jobs: [],
        txs: [],
        ledger: [],
        ratings: [],
        chats: [],
        migrations: [],

        setHydrated: () => set({ hydrated: true }),

        ensureSeed: () => {
          const seed = buildSeed(Date.now());
          if (!get().seeded) {
            set((s) => ({
              seeded: true,
              apps: s.apps.length ? s.apps : seed.apps,
              jobs: s.jobs.length ? s.jobs : seed.jobs,
              txs: s.txs.length ? s.txs : seed.txs,
            }));
          }
          // Listings arrived later: the event apps are listed in the marketplace from the start.
          if (get().apps.some((a) => SEED_LISTINGS[a.slug] && !a.listing)) {
            set((s) => ({ apps: s.apps.map((a) => (SEED_LISTINGS[a.slug] && !a.listing ? { ...a, listing: SEED_LISTINGS[a.slug] } : a)) }));
          }
          // Makers arrived later: seed apps get their makers, the rest belong to the signed in account.
          if (get().apps.some((a) => !a.maker)) {
            const acc = get().account;
            const mine = acc ? { name: acc.name?.trim() || acc.email.split("@")[0], email: acc.email } : { name: "Pollar maker", email: "maker@pollar.app" };
            set((s) => ({ apps: s.apps.map((a) => (a.maker ? a : { ...a, maker: SEED_MAKERS[a.slug] ?? mine })) }));
          }
          // Review before publish arrived later: what was live stays live, and is the reviewed build too.
          if (get().apps.some((a) => a.status === "published" && !a.publishedSha)) {
            set((s) => ({
              apps: s.apps.map((a) => {
                if (a.status !== "published" || a.publishedSha) return a;
                const sha = a.previewSha ?? a.id.replace(/[^0-9a-f]/g, "").padEnd(7, "0").slice(0, 7);
                return { ...a, previewSha: sha, publishedSha: sha, publishedAt: a.publishedAt ?? a.createdAt };
              }),
            }));
          }
          // Your own apps start as previews once, so the review then publish flow shows up for real.
          if (!get().migrations.includes("own-apps-to-preview")) {
            set((s) => ({
              migrations: [...s.migrations, "own-apps-to-preview"],
              apps: s.apps.map((a) =>
                a.id.startsWith("app_seed")
                  ? a
                  : { ...a, status: "draft", publishedSha: undefined, publishedAt: undefined, listing: undefined, previewSha: a.previewSha ?? a.publishedSha },
              ),
            }));
          }
          // Stellar Passport was removed: drop any link saved by earlier versions.
          const acc = get().account as (StudioState["account"] & { passport?: unknown }) | null;
          if (acc && "passport" in acc) {
            const { passport: _drop, ...rest } = acc;
            void _drop;
            set({ account: rest });
          }
          // The marketplace became mainnet only: showcase apps move to mainnet, testnet listings are taken down.
          if (!get().migrations.includes("marketplace-mainnet-only")) {
            set((s) => ({
              migrations: [...s.migrations, "marketplace-mainnet-only"],
              apps: s.apps.map((a) =>
                a.id.startsWith("app_seed") ? { ...a, network: "mainnet" } : a.network === "mainnet" ? a : { ...a, listing: undefined },
              ),
            }));
          }
          // Contracts arrived later than the first seed: published apps without one get a stable id.
          if (get().apps.some((a) => a.status === "published" && !a.contractId)) {
            set((s) => ({
              apps: s.apps.map((a) =>
                a.status === "published" && !a.contractId ? { ...a, contractId: "C" + walletAddress(makeRng(a.id)).slice(1) } : a,
              ),
            }));
          }
          // Ratings arrived later than the first seed, so stores created before get them here.
          if (!get().ratings.length) {
            const ids = new Set(get().apps.map((a) => a.id));
            set({ ratings: seed.ratings.filter((r) => ids.has(r.appId)) });
          }
        },

        resumeInterruptedJobs: () => {
          // A job that is still being driven by a runner updates every few hundred ms.
          // Only jobs with no activity for a while are orphaned (the tab that ran them is gone).
          const now = Date.now();
          const orphaned = (j: Job) => !isTerminal(j.status) && now - (j.updatedAt ?? j.startedAt) > 4000;
          if (!get().jobs.some(orphaned)) return;
          set((s) => ({
            jobs: s.jobs.map((j) =>
              !orphaned(j)
                ? j
                : {
                    ...j,
                    status: "failed",
                    finishedAt: Date.now(),
                    logs: [...j.logs, "error: Build interrupted, the page was reloaded"],
                  },
            ),
          }));
        },

        login: (email) =>
          set((s) => ({
            account: s.savedAccounts[email] ?? { email, credits: STARTING_CREDITS, generationsUsed: 0, createdAt: Date.now() },
          })),

        logout: () =>
          set((s) => ({
            account: null,
            savedAccounts: s.account ? { ...s.savedAccounts, [s.account.email]: s.account } : s.savedAccounts,
          })),

        createApp: (prompt, options) => {
          const account = get().account;
          if (!account) throw new Error("Sign in first");
          if ((account.plan ?? "free") === "free" && account.generationsUsed >= GENERATION_LIMIT) {
            throw new Error("Generation limit reached for this event");
          }
          const id = newId("app");
          const kind = classifyPrompt(prompt);
          const slug = `${kind}-${id.slice(-5, -1)}`;
          const app: App = {
            id,
            slug,
            name: deriveName(prompt),
            kind,
            prompt: prompt.trim(),
            asset: options?.asset ?? options?.assets?.[0] ?? "USDC",
            assets: options?.assets ?? [options?.asset ?? "USDC"],
            countries: options?.countries ?? ["BO", "BR", "AR"],
            network: options?.network ?? "testnet",
            target: options?.target ?? "web",
            maker: { name: account.name?.trim() || account.email.split("@")[0], email: account.email },
            status: "draft",
            url: `https://${slug}.pollar.app`,
            apiKey: randomApiKey(),
            sponsorWallet: randomWallet(),
            createdAt: Date.now(),
            jobIds: [],
          };
          set((s) => ({
            apps: [...s.apps, app],
            account: s.account
              ? { ...s.account, generationsUsed: s.account.generationsUsed + 1 }
              : s.account,
          }));
          startJob(id, "prompt");
          return id;
        },

        rebuildApp: (appId, reason) => startJob(appId, reason),

        exportToGithub: (appId) =>
          set((s) => ({
            apps: s.apps.map((a) =>
              a.id === appId ? { ...a, github: { repoUrl: `https://github.com/you/${a.slug}` } } : a,
            ),
          })),

        simulatePush: (appId, message) => {
          set((s) => ({
            apps: s.apps.map((a) =>
              a.id === appId && a.github
                ? { ...a, github: { ...a.github, lastPushAt: Date.now() } }
                : a,
            ),
          }));
          startJob(appId, "push", { commit: { sha: randomHash().slice(0, 7), message: message?.trim() || "Update from GitHub" } });
        },

        addTx: (tx) => set((s) => ({ txs: [...s.txs, tx] })),

        spendCredits: (n, reason, appId) => {
          const account = get().account;
          if (!account) throw new Error("Sign in first");
          if (account.credits < n) throw new Error(`Not enough credits for ${reason.toLowerCase()}`);
          set((s) => ({
            account: s.account ? { ...s.account, credits: s.account.credits - n } : s.account,
            ledger: [
              ...s.ledger,
              { id: newId("cr"), at: Date.now(), amount: n, reason, appId },
            ],
          }));
        },

        upgradePlan: (plan, paidUsdc) => {
          const credits = planById(plan).monthlyCredits;
          set((s) => ({
            account: s.account
              ? { ...s.account, plan, planSince: Date.now(), credits: s.account.credits + credits, topUps: (s.account.topUps ?? 0) + credits }
              : s.account,
            ledger: [
              ...s.ledger,
              {
                id: newId("cr"),
                at: Date.now(),
                amount: -credits,
                reason: `${planById(plan).name} plan`,
                paidUsdc: paidUsdc ?? planById(plan).priceUsdc,
                hash: randomHash(),
              },
            ],
          }));
        },

        updateProfile: (patch) => set((s) => ({ account: s.account ? { ...s.account, ...patch } : s.account })),

        addCredits: (n, reason, paidUsdc) =>
          set((s) => ({
            account: s.account
              ? { ...s.account, credits: s.account.credits + n, topUps: (s.account.topUps ?? 0) + n }
              : s.account,
            ledger: [...s.ledger, { id: newId("cr"), at: Date.now(), amount: -n, reason, paidUsdc: paidUsdc ?? 0, hash: paidUsdc ? randomHash() : undefined }],
          })),

        sendChat: (appId, text) => {
          const app = get().apps.find((a) => a.id === appId);
          if (!app || !text.trim()) return;
          const now = Date.now();
          const userMsg: ChatMessage = { id: newId("msg"), appId, role: "user", text: text.trim(), at: now };
          const plan = planChat(app, text);
          const busy = get().jobs.some((j) => j.appId === appId && !isTerminal(j.status));
          const credits = get().account?.credits ?? 0;
          let reply = plan.reply;
          let jobId: string | undefined;
          if (plan.rebuild && busy) reply = "A build is already running for this app. Send it again once it finishes.";
          else if (plan.rebuild && credits < 15) reply = "You need 15 credits for a rebuild. Add credits from the sidebar and send it again.";
          set((s) => ({ chats: [...s.chats, userMsg] }));
          if (plan.rebuild && !busy && credits >= 15) {
            jobId = startJob(appId, "chat", { changes: plan.changes, patch: plan.patch });
          }
          const reply_: ChatMessage = {
            id: newId("msg"),
            appId,
            role: "assistant",
            text: reply,
            at: now + 1,
            intent: plan.intent,
            changes: jobId ? plan.changes : undefined,
            jobId,
            credits: jobId ? 15 : 0,
          };
          set((s) => ({ chats: [...s.chats, reply_] }));
        },

        setSubdomain: (appId, raw) => {
          const sub = raw.trim().toLowerCase();
          const err = subdomainProblem(sub, appId, get().apps);
          if (err) return err;
          set((s) => ({ apps: s.apps.map((a) => (a.id === appId ? { ...a, url: `https://${sub}.pollar.app` } : a)) }));
          return null;
        },

        setShared: (appId, parts) =>
          set((s) => ({ apps: s.apps.map((a) => (a.id === appId ? { ...a, shared: parts } : a)) })),

        deployMainnet: (appId, form) => {
          const app = get().apps.find((a) => a.id === appId);
          const cost = app ? mainnetCost(app, get().apps) : { contract: MAINNET_COSTS.contract, sponsor: MAINNET_COSTS.sponsor };
          get().spendCredits(cost.contract, "Mainnet contract deploy", appId);
          if (cost.sponsor > 0) get().spendCredits(cost.sponsor, "Mainnet sponsor wallet funding", appId);
          set((s) => ({
            apps: s.apps.map((a) =>
              a.id === appId
                ? {
                    ...a,
                    network: "mainnet",
                    asset: form.asset,
                    payoutWallet: form.payoutWallet,
                    businessName: form.businessName,
                    contractId: randomContractId(),
                    // The preview now runs on mainnet. Live users switch when the maker publishes.
                    previewSha: randomHash().slice(0, 7),
                  }
                : a,
            ),
          }));
        },

        publishApp: (appId) =>
          set((s) => ({
            apps: s.apps.map((a) =>
              a.id === appId ? { ...a, status: "published", publishedSha: a.previewSha, publishedAt: Date.now() } : a,
            ),
          })),

        unpublishApp: (appId) =>
          set((s) => ({
            apps: s.apps.map((a) => (a.id === appId ? { ...a, status: "draft", listing: undefined } : a)),
          })),

        publishListing: (appId, listing) =>
          set((s) => ({
            apps: s.apps.map((a) =>
              // Testnet apps use play money and get wiped on resets, so they never go to the marketplace.
              a.id === appId && (!listing || (a.network === "mainnet" && a.status === "published")) ? { ...a, listing: listing ? { ...listing, listedAt: a.listing?.listedAt ?? Date.now() } : undefined } : a,
            ),
          })),

        rateApp: (appId, stars) =>
          set((s) => {
            const email = s.account?.email ?? "anonymous";
            const rest = s.ratings.filter((r) => !(r.appId === appId && r.email === email));
            return { ratings: [...rest, { id: newId("rt"), appId, email, stars, at: Date.now() }] };
          }),

        rotateApiKey: (appId) =>
          set((s) => ({
            apps: s.apps.map((a) => (a.id === appId ? { ...a, apiKey: randomApiKey() } : a)),
          })),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<StudioState>),
        ratings: (persisted as Partial<StudioState>)?.ratings ?? [],
        chats: (persisted as Partial<StudioState>)?.chats ?? [],
        migrations: (persisted as Partial<StudioState>)?.migrations ?? [],
      }),
      partialize: (s) => ({
        seeded: s.seeded,
        account: s.account,
        savedAccounts: s.savedAccounts,
        apps: s.apps,
        jobs: s.jobs,
        txs: s.txs,
        ledger: s.ledger,
        ratings: s.ratings,
        chats: s.chats,
        migrations: s.migrations,
      }),
    },
  ),
);

const RESERVED = ["www", "app", "api", "admin", "pollar", "studio", "docs", "mail", "help", "support", "status", "preview"];

// Why a subdomain cannot be used, or null if it is free.
export function subdomainProblem(sub: string, appId: string, apps: App[]): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/.test(sub)) return "Use 3 to 32 letters, numbers or dashes";
  if (sub.includes("--")) return "Double dashes are reserved for previews";
  if (RESERVED.includes(sub)) return "That address is reserved by Pollar";
  if (apps.some((a) => a.id !== appId && a.url === `https://${sub}.pollar.app`)) return "That address is taken";
  return null;
}

export function hydrateStudioStore(): void {
  void useStudioStore.persist.rehydrate();
  const s = useStudioStore.getState();
  s.ensureSeed();
  // Embedded previews never own a job runner, so they must not judge jobs as orphaned.
  const embedded = typeof window !== "undefined" && window.self !== window.top;
  if (!embedded) {
    s.resumeInterruptedJobs();
    setTimeout(() => useStudioStore.getState().resumeInterruptedJobs(), 6000);
  }
  s.setHydrated();
}

// Reload persisted state written by another tab or by the preview iframe.
export function syncStudioStoreFromStorage(): void {
  void useStudioStore.persist.rehydrate();
}
