"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Fuel,
  Globe,
  Landmark,
  Lock,
  MessageCircle,
  Send,
  Smartphone,
  X,
} from "lucide-react";
import { GENERATION_LIMIT } from "@/lib/mock/store";
import { useUiStore } from "@/lib/mock/ui-store";
import { CREDIT_COSTS } from "@/lib/mock/jobs";
import { useT } from "@/lib/i18n";
import type { Account, Asset, RailCountry, Target } from "@/lib/mock/types";
import {
  ASSETS,
  RAIL_COUNTRIES,
  SOON_COUNTRIES,
  TARGET_LABELS,
} from "@/lib/mock/types";
import { AssetIcon, StellarIcon } from "@/components/AssetIcons";
import { MultiDropdown } from "@/components/ui/Dropdown";

const MIN_CREDITS =
  CREDIT_COSTS.generating + CREDIT_COSTS.building + CREDIT_COSTS.publishing;
const MOCK_PREVIEW_PATH = "/studio/app_seed_a1b2_1/preview";

const TARGETS: Array<{
  key: Target;
  Icon: typeof Globe;
  state: "ready" | "new" | "soon";
}> = [
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

export function Composer({
  account,
  autoFocus,
}: {
  account: Account;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const openSettings = useUiStore((s) => s.openSettings);
  const [prompt, setPrompt] = useState("");
  const [target, setTarget] = useState<Target>("web");
  const [assets, setAssets] = useState<Asset[]>(["USDC"]);
  const [barHidden, setBarHidden] = useState(false);
  const [countries, setCountries] = useState<RailCountry[]>(["BO", "BR", "AR"]);

  const freePlan = (account.plan ?? "free") === "free";
  const limitReached = freePlan && account.generationsUsed >= GENERATION_LIMIT;
  const lowCredits = account.credits < MIN_CREDITS;
  const ready = prompt.trim().length > 0 && !limitReached && !lowCredits;

  const submit = () => {
    if (!ready) return;
    router.push(`${MOCK_PREVIEW_PATH}?generate=1`);
  };

  return (
    <div className="flex flex-col gap-2">
      <Tabs value={target} onValueChange={(value) => setTarget(value as Target)} className="drop-shadow-sm">
        {/* Tabs share the width and shrink with their labels, ending before the box's rounded corner so none gets clipped. */}
        <TabsList
          aria-label={t("App")}
          className="flex gap-1 pr-4"
        >
          {TARGETS.map(({ key, Icon, state }) => {
            const active = target === key;
            const disabled = state === "soon";
            return (
              <TabsTrigger
                key={key}
                value={key}
                aria-label={t(TARGET_LABELS[key])}
                disabled={disabled}
                className={`relative -mb-px inline-flex min-w-0 flex-initial items-center justify-center gap-2 rounded-none rounded-t-xl px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                  active
                    ? "bg-surface text-foreground"
                    : disabled
                      ? "bg-white/10 text-white/50"
                      : "bg-white/15 text-white/85 hover:bg-white/25"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span
                  className={`min-w-0 truncate ${active ? "" : "hidden sm:inline"}`}
                >
                  {key === "telegram" ? "Telegram" : t(TARGET_LABELS[key])}
                </span>
                {state === "new" && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-px text-[10px] ${active ? "bg-accent-soft text-accent" : "bg-white/20"}`}
                  >
                    {t("New")}
                  </span>
                )}
                {state === "soon" && (
                  <span className="hidden shrink-0 rounded-full bg-white/10 px-1.5 py-px text-[10px] md:inline">
                    {t("Soon")}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value={target} tabIndex={-1} className="composer-panel rounded-2xl rounded-tl-none bg-surface p-3">
          <Textarea
            aria-label={t("Describe your app")}
            autoFocus={autoFocus}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey))
                submit();
            }}
            rows={3}
            placeholder={t(
              "Describe your app. Example: a rotating savings circle for 10 friends with weekly contributions",
            )}
            className="composer-input w-full resize-none rounded-none border-0 bg-transparent px-1 py-1 text-base text-foreground shadow-none placeholder:text-muted/70 focus-visible:outline-none"
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
                >
                  <StellarIcon size={14} aria-hidden /> Stellar
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t(
                  "Every app runs on Stellar. It starts on testnet, move it to mainnet when you publish.",
                )}
              </TooltipContent>
            </Tooltip>
            <SponsoredChip />
            <MultiDropdown<Asset>
              label={assets.length ? assets.join(" · ") : t("XLM only")}
              icon={
                <span className="flex -space-x-1">
                  {(assets.length ? assets : (["XLM"] as Asset[])).map((a) => (
                    <span
                      key={a}
                      className="rounded-full ring-2 ring-background"
                    >
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
                    {t(
                      "Users can pay with any of these. The first one is what you receive.",
                    )}{" "}
                    <span className="text-foreground">
                      {t("Pick none and your app works only with XLM.")}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground">
                    {t(
                      "No stablecoin picked. Your app will take and pay out everything in XLM, Stellar's native asset. Its price moves, so balances are not pegged to a currency.",
                    )}
                  </span>
                )
              }
              items={ASSETS.map((a) => ({
                value: a,
                label: a,
                note: t(ASSET_NOTES[a]),
                icon: <AssetIcon asset={a} size={20} />,
              }))}
            />
            <MultiDropdown<RailCountry>
              label={
                countries.length === 0
                  ? t("No bank rails")
                  : countries.length === RAIL_COUNTRIES.length
                    ? t("3 countries")
                    : countries
                        .map(
                          (c) =>
                            RAIL_COUNTRIES.find((r) => r.code === c)?.currency,
                        )
                        .join(" · ")
              }
              icon={
                countries.length ? (
                  <span className="text-sm leading-none">
                    {countries
                      .map(
                        (c) => RAIL_COUNTRIES.find((r) => r.code === c)?.flag,
                      )
                      .join("")}
                  </span>
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
                    <span className="text-foreground">
                      {t("Optional, pick none to skip banks.")}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground">
                    {t(
                      "No country picked. Users add and withdraw money only from Stellar wallets and exchanges, with no bank or identity check.",
                    )}
                  </span>
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
              <Button
                variant="primary"
                size="icon"
                type="button"
                onClick={submit}
                disabled={!ready}
                aria-label={t("Generate app")}
                title={t("Generate app, {n} credits", {
                  n:
                    CREDIT_COSTS.generating +
                    CREDIT_COSTS.building +
                    CREDIT_COSTS.publishing,
                })}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={18} />
              </Button>
            </div>
          </div>
        </TabsContent>
        {/* Attached under the composer, like a tab hanging from it: why you cannot generate, and the fix. */}
        {(limitReached || lowCredits) && !barHidden && (
          <div className="mx-3 flex items-center gap-3 rounded-b-xl bg-black/45 px-4 py-2 text-sm text-white/85 backdrop-blur-md">
            <span className="min-w-0 flex-1 truncate">
              {limitReached
                ? t("You used your {limit} free generations.", {
                    limit: GENERATION_LIMIT,
                  })
                : account.credits <= 0
                  ? t("You are out of credits.")
                  : t("A new app needs {min} credits, you have {have}.", {
                      min: MIN_CREDITS,
                      have: account.credits,
                    })}
            </span>
            <Button
              variant="unstyled"
              type="button"
              onClick={() =>
                limitReached ? openSettings("plan") : setCreditsOpen(true)
              }
              className="shrink-0 font-medium text-white hover:underline"
            >
              {limitReached ? t("Upgrade plan") : t("Buy credits")}
            </Button>
            <Button
              variant="unstyled"
              type="button"
              onClick={() => setBarHidden(true)}
              aria-label={t("Close")}
              className="shrink-0 text-white/60 hover:text-white"
            >
              <X size={15} />
            </Button>
          </div>
        )}
      </Tabs>

    </div>
  );
}

// Always on: every app pays its users' network fees from the maker's own sponsor wallet, funded with credits.
// Shown locked so makers know it is there, with a short why on click.
function SponsoredChip() {
  const t = useT();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="unstyled"
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent"
        >
          <Fuel size={13} className="text-accent" /> {t("Sponsored")}
          <Lock size={11} className="text-muted" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        aria-label={t("Always sponsored")}
        className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-3 text-left text-xs shadow-sm"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Fuel size={14} className="text-accent" /> {t("Always sponsored")}
        </p>
        <p className="mt-1 leading-relaxed text-muted">
          {t(
            "Your users pay no fees and never need gas. Your app's sponsor wallet pays them with your credits.",
          )}
        </p>
      </PopoverContent>
    </Popover>
  );
}
