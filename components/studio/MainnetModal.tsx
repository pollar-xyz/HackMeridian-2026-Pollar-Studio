"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Coins, ExternalLink, Lock, Store, X } from "lucide-react";
import type { App, Asset } from "@/lib/mock/types";
import { useStudioStore, MAINNET_COSTS, mainnetCost, sharedSponsorFrom } from "@/lib/mock/store";
import { useUiStore } from "@/lib/mock/ui-store";
import { useT } from "@/lib/i18n";
import { hashString, makeRng, shortHash, shortWallet, walletAddress } from "@/lib/mock/random";
import { Modal, Spinner } from "@/components/Modal";
import { Button, buttonClass } from "@/components/ui/Button";
import { unitFor } from "@/lib/mock/format";
import { inputClass } from "@/components/ui/Field";
import { AssetIcon, StellarIcon } from "@/components/AssetIcons";
import { CopyButton } from "@/components/CopyButton";

const STEPS = ["Verifying your details", "Compiling the contract for mainnet", "Deploying the contract on Stellar mainnet", "Funding the sponsor wallet", "Verifying on stellar.expert"];

// Moving to mainnet deploys a fresh contract that handles real money, so it asks for the payout details first.
export function MainnetModal({
  app,
  open,
  publishTo,
  onClose,
  onListInMarketplace,
}: {
  app: App;
  open: boolean;
  publishTo?: string;
  onClose: () => void;
  onListInMarketplace: () => void;
}) {
  const t = useT();
  const account = useStudioStore((s) => s.account);
  const deployMainnet = useStudioStore((s) => s.deployMainnet);
  const setSubdomain = useStudioStore((s) => s.setSubdomain);
  const publishApp = useStudioStore((s) => s.publishApp);
  const openSettings = useUiStore((s) => s.openSettings);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);

  // Earnings land in the maker's own Pollar wallet by default.
  const ownWallet = walletAddress(makeRng(hashString(account?.email ?? app.id)));
  const [wallet, setWallet] = useState(app.payoutWallet ?? ownWallet);
  const [customWallet, setCustomWallet] = useState(false);
  const [business, setBusiness] = useState(app.maker?.name ?? "");
  const asset = (app.asset as Asset) ?? "USDC";
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<"form" | "deploying" | "done">("form");
  const [step, setStep] = useState(0);

  const apps = useStudioStore((s) => s.apps);
  // Sharing the sponsor wallet with an app already on mainnet skips the funding.
  const cost = mainnetCost(app, apps);
  const sponsorSource = sharedSponsorFrom(app, apps);
  const total = cost.total;
  const credits = account?.credits ?? 0;
  const freePlan = (account?.plan ?? "free") === "free";
  const walletOk = /^G[A-Z2-7]{55}$/.test(wallet.trim());
  const enough = credits >= total;
  const ready = !freePlan && enough && walletOk && business.trim().length > 1 && agree;

  useEffect(() => {
    if (state !== "deploying") return;
    const id = setTimeout(() => {
      if (step + 1 >= STEPS.length) {
        deployMainnet(app.id, { payoutWallet: wallet.trim(), asset, businessName: business.trim() });
        // Opened from Publish: once the contract is on mainnet, make the app live at the chosen address.
        if (publishTo) {
          const current = app.url.replace("https://", "").replace(".pollar.app", "");
          if (publishTo !== current) setSubdomain(app.id, publishTo);
          publishApp(app.id);
        }
        setState("done");
      } else {
        setStep((s) => s + 1);
      }
    }, 900);
    return () => clearTimeout(id);
  }, [state, step, app.id, app.url, wallet, asset, business, deployMainnet, publishTo, setSubdomain, publishApp]);

  const close = () => {
    setState("form");
    setStep(0);
    onClose();
  };

  return (
    <Modal open={open} onClose={state === "deploying" ? undefined : close} size="lg" bare>
      <div className="flex max-h-[85vh] flex-col overflow-y-auto">
        {state === "form" && (
          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                  <StellarIcon size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{t("Publish on Stellar mainnet")}</h2>
                  <p className="text-sm text-muted">{t("We deploy a new contract that moves real money. Tell us where your earnings go.")}</p>
                </div>
              </div>
              <button type="button" onClick={close} className="rounded-md p-1 text-muted hover:bg-background" aria-label={t("Close")}>
                <X size={18} />
              </button>
            </div>

            {freePlan && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
                <Lock size={16} className="shrink-0" />
                <span className="flex-1">{t("Mainnet is part of the Builder plan.")}</span>
                <Button
                  size="sm"
                  onClick={() => {
                    close();
                    openSettings("plan");
                  }}
                >
                  {t("Upgrade plan")}
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t("Where your earnings go")}</span>
              {!customWallet ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-background px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <StellarIcon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{t("Your Pollar wallet")}</span>
                    <span className="block truncate font-mono text-xs text-muted">{shortWallet(wallet)}</span>
                  </span>
                  <button type="button" onClick={() => setCustomWallet(true)} className="shrink-0 text-xs font-medium text-accent hover:underline">
                    {t("Use another wallet")}
                  </button>
                </div>
              ) : (
                <input
                  autoFocus
                  value={wallet === ownWallet ? "" : wallet}
                  onChange={(e) => setWallet(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="G..."
                  spellCheck={false}
                  className={`${inputClass} font-mono text-xs ${wallet && !walletOk ? "border-danger" : ""}`}
                />
              )}
              <span className={`text-xs ${customWallet && wallet && !walletOk ? "text-danger" : "text-muted"}`}>
                {customWallet && wallet && !walletOk
                  ? t("A Stellar address starts with G and has 56 characters.")
                  : t("What your users pay arrives here. Credits only pay for the deploy, never your earnings.")}
              </span>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{t("Business or project name")}</span>
              <input value={business} onChange={(e) => setBusiness(e.target.value)} className={`${inputClass} text-sm`} />
              <span className="text-xs text-muted">{t("Shown on the receipts your users get.")}</span>
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm">
              <AssetIcon asset={asset} size={22} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{t("Settles in {asset}", { asset })}</span>
                <span className="block text-xs text-muted">{t("Picked when you created the app. Ask the chat to change it.")}</span>
              </span>
            </div>

            <div className="rounded-xl border border-line">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-medium">
                <Coins size={15} className="text-accent" /> {t("What it costs")}
              </div>
              <ul className="divide-y divide-line text-sm">
                <li className="flex justify-between px-4 py-2">
                  <span className="text-muted">{t("Contract deploy on Stellar mainnet")}</span>
                  <span className="tabular-nums">{t("{n} credits", { n: MAINNET_COSTS.contract })}</span>
                </li>
                <li className="flex justify-between px-4 py-2">
                  <span className="text-muted">
                    {sponsorSource ? t("Sponsor wallet, shared with {name}", { name: sponsorSource.name }) : t("Sponsor wallet funding, it pays your users' network fees")}
                  </span>
                  {sponsorSource ? (
                    <span className="tabular-nums">
                      <span className="mr-1.5 text-muted line-through">{MAINNET_COSTS.sponsor}</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">{t("{n} credits", { n: 0 })}</span>
                    </span>
                  ) : (
                    <span className="tabular-nums">{t("{n} credits", { n: MAINNET_COSTS.sponsor })}</span>
                  )}
                </li>
                <li className="flex justify-between px-4 py-2 font-semibold">
                  <span>{t("Total")}</span>
                  <span className="tabular-nums">{t("{n} credits", { n: total })}</span>
                </li>
              </ul>
              <p className="border-t border-line px-4 py-2 text-xs text-muted">
                {t("Stellar charges XLM to store the contract and for every transaction. Your credits fund your own sponsor wallet, which pays those fees so your users never need gas.")}
              </p>
            </div>

            {!enough && !freePlan && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="flex-1">{t("You have {have} credits, you need {need}.", { have: credits, need: total })}</span>
                <Button size="sm" onClick={() => setCreditsOpen(true)}>
                  {t("Add credits")}
                </Button>
              </div>
            )}

            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
              <span className="text-muted">{t("I understand mainnet moves real money and my users will pay real stablecoins.")}</span>
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close}>
                {t("Cancel")}
              </Button>
              <Button onClick={() => setState("deploying")} disabled={!ready}>
                {t("Verify and deploy, {n} credits", { n: total })}
              </Button>
            </div>
          </div>
        )}

        {state === "deploying" && (
          <div className="flex flex-col gap-4 p-6">
            <h2 className="text-lg font-semibold">{t("Deploying to Stellar mainnet")}</h2>
            <ol className="flex flex-col gap-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      i < step ? "bg-accent text-white" : i === step ? "bg-accent-soft" : "bg-background text-muted"
                    }`}
                  >
                    {i < step ? <Check size={13} /> : i === step ? <Spinner className="h-3.5 w-3.5" /> : <span className="text-[11px]">{i + 1}</span>}
                  </span>
                  <span className={i <= step ? "text-foreground" : "text-muted"}>{t(s)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {state === "done" && (
          <MainnetDone
            app={app}
            published={!!publishTo}
            onClose={close}
            onList={() => {
              close();
              onListInMarketplace();
            }}
          />
        )}
      </div>
    </Modal>
  );
}

function MainnetDone({ app, published, onClose, onList }: { app: App; published: boolean; onClose: () => void; onList: () => void }) {
  const t = useT();
  const fresh = useStudioStore((s) => s.apps.find((a) => a.id === app.id)) ?? app;
  const host = fresh.url.replace("https://", "");
  const unit = unitFor(fresh.assets);
  const asset = (fresh.asset ?? "USDC") as Asset;

  return (
    <div className="flex flex-col">
      {/* Header band: what happened, in one glance. */}
      <div className="flex items-center gap-4 border-b border-line bg-emerald-50 px-6 py-5 dark:bg-emerald-500/10">
        <span className="pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <Check size={24} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{published ? t("Your app is live on mainnet") : t("Your contract is on mainnet")}</p>
          <p className="text-sm text-muted">
            {published
              ? unit === "XLM"
                ? t("Users now pay with real XLM.")
                : t("Users now pay with real stablecoins.")
              : t("Your preview now uses it. Publish when you are ready and your users move to mainnet.")}
          </p>
        </div>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 bg-surface px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex dark:border-emerald-500/40 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Mainnet
        </span>
      </div>

      <dl className="divide-y divide-line px-6 py-2 text-sm">
        {published && (
          <DoneRow label={t("Address")}>
            <span className="truncate font-mono">{host}</span>
            <CopyButton value={fresh.url} compact />
          </DoneRow>
        )}
        {fresh.contractId && (
          <DoneRow label={t("Contract")}>
            <span className="truncate font-mono">{shortHash(fresh.contractId)}</span>
            <CopyButton value={fresh.contractId} compact />
            <a
              href={`https://stellar.expert/explorer/public/contract/${fresh.contractId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              stellar.expert <ExternalLink size={12} />
            </a>
          </DoneRow>
        )}
        {fresh.payoutWallet && (
          <DoneRow label={t("Earnings go to")}>
            <span className="truncate font-mono">{shortWallet(fresh.payoutWallet)}</span>
          </DoneRow>
        )}
        <DoneRow label={t("Settles in")}>
          <AssetIcon asset={asset} size={16} />
          <span className="font-medium">{asset}</span>
        </DoneRow>
      </dl>

      <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          {t("Done")}
        </Button>
        {published && !fresh.listing && (
          <Button variant="secondary" onClick={onList}>
            <Store size={14} /> {t("List in marketplace")}
          </Button>
        )}
        {published && (
          <a href={`/preview/${fresh.slug}`} target="_blank" rel="noreferrer" className={buttonClass("primary")}>
            {t("Open app")} <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}

function DoneRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <dt className="w-32 shrink-0 text-muted">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2">{children}</dd>
    </div>
  );
}
