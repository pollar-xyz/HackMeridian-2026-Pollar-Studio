"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Fuel, Globe, Landmark, Lock, MessageCircle, Send, Smartphone, X } from "lucide-react";
import { useStudioStore, GENERATION_LIMIT } from "@/lib/mock/store";
import { useUiStore } from "@/lib/mock/ui-store";
import { CREDIT_COSTS } from "@/lib/mock/jobs";
import { useT } from "@/lib/i18n";
import type { Account, Asset, RailCountry, Target } from "@/lib/mock/types";
import { ASSETS, RAIL_COUNTRIES, SOON_COUNTRIES, TARGET_LABELS } from "@/lib/mock/types";
import { AssetIcon, StellarIcon } from "@/components/AssetIcons";
import { MultiDropdown } from "@/components/ui/Dropdown";
import { Notice } from "@/components/ui/Notice";

const MIN_CREDITS = CREDIT_COSTS.generating + CREDIT_COSTS.building + CREDIT_COSTS.publishing;

const TARGETS: Array<{ key: Target; Icon: typeof Globe; state: "ready" | "new" | "soon" }> = [
  { key: "web", Icon: Globe, state: "ready" },
  { key: "telegram", Icon: Send, state: "new" },
  { key: "mobile", Icon: Smartphone, state: "soon" },
  { key: "whatsapp", Icon: MessageCircle, state: "soon" },
];

const ASSET_NOTES: Record<Asset, string> = {
  USDC: "Stablecoin, default for payments",
  USDT: "Stablecoin, new on Stellar",
  XLM: "Native asset, lowest fees",
};

