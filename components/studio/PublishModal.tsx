"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  Globe,
  Lock,
  Rocket,
  Store,
  X,
} from "lucide-react";
import type { App } from "@/lib/mock/types";
import {
  useStudioStore,
  subdomainProblem,
  mainnetCost,
} from "@/lib/mock/store";
import type { SharedPart } from "@/lib/mock/types";
import { SHARED_PARTS } from "@/lib/mock/types";
import { SharedPicker } from "./SharedData";
import { useT } from "@/lib/i18n";
import { Modal, Spinner } from "@/components/Modal";
import { Button, buttonClass } from "@/components/ui/Button";
import { CopyButton } from "@/components/CopyButton";
import { StellarIcon, AssetIcon } from "@/components/AssetIcons";
import { toast } from "@/components/Toast";

const NET_BADGE = {
  mainnet:
    "border-emerald-300 bg-surface text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400",
  testnet:
    "border-amber-300 bg-surface text-amber-700 dark:border-amber-500/40 dark:text-amber-400",
};

// Lovable style: review the preview, then pick the address and make it live in one step.
export function PublishModal({
  app,
  open,
  onClose,
  onListInMarketplace,
  onMainnet,
}: {
  app: App;
  open: boolean;
  onClose: () => void;
  onListInMarketplace: () => void;
  // Mainnet needs its own contract, so publishing there hands off to the deploy form with the chosen address.
  onMainnet: (sub: string) => void;
}) {
  const t = useT();
  const setSubdomain = useStudioStore((s) => s.setSubdomain);
  const publishApp = useStudioStore((s) => s.publishApp);
  const unpublishApp = useStudioStore((s) => s.unpublishApp);
  const current = app.url.replace("https://", "").replace(".pollar.app", "");
  const [sub, setSub] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"form" | "publishing" | "done">("form");
  const apps = useStudioStore((s) => s.apps);
  // Check the address shortly after the maker stops typing, like a real availability lookup.
  const [check, setCheck] = useState<{
    sub: string;
    problem: string | null;
  } | null>(null);
  useEffect(() => {
    const id = setTimeout(
      () => setCheck({ sub, problem: subdomainProblem(sub, app.id, apps) }),
      450,
    );
    return () => clearTimeout(id);
  }, [sub, app.id, apps]);
  const checking = !check || check.sub !== sub;
  const problem = checking ? null : check.problem;
  const available = !checking && !problem;

  const isLive = app.status === "published";
  const hasChanges = isLive && app.previewSha !== app.publishedSha;
  const host = `${sub || "your-app"}.pollar.app`;
  const onMainnetAlready = app.network === "mainnet";
  // The preview always runs on testnet. The network is picked here, when the app goes live.
  const [target, setTarget] = useState<"testnet" | "mainnet">(
    onMainnetAlready ? "mainnet" : "testnet",
  );
  const needsDeploy = target === "mainnet" && !onMainnetAlready;
  // Picked before publishing: what this app reuses from the maker's other apps. Everything is shared by default.
  const [shared, setSharedParts] = useState<SharedPart[]>(
    app.shared ?? SHARED_PARTS,
  );
  const setShared = useStudioStore((s) => s.setShared);
  const cost = mainnetCost({ ...app, shared }, apps);
  const network = target;
  const asset = (app.asset ?? "USDC") as "USDC" | "USDT" | "XLM";

  const publish = () => {
    setShared(app.id, shared);
    if (needsDeploy) {
      const err = subdomainProblem(sub, app.id, apps);
      if (err) {
        setError(t(err));
        return;
      }
      close();
      onMainnet(sub);
      return;
    }
    if (sub !== current) {
      const err = setSubdomain(app.id, sub);
      if (err) {
        setError(t(err));
        return;
      }
    }
    setState("publishing");
    setTimeout(() => {
      publishApp(app.id);
      setState("done");
    }, 1600);
  };

  const close = () => {
    setState("form");
    setTarget(onMainnetAlready ? "mainnet" : "testnet");
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={t("Publish app")}
      open={open}
      onClose={state === "publishing" ? undefined : close}
      size="lg"
      bare
    >
      {state === "publishing" && (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Spinner />
          <p className="text-base font-semibold">
            {t("Publishing to {host}", { host })}
          </p>
          <p className="text-sm text-muted">
            {t("Pointing the address to your reviewed build")}
          </p>
        </div>
      )}

      {state === "done" && (
        <div className="flex flex-col">
          <div
            className={`flex items-center gap-4 border-b border-line px-6 py-5 ${onMainnetAlready ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-accent-soft/60"}`}
          >
            <span
              className={`pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${onMainnetAlready ? "bg-emerald-500" : "bg-accent"}`}
            >
              <Check size={24} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold">{t("Your app is live")}</p>
              <p className="text-sm text-muted">
                {onMainnetAlready
                  ? t("Anyone with the link can sign in and pay.")
                  : t("Anyone with the link can try it with test money.")}
              </p>
            </div>
            <span
              className={`ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${NET_BADGE[onMainnetAlready ? "mainnet" : "testnet"]}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${onMainnetAlready ? "bg-emerald-500" : "bg-amber-400"}`}
              />
              {onMainnetAlready ? "Mainnet" : "Testnet"}
            </span>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex items-center gap-2 rounded-xl bg-background px-4 py-2.5">
              <Lock size={14} className="shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {host}
              </span>
              <CopyButton value={`https://${host}`} compact />
            </div>
            {/* The marketplace lists real apps only. Testnet apps use play money and get wiped on resets. */}
            {!onMainnetAlready && (
              <div className="flex items-start gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                <Store size={16} className="mt-0.5 shrink-0 text-muted" />
                <p className="text-muted">
                  <span className="font-medium text-foreground">
                    {t("Want it in the marketplace?")}
                  </span>{" "}
                  {t(
                    "The marketplace lists mainnet apps only. Open Publish again and pick Mainnet when you are ready for real money.",
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
            <Button variant="secondary" onClick={close}>
              {t("Done")}
            </Button>
            {onMainnetAlready && !app.listing && (
              <Button
                variant="secondary"
                onClick={() => {
                  close();
                  onListInMarketplace();
                }}
              >
                <Store size={14} /> {t("List in marketplace")}
              </Button>
            )}
            <a
              href={`/preview/${app.slug}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("primary")}
            >
              {t("Open app")} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {state === "form" && (
        <div className="flex max-h-[88vh] flex-col gap-5 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {hasChanges
                  ? t("Update your live app")
                  : isLive
                    ? t("Publish settings")
                    : t("Publish your app")}
              </h2>
              <p className="text-sm text-muted">
                {hasChanges
                  ? t(
                      "Your preview has changes that are not live yet. Publishing replaces what your users see.",
                    )
                  : isLive
                    ? t(
                        "Your app is live. You can change its address or take it down.",
                      )
                    : t(
                        "You reviewed the preview. Pick an address and make it live.",
                      )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={close}
              className="rounded-md p-1 text-muted hover:bg-background"
              aria-label={t("Close")}
            >
              <X size={18} />
            </Button>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t("Address")}</span>
            <span
              className={`flex items-center rounded-xl border bg-background px-3 py-2.5 focus-within:border-accent ${
                error || problem
                  ? "border-danger focus-within:border-danger"
                  : available && sub !== current
                    ? "border-emerald-400 focus-within:border-emerald-400"
                    : "border-line"
              }`}
            >
              <Globe size={15} className="mr-2 shrink-0 text-muted" />
              <Input
                value={sub}
                onChange={(e) => {
                  setSub(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  );
                  setError(null);
                }}
                placeholder="my-app"
                className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted/60 focus-visible:outline-none"
                aria-label={t("Subdomain")}
              />
              <span className="shrink-0 font-mono text-sm text-muted">
                .pollar.app
              </span>
              <span className="ml-2 flex w-5 shrink-0 justify-center">
                {sub.length > 0 &&
                  (checking ? (
                    <Spinner className="h-4 w-4" />
                  ) : available ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <X size={16} className="text-danger" />
                  ))}
              </span>
            </span>
            {error ? (
              <span className="text-xs text-danger">{error}</span>
            ) : sub.length === 0 ? (
              <span className="text-xs text-muted">
                {t(
                  "Letters, numbers and dashes. Custom domains come with the Builder plan.",
                )}
              </span>
            ) : checking ? (
              <span className="text-xs text-muted">
                {t("Checking if {host} is free", { host })}
              </span>
            ) : problem ? (
              <span className="text-xs text-danger">{t(problem)}</span>
            ) : sub === current && isLive ? (
              <span className="text-xs text-muted">
                {t("This is your current address.")}
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {t("{host} is available", { host })}
              </span>
            )}
          </label>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">{t("Network")}</span>
            <RadioGroup
              aria-label={t("Network")}
              value={target}
              onValueChange={(value) =>
                setTarget(value as "testnet" | "mainnet")
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {(["testnet", "mainnet"] as const).map((n) => {
                const active = target === n;
                const locked = n === "testnet" && onMainnetAlready;
                return (
                  <RadioGroupItem
                    key={n}
                    value={n}
                    disabled={locked}
                    className={`flex flex-col gap-1 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? n === "mainnet"
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-amber-400 bg-amber-50 dark:bg-amber-500/10"
                        : "border-line hover:bg-background"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        className={`h-2 w-2 rounded-full ${n === "mainnet" ? "bg-emerald-500" : "bg-amber-400"}`}
                      />
                      {n === "mainnet" ? "Mainnet" : "Testnet"}
                      <span className="ml-auto text-xs font-medium text-muted">
                        {n === "mainnet"
                          ? onMainnetAlready
                            ? t("Deployed")
                            : t("{n} credits", { n: cost.total })
                          : t("Free")}
                      </span>
                    </span>
                    <span className="text-xs text-muted">
                      {n === "mainnet"
                        ? t(
                            "Real money, never resets. We deploy your contract again. Needed to list in the marketplace.",
                          )
                        : t(
                            "Test money, good for demos. Stellar resets testnet a few times a year and wipes its data.",
                          )}
                    </span>
                  </RadioGroupItem>
                );
              })}
            </RadioGroup>
          </div>

          <SharedPicker app={app} value={shared} onChange={setSharedParts} />

          <ul className="flex flex-col gap-2 rounded-xl bg-background p-4 text-sm">
            <li className="flex items-center gap-3">
              <Globe size={16} className="shrink-0 text-accent" />
              <span>
                {t("Live at")}{" "}
                <span className="font-mono font-medium">{host}</span>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <StellarIcon size={16} className="shrink-0 text-accent" />
              <span>
                {t("Payment contract on Stellar {network}", { network })}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <AssetIcon asset={asset} size={16} />
              <span>
                {t(
                  "Users pay in {asset}. Your sponsor wallet covers their network fees",
                  { asset },
                )}
              </span>
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            {isLive && (
              <Button
                variant="ghost"
                onClick={() => {
                  unpublishApp(app.id);
                  toast(
                    t("{name} is offline. The preview is still here.", {
                      name: app.name,
                    }),
                  );
                  close();
                }}
              >
                {t("Unpublish")}
              </Button>
            )}
            <span className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={close}>
                {t("Cancel")}
              </Button>
              <Button
                onClick={publish}
                disabled={
                  !available ||
                  (!needsDeploy &&
                    isLive &&
                    !hasChanges &&
                    sub === current &&
                    sameParts(shared, app.shared ?? SHARED_PARTS))
                }
              >
                <Rocket size={15} />{" "}
                {needsDeploy
                  ? t("Continue to mainnet deploy")
                  : hasChanges
                    ? t("Update")
                    : isLive
                      ? t("Save changes")
                      : t("Publish")}
              </Button>
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function sameParts(a: SharedPart[], b: SharedPart[]) {
  return a.length === b.length && a.every((p) => b.includes(p));
}
