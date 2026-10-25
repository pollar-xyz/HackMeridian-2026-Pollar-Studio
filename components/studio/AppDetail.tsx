"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Folder,
  GitBranch,
  GitCommitHorizontal,
  Lock,
  Monitor,
  RefreshCw,
  Globe,
  Rocket,
  Smartphone,
  Store,
} from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import type { App, Job, Tx } from "@/lib/mock/types";
import { COUNTRY_NAMES } from "@/lib/mock/types";
import { shortHash, shortWallet } from "@/lib/mock/random";
import { formatAmount, formatDuration } from "@/lib/mock/format";
import { isTerminal } from "@/lib/mock/jobs";
import { useAgo, useT } from "@/lib/i18n";
import { CopyButton } from "@/components/CopyButton";
import { JobStepper } from "@/components/JobStepper";
import { LogPanel } from "@/components/LogPanel";
import { Modal, Spinner } from "@/components/Modal";
import { toast } from "@/components/Toast";
import { useStudioAccount, StudioLoading } from "@/components/StudioGate";
import { Button, buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { IntegrationList } from "@/components/studio/JobView";
import { BuiltWith } from "@/components/studio/BuiltWith";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { ContractView } from "@/components/studio/ContractView";
import { PublishListingModal } from "@/components/studio/PublishListingModal";
import { PublishModal } from "@/components/studio/PublishModal";
import { MainnetModal } from "@/components/studio/MainnetModal";
import { AppLogo } from "@/components/studio/ListingArt";

type Tab = "preview" | "contract" | "stack" | "deploys" | "settings";
const TABS: Array<{ key: Tab; label: string }> = [
  { key: "preview", label: "Preview" },
  { key: "contract", label: "Contract" },
  { key: "stack", label: "Built with" },
  { key: "deploys", label: "Deploys" },
  { key: "settings", label: "Settings" },
];

export function AppDetail() {
  const t = useT();
  const params = useParams<{ appId: string }>();
  const appId = params.appId;
  const account = useStudioAccount();
  const app = useStudioStore((s) => s.apps.find((a) => a.id === appId));
  const allJobs = useStudioStore((s) => s.jobs);
  const allTxs = useStudioStore((s) => s.txs);
  const jobs = useMemo(
    () => allJobs.filter((j) => j.appId === appId),
    [allJobs, appId],
  );
  const slug = app?.slug;
  const txs = useMemo(
    () => allTxs.filter((tx) => tx.appSlug === slug),
    [allTxs, slug],
  );
  const [tab, setTab] = useState<Tab>("preview");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const [mainnetSub, setMainnetSub] = useState<string | undefined>(undefined);
  const [publishOpen, setPublishOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [mainnetOpen, setMainnetOpen] = useState(false);

  // Toast once when a rebuild from chat or a push finishes.
  const watched = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!app) return;
    for (const job of jobs) {
      if (
        (job.trigger === "push" || job.trigger === "chat") &&
        job.status === "published" &&
        !watched.current.has(job.id)
      ) {
        watched.current.add(job.id);
        if (job.finishedAt && Date.now() - job.finishedAt < 5000) {
          toast(
            app.status === "published"
              ? t("Preview updated. Publish to make it live.")
              : t("Preview updated"),
          );
        }
      }
    }
  }, [jobs, app, t]);

  if (!account) return <StudioLoading />;

  if (!app) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted">{t("This app does not exist.")}</p>
        <Link
          href="/studio/apps"
          className="text-sm font-medium text-accent hover:underline"
        >
          {t("Back to my apps")}
        </Link>
      </div>
    );
  }

  const sortedJobs = [...jobs].sort((a, b) => b.startedAt - a.startedAt);
  const activeJob = sortedJobs.find((j) => !isTerminal(j.status));

  return (
    <div className="flex flex-1 flex-col p-3 sm:p-4 lg:h-dvh lg:min-h-0 lg:flex-none">
      {/* One workspace window: the chat and the app browser share the same frame. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex-row">
        <aside className="flex h-[28rem] w-full shrink-0 flex-col border-b border-line lg:h-auto lg:w-[22rem] lg:border-b-0 lg:border-r xl:w-[25rem]">
          <ChatPanel app={app} onShowTab={(next) => setTab(next)} embedded />
        </aside>

        <Tabs
          asChild
          value={tab}
          onValueChange={(value) => setTab(value as typeof tab)}
        >
          <section className="flex min-h-0 min-w-0 flex-1 flex-col">
            <BrowserBar
              app={app}
              activeJob={activeJob}
              onPublish={() => setPublishOpen(true)}
              onListing={() => setListingOpen(true)}
            />
            <div className="flex shrink-0 items-center overflow-x-auto border-b border-line bg-background px-2 pt-1.5">
              <TabsList aria-label={t("App")} className="flex shrink-0 gap-0.5">
                {TABS.map((item) => {
                  const active = tab === item.key;
                  return (
                    <TabsTrigger
                      key={item.key}
                      value={item.key}
                      className={`workspace-tab -mb-px inline-flex items-center gap-1.5 whitespace-nowrap rounded-none rounded-t-lg border px-3.5 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-line border-b-surface bg-surface font-medium text-foreground"
                          : "border-transparent text-muted hover:bg-surface/60 hover:text-foreground"
                      }`}
                    >
                      {t(item.label)}
                      {item.key === "deploys" && activeJob && (
                        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {tab === "preview" && app.previewSha && (
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(value) => {
                    if (value) setMode(value as typeof mode);
                  }}
                  aria-label={t("Preview")}
                  className="ml-auto shrink-0 gap-0.5 self-center pb-1 pl-2"
                >
                  {(["desktop", "mobile"] as const).map((m) => (
                    <ToggleGroupItem
                      key={m}
                      value={m}
                      title={m === "desktop" ? t("Desktop") : t("Mobile")}
                      aria-label={m === "desktop" ? t("Desktop") : t("Mobile")}
                      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                        mode === m
                          ? "bg-surface text-accent shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {m === "desktop" ? (
                        <Monitor size={15} />
                      ) : (
                        <Smartphone size={15} />
                      )}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            </div>

            <TabsContent
              key={tab}
              value={tab}
              className={`min-h-0 flex-1 overflow-y-auto ${tab === "preview" ? "bg-background" : "flex flex-col gap-4 bg-background p-4 sm:p-5"}`}
            >
              {tab === "preview" && (
                <PreviewTab app={app} job={sortedJobs[0]} mode={mode} />
              )}
              {tab === "contract" && (
                <>
                  <ContractView app={app} />
                  <Movements app={app} txs={txs} />
                </>
              )}
              {tab === "stack" && <BuiltWith app={app} />}
              {tab === "deploys" && <DeploysTab app={app} jobs={sortedJobs} />}
              {tab === "settings" && (
                <>
                  <DomainSection
                    app={app}
                    onPublish={() => setPublishOpen(true)}
                  />
                  <EnvTab app={app} />
                </>
              )}
            </TabsContent>
          </section>
        </Tabs>
      </div>
      <PublishModal
        app={app}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onListInMarketplace={() => setListingOpen(true)}
        onMainnet={(sub) => {
          setMainnetSub(sub);
          setMainnetOpen(true);
        }}
      />
      <PublishListingModal
        app={app}
        open={listingOpen}
        onClose={() => setListingOpen(false)}
      />
      <MainnetModal
        app={app}
        open={mainnetOpen}
        publishTo={mainnetSub}
        onClose={() => setMainnetOpen(false)}
        onListInMarketplace={() => setListingOpen(true)}
      />
    </div>
  );
}

// Window chrome like a real browser: traffic lights, back and reload, the address with its network, and Publish.
function BrowserBar({
  app,
  activeJob,
  onPublish,
  onListing,
}: {
  app: App;
  activeJob?: Job;
  onPublish: () => void;
  onListing: () => void;
}) {
  const t = useT();
  const sub = app.url.replace("https://", "").replace(".pollar.app", "");
  const live = app.status === "published";
  const ready = !!app.previewSha;
  const hasChanges = live && app.previewSha !== app.publishedSha;
  const net = app.network === "mainnet" && live ? "mainnet" : "testnet";
  const iconBtn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground";

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-line bg-surface px-3 py-2">
      <span
        className="mr-1 hidden shrink-0 items-center gap-1.5 md:flex"
        aria-hidden
      >
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </span>
      {/* The address opens the app in a new tab, like clicking a URL. */}
      <a
        href={ready ? `/preview/${app.slug}` : undefined}
        target="_blank"
        rel="noreferrer"
        title={ready ? t("Open in new tab") : undefined}
        className="group ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent-soft/60"
      >
        <Lock size={13} className="shrink-0 text-accent" />
        <span className="truncate font-mono text-[13px]">
          {live ? (
            <>
              <span className="text-foreground">{sub}</span>
              <span className="text-muted">.pollar.app</span>
            </>
          ) : (
            <span className="text-muted">preview--{sub}.pollar.app</span>
          )}
        </span>
        <span
          className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-px text-[11px] font-semibold ${NET_STYLE[net].button}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${NET_STYLE[net].dot}`} />
          {net === "mainnet" ? "Mainnet" : "Testnet"}
        </span>
        {/* Only say something when it needs attention. Live is already on the Published button, preview in the address. */}
        {(activeJob || hasChanges) && (
          <span className="shrink-0 rounded-full bg-warn-soft px-2 py-px text-[11px] font-medium text-warn">
            {activeJob ? t("Building") : t("Unpublished changes")}
          </span>
        )}
      </a>

      {live && <CopyButton value={app.url} compact />}
      {/* Only real apps go to the marketplace, so the shortcut shows once the app is live on mainnet. */}
      {live && app.network === "mainnet" && (
        <Button
          variant="unstyled"
          type="button"
          onClick={onListing}
          title={
            app.listing ? t("In marketplace") : t("Publish to marketplace")
          }
          aria-label={
            app.listing ? t("In marketplace") : t("Publish to marketplace")
          }
          className={iconBtn}
        >
          {app.listing ? (
            <AppLogo
              app={app}
              art={app.listing.logo}
              size={18}
              className="rounded"
            />
          ) : (
            <Store size={15} />
          )}
        </Button>
      )}
      <Button
        variant="unstyled"
        type="button"
        onClick={onPublish}
        disabled={!ready}
        className={`${live && !hasChanges ? buttonClass("secondary", "sm", "ml-1 shrink-0") : buttonClass("primary", "sm", "ml-1 shrink-0")} relative`}
      >
        {hasChanges && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-amber-400" />
        )}
        <Rocket size={13} />
        {live ? (hasChanges ? t("Update") : t("Published")) : t("Publish")}
      </Button>
    </div>
  );
}

// Testnet reads as amber (play money), mainnet as green (real money).
const NET_STYLE = {
  testnet: {
    button:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  mainnet: {
    button:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
} as const;

// Where the app lives, in Settings.
function DomainSection({
  app,
  onPublish,
}: {
  app: App;
  onPublish: () => void;
}) {
  const t = useT();
  const live = app.status === "published";
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{t("Domain")}</h2>
          <p className="text-xs text-muted">
            {live
              ? t("Where your users open the app.")
              : t("Not published yet. Pick the address when you publish.")}
          </p>
        </div>
        <Button
          variant={live ? "secondary" : "primary"}
          size="sm"
          onClick={onPublish}
          disabled={!app.previewSha}
        >
          {live ? t("Change address") : t("Publish")}
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-background px-3 py-2.5">
        <Globe size={15} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate font-mono text-sm">
          {live ? app.url.replace("https://", "") : t("Not published")}
        </span>
        {live && <CopyButton value={app.url} compact />}
      </div>
      <p className="mt-2 text-xs text-muted">
        {t("Custom domains like pay.yourshop.com come with the Builder plan.")}
      </p>
    </div>
  );
}

function PreviewTab({
  app,
  job,
  mode,
}: {
  app: App;
  job?: Job;
  mode: "mobile" | "desktop";
}) {
  const t = useT();
  const previewPath = `/preview/${app.slug}`;

  if (!app.previewSha) {
    if (job && !isTerminal(job.status)) {
      return (
        <div className="grid grid-cols-1 gap-4 bg-background p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <JobStepper status={job.status} attempt={job.attempt} />
            </div>
            <LogPanel logs={job.logs} maxHeight={420} />
          </div>
          <IntegrationList job={job} />
        </div>
      );
    }
    return (
      <div className="m-5 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
        {t("The preview appears once the first build finishes.")}
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {mode === "desktop" ? (
        <iframe
          title={`${app.name} preview`}
          src={previewPath}
          className="block h-full min-h-[560px] w-full bg-surface"
        />
      ) : (
        <div className="flex justify-center overflow-x-auto px-3 py-6">
          <div
            className="shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-lg"
            style={{ width: 402 }}
          >
            {/* The mask forces Chrome to clip the iframe layer to the rounded corners. */}
            <div
              className="overflow-hidden rounded-[1.7rem] bg-surface"
              style={{
                WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                maskImage: "linear-gradient(white, white)",
              }}
            >
              <iframe
                title={`${app.name} preview`}
                src={previewPath}
                className="block"
                style={{ width: 390, height: 720 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// What went through the contract, live.
function Movements({ app, txs }: { app: App; txs: Tx[] }) {
  const t = useT();
  const ago = useAgo();
  const asset = app.asset ?? "USDC";
  const sorted = [...txs].sort((a, b) => b.at - a.at);
  const inflow = txs
    .filter((tx) => tx.type === "payment")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const outflow = txs
    .filter((tx) => tx.type === "cashout")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t("What went through the contract")}
        </h2>
        {txs.length > 0 && (
          <p className="text-xs text-muted">
            <span className="font-semibold text-accent-strong">
              +{formatAmount(inflow)}
            </span>{" "}
            {t("in")} ·{" "}
            <span className="font-semibold text-foreground">
              -{formatAmount(outflow)}
            </span>{" "}
            {t("to banks")} · {asset}
          </p>
        )}
      </div>
      {sorted.length === 0 ? (
        <p className="mt-3 rounded-xl bg-background px-4 py-6 text-center text-sm text-muted">
          {t(
            "Nothing yet. Open the app, sign in with the passkey and pay, it shows up here right away.",
          )}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {sorted.slice(0, 12).map((tx) => {
            const isCashout = tx.type === "cashout";
            return (
              <li
                key={tx.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCashout ? "bg-background text-muted" : "bg-accent-soft text-accent"}`}
                >
                  {isCashout ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownLeft size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {isCashout ? t("Cashout to bank") : t("Payment")}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {COUNTRY_NAMES[tx.country]} · {shortWallet(tx.from)} ·{" "}
                    <span className="font-mono">{shortHash(tx.hash)}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`tabular-nums ${isCashout ? "" : "text-accent-strong"}`}
                  >
                    {isCashout ? "-" : "+"}
                    {formatAmount(tx.amount)}{" "}
                    <span className="text-xs text-muted">{asset}</span>
                  </p>
                  <p className="text-xs text-muted">{ago(tx.at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const REPO_TREE: Array<{
  name: string;
  dir?: boolean;
  depth: number;
  note?: string;
}> = [
  { name: "AGENTS.md", depth: 0, note: "Rules for your AI" },
  { name: "app", dir: true, depth: 0, note: "Screens" },
  { name: "components", dir: true, depth: 0, note: "UI pieces" },
  { name: "contracts", dir: true, depth: 0, note: "Payment contract" },
  { name: "lib", dir: true, depth: 0 },
  { name: "pollar.ts", depth: 1, note: "Pollar SDK setup" },
  { name: ".env.example", depth: 0 },
  { name: "package.json", depth: 0 },
];

function shortSha(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

const TRIGGER_LABEL = {
  prompt: "Prompt",
  push: "GitHub",
  manual: "Manual",
  chat: "Chat",
} as const;

function DeploysTab({ app, jobs }: { app: App; jobs: Job[] }) {
  const t = useT();
  const exportToGithub = useStudioStore((s) => s.exportToGithub);
  const simulatePush = useStudioStore((s) => s.simulatePush);
  const rebuildApp = useStudioStore((s) => s.rebuildApp);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [showTree, setShowTree] = useState(false);
  const activeJob = jobs.find((j) => !isTerminal(j.status));
  const repoPath = app.github?.repoUrl.replace("https://github.com/", "");

  const connect = () => {
    setConnecting(true);
    setTimeout(() => {
      exportToGithub(app.id);
      setConnecting(false);
      toast(t("Repository created"));
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface p-5">
        {!app.github ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
              <GitBranch size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t("Connect GitHub")}</p>
              <p className="text-sm text-muted">
                {t(
                  "We create a repo with the full code. Every push to main redeploys to the same link.",
                )}
              </p>
            </div>
            <Button variant="ink" onClick={connect}>
              {t("Export to GitHub")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                <GitBranch size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={app.github.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 truncate font-mono text-sm font-semibold hover:underline"
                >
                  {repoPath} <ExternalLink size={12} className="text-muted" />
                </a>
                <p className="flex items-center gap-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 font-mono">
                    <GitBranch size={11} /> main
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />{" "}
                    {t("Auto deploy on push")}
                  </span>
                </p>
              </div>
              <CopyButton
                value={`git clone ${app.github.repoUrl}.git`}
                label={t("Copy clone command")}
              />
            </div>

            <form
              className="flex flex-col gap-2 rounded-xl bg-background p-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (activeJob) return;
                simulatePush(app.id, message);
                setMessage("");
              }}
            >
              <GitCommitHorizontal
                size={16}
                className="hidden shrink-0 text-muted sm:block"
              />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t(
                  "Commit message, for example: change the hero text",
                )}
                className={`${inputClass} flex-1 bg-surface py-2 text-sm`}
              />
              <Button type="submit" disabled={!!activeJob}>
                {t("Simulate push to main")}
              </Button>
            </form>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-sm font-semibold">{t("Deployments")}</h3>
          {jobs[0]?.status === "failed" && !activeJob && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => rebuildApp(app.id, "manual")}
            >
              <RefreshCw size={12} /> {t("Rebuild")}
            </Button>
          )}
        </div>
        <ul className="divide-y divide-line">
          {jobs.map((job) => (
            <DeployRow
              key={job.id}
              job={job}
              live={!!app.publishedSha && job.commit?.sha === app.publishedSha}
              preview={
                job.commit?.sha === app.previewSha &&
                app.previewSha !== app.publishedSha
              }
            />
          ))}
        </ul>
      </section>

      <Collapsible asChild open={showTree} onOpenChange={setShowTree}>
        <section className="rounded-2xl border border-line bg-surface">
          <CollapsibleTrigger asChild>
            <Button
              variant="unstyled"
              type="button"
              className="flex w-full items-center justify-between px-5 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {t("What is in the repo")}
                </span>
                <span className="block text-xs text-muted">
                  {t(
                    "AGENTS.md carries the template rules so your own AI keeps building the same way.",
                  )}
                </span>
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted transition-transform ${showTree ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="border-t border-line px-5 py-3 font-mono text-sm">
              {REPO_TREE.map((f) => (
                <li
                  key={f.name}
                  className="flex items-center gap-2 py-1"
                  style={{ paddingLeft: f.depth * 20 }}
                >
                  {f.dir ? (
                    <Folder size={14} className="text-accent" />
                  ) : (
                    <FileText size={14} className="text-muted" />
                  )}
                  <span>{f.name}</span>
                  {f.note && (
                    <span className="ml-auto font-sans text-xs text-muted">
                      {t(f.note)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </section>
      </Collapsible>

      <Modal open={connecting}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <GitBranch size={28} />
          <p className="text-sm font-medium">{t("Connecting to GitHub")}</p>
          <Spinner />
        </div>
      </Modal>
    </div>
  );
}

function DeployRow({
  job,
  live,
  preview,
}: {
  job: Job;
  live: boolean;
  preview: boolean;
}) {
  const t = useT();
  const ago = useAgo();
  const [open, setOpen] = useState(!isTerminal(job.status));
  const duration = job.finishedAt ? job.finishedAt - job.startedAt : null;
  const dot =
    job.status === "published"
      ? "bg-[#28c840]"
      : job.status === "failed"
        ? "bg-danger"
        : "bg-amber-400 live-dot";
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <li>
        <CollapsibleTrigger asChild>
          <Button
            variant="unstyled"
            type="button"
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm hover:bg-background"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {job.commit?.message ??
                    (job.trigger === "prompt"
                      ? t("Initial generation from your prompt")
                      : t(TRIGGER_LABEL[job.trigger]))}
                </span>
                {live && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-medium text-accent">
                    {t("Live")}
                  </span>
                )}
                {preview && (
                  <span className="shrink-0 rounded-full bg-warn-soft px-1.5 py-px text-[10px] font-medium text-warn">
                    {t("Preview")}
                  </span>
                )}
              </span>
              <span className="block truncate text-xs text-muted">
                <span className="font-mono">
                  {job.commit?.sha ?? shortSha(job.id)}
                </span>{" "}
                · {t(TRIGGER_LABEL[job.trigger])} · {ago(job.startedAt)}
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted">
              {duration !== null ? formatDuration(duration) : t("running")}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t border-line bg-background px-5 py-4">
            <JobStepper status={job.status} attempt={job.attempt} />
            <LogPanel logs={job.logs} maxHeight={220} />
          </div>
        </CollapsibleContent>
      </li>
    </Collapsible>
  );
}

// The values the app runs with, as a .env you can copy into your own repo.
function EnvTab({ app }: { app: App }) {
  const t = useT();
  const rotateApiKey = useStudioStore((s) => s.rotateApiKey);
  const [reveal, setReveal] = useState(false);
  const mask = (v: string) =>
    reveal ? v : `${v.slice(0, 9)}${"•".repeat(16)}`;

  const vars: Array<{
    key: string;
    value: string;
    secret?: boolean;
    note: string;
  }> = [
    {
      key: "POLLAR_API_KEY",
      value: app.apiKey,
      secret: true,
      note: "Server only. Signs requests to Pollar.",
    },
    {
      key: "NEXT_PUBLIC_POLLAR_APP",
      value: app.slug,
      note: "Public id of this app.",
    },
    {
      key: "STELLAR_NETWORK",
      value: app.network ?? "testnet",
      note: "Where the contract lives.",
    },
    {
      key: "POLLAR_CONTRACT_ID",
      value: app.contractId ?? "",
      note: "Your payment contract.",
    },
    {
      key: "POLLAR_SETTLEMENT_ASSET",
      value: app.asset ?? "USDC",
      note: "Asset users pay in.",
    },
    {
      key: "POLLAR_SPONSOR_WALLET",
      value: app.sponsorWallet,
      note: "Pays your users' network fees. Funded with your credits.",
    },
    ...(app.payoutWallet
      ? [
          {
            key: "POLLAR_PAYOUT_WALLET",
            value: app.payoutWallet,
            note: "Where your earnings go.",
          },
        ]
      : []),
  ];
  const dotenv = vars.map((v) => `${v.key}=${v.value}`).join("\n");

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {t("Environment variables")}
            </h2>
            <p className="text-xs text-muted">
              {t(
                "What your app runs with. Paste them into .env.local if you work on the code yourself.",
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReveal((r) => !r)}
            >
              {reveal ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
              {reveal ? t("Hide") : t("Reveal")}
            </Button>
            <CopyButton value={dotenv} label={t("Copy .env")} />
          </div>
        </div>
        <ul className="divide-y divide-line">
          {vars.map((v) => (
            <li
              key={v.key}
              className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="sm:w-64 sm:shrink-0">
                <p className="font-mono text-xs font-semibold">{v.key}</p>
                <p className="text-xs text-muted">{t(v.note)}</p>
              </div>
              <code className="min-w-0 flex-1 truncate rounded-md bg-background px-2 py-1.5 font-mono text-xs">
                {v.secret ? mask(v.value) : v.value}
              </code>
              <div className="flex shrink-0 gap-1">
                <CopyButton value={v.value} compact />
                {v.key === "POLLAR_API_KEY" && (
                  <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => {
                      rotateApiKey(app.id);
                      toast(t("API key rotated"));
                    }}
                    title={t("Rotate")}
                    aria-label={t("Rotate")}
                    className="rounded p-1 text-muted hover:bg-background hover:text-foreground"
                  >
                    <RefreshCw size={14} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">
        {t(
          "Rotating the API key takes effect on the next deploy. Never share the key in client code.",
        )}
      </p>
    </div>
  );
}