export function Composer({ account, autoFocus }: { account: Account; autoFocus?: boolean }) {
  const router = useRouter();
  const t = useT();
  const createApp = useStudioStore((s) => s.createApp);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const openSettings = useUiStore((s) => s.openSettings);
  const [prompt, setPrompt] = useState("");
  const [target, setTarget] = useState<Target>("web");
  const [assets, setAssets] = useState<Asset[]>(["USDC"]);
  const [barHidden, setBarHidden] = useState(false);
  const [countries, setCountries] = useState<RailCountry[]>(["BO", "BR", "AR"]);
  const [error, setError] = useState<string | null>(null);

  const freePlan = (account.plan ?? "free") === "free";
  const limitReached = freePlan && account.generationsUsed >= GENERATION_LIMIT;
  const lowCredits = account.credits < MIN_CREDITS;
  const ready = prompt.trim().length > 0 && !limitReached && !lowCredits;

  const submit = () => {
    if (!ready) return;
    try {
      const appId = createApp(prompt, { assets: assets.length ? assets : ["XLM"], countries, network: "testnet", target });
      router.push(`/studio/${appId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Could not start the generation"));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="drop-shadow-sm">
        {/* Tabs share the width and shrink with their labels, ending before the box's rounded corner so none gets clipped. */}
        <div className="flex gap-1 pr-4">
          {TARGETS.map(({ key, Icon, state }) => {
            const active = target === key;
            const disabled = state === "soon";
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => setTarget(key)}
                title={t(TARGET_LABELS[key])}
                className={`relative -mb-px inline-flex min-w-0 flex-initial items-center justify-center gap-2 rounded-t-xl px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                  active ? "bg-surface text-foreground" : disabled ? "bg-white/10 text-white/50" : "bg-white/15 text-white/85 hover:bg-white/25"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className={`min-w-0 truncate ${active ? "" : "hidden sm:inline"}`}>{key === "telegram" ? "Telegram" : t(TARGET_LABELS[key])}</span>
                {state === "new" && (
                  <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] ${active ? "bg-accent-soft text-accent" : "bg-white/20"}`}>{t("New")}</span>
                )}
                {state === "soon" && <span className="hidden shrink-0 rounded-full bg-white/10 px-1.5 py-px text-[10px] md:inline">{t("Soon")}</span>}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl rounded-tl-none bg-surface p-3">
          <textarea
            autoFocus={autoFocus}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={3}
            placeholder={t("Describe your app. Example: a rotating savings circle for 10 friends with weekly contributions")}
            className="w-full resize-none bg-transparent px-1 py-1 text-base text-foreground outline-none placeholder:text-muted/70 focus-visible:outline-none"
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
              title={t("Every app runs on Stellar. It starts on testnet, move it to mainnet when you publish.")}
            >
              <StellarIcon size={14} className="text-foreground" /> Stellar
            </span>
            <SponsoredChip />
            <MultiDropdown<Asset>
              label={assets.length ? assets.join(" · ") : t("XLM only")}
              icon={
                <span className="flex -space-x-1">
                  {(assets.length ? assets : (["XLM"] as Asset[])).map((a) => (
                    <span key={a} className="rounded-full ring-2 ring-background">
                      <AssetIcon asset={a} size={16} />
                    </span>
                  ))}
                </span>
              }
              values={assets}
              onChange={setAssets}
              allowEmpty
              hint={
                assets.length ? (
                  <>
                    {t("Users can pay with any of these. The first one is what you receive.")}{" "}
                    <span className="text-foreground">{t("Pick none and your app works only with XLM.")}</span>
                  </>
                ) : (
                  <span className="text-foreground">{t("No stablecoin picked. Your app will take and pay out everything in XLM, Stellar's native asset. Its price moves, so balances are not pegged to a currency.")}</span>
                )
              }
              items={ASSETS.map((a) => ({ value: a, label: a, note: t(ASSET_NOTES[a]), icon: <AssetIcon asset={a} size={20} /> }))}
            />
            <MultiDropdown<RailCountry>
              label={
                countries.length === 0
                  ? t("No bank rails")
                  : countries.length === RAIL_COUNTRIES.length
                    ? t("3 countries")
                    : countries.map((c) => RAIL_COUNTRIES.find((r) => r.code === c)?.currency).join(" · ")
              }
              icon={
                countries.length ? (
                  <span className="text-sm leading-none">{countries.map((c) => RAIL_COUNTRIES.find((r) => r.code === c)?.flag).join("")}</span>
                ) : (
                  <Landmark size={14} className="text-muted" />
                )
              }
              values={countries}
              onChange={setCountries}
              allowEmpty
              hint={
                countries.length ? (
                  <>
                    {t("Where users can add money and cash out to a bank.")}{" "}
                    <span className="text-foreground">{t("Optional, pick none to skip banks.")}</span>
                  </>
                ) : (
                  <span className="text-foreground">{t("No country picked. Users add and withdraw money only from Stellar wallets and exchanges, with no bank or identity check.")}</span>
                )
              }
              soonLabel={t("Soon")}
              items={[
                ...RAIL_COUNTRIES.map((c) => ({
                  value: c.code,
                  label: `${t(c.name)} · ${c.currency}`,
                  note: t("{rail} in, bank cashout out", { rail: c.rail }),
                  icon: <span className="text-lg leading-none">{c.flag}</span>,
                })),
                // Coming soon: listed so makers see where Pollar is going, but not selectable yet.
                ...SOON_COUNTRIES.map((c) => ({
                  value: c.code as RailCountry,
                  label: `${t(c.name)} · ${c.currency}`,
                  note: t("Coming soon"),
                  soon: true,
                  icon: <span className="text-lg leading-none">{c.flag}</span>,
                })),
              ]}
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={!ready}
                aria-label={t("Generate app")}
                title={t("Generate app, {n} credits", { n: CREDIT_COSTS.generating + CREDIT_COSTS.building + CREDIT_COSTS.publishing })}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </div>
        </div>
        {/* Attached under the composer, like a tab hanging from it: why you cannot generate, and the fix. */}
        {(limitReached || lowCredits) && !barHidden && (
          <div className="mx-3 flex items-center gap-3 rounded-b-xl bg-black/45 px-4 py-2 text-sm text-white/85 backdrop-blur-md">
            <span className="min-w-0 flex-1 truncate">
              {limitReached
                ? t("You used your {limit} free generations.", { limit: GENERATION_LIMIT })
                : account.credits <= 0
                  ? t("You are out of credits.")
                  : t("A new app needs {min} credits, you have {have}.", { min: MIN_CREDITS, have: account.credits })}
            </span>
            <button
              type="button"
              onClick={() => (limitReached ? openSettings("plan") : setCreditsOpen(true))}
              className="shrink-0 font-medium text-white hover:underline"
            >
              {limitReached ? t("Upgrade plan") : t("Buy credits")}
            </button>
            <button type="button" onClick={() => setBarHidden(true)} aria-label={t("Close")} className="shrink-0 text-white/60 hover:text-white">
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {error && <Notice>{error}</Notice>}
    </div>
  );
}

// Always on: every app pays its users' network fees from the maker's own sponsor wallet, funded with credits.
// Shown locked so makers know it is there, with a short why on click.
function SponsoredChip() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent"
      >
        <Fuel size={13} className="text-accent" /> {t("Sponsored")}
        <Lock size={11} className="text-muted" />
      </button>
      {open && (
        <div className="rise absolute bottom-full left-0 z-20 mb-1.5 w-72 rounded-xl border border-line bg-surface p-3 text-left text-xs shadow-sm">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Fuel size={14} className="text-accent" /> {t("Always sponsored")}
          </p>
          <p className="mt-1 leading-relaxed text-muted">
            {t("Your users pay no fees and never need gas. Your app's sponsor wallet pays them with your credits.")}
          </p>
        </div>
      )}
    </div>
  );
}
