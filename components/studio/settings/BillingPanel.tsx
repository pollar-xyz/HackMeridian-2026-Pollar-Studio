"use client";

import { useStudioStore } from "@/lib/mock/store";
import { PLANS, planById } from "@/lib/mock/plans";
import type { CreditEntry } from "@/lib/mock/types";
import { useLang, useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { useStudioAccount } from "@/components/StudioGate";
import { useUiStore } from "@/lib/mock/ui-store";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/CopyButton";
import { PACKS } from "@/components/studio/AddCredits";
import { shortHash } from "@/lib/mock/random";

const DAY = 24 * 60 * 60 * 1000;

// Older purchases were saved before prices were recorded, so their amount is worked out from the pack or plan name.
function paidFor(e: CreditEntry): number {
  if (e.paidUsdc !== undefined) return e.paidUsdc;
  // Match by credits, so a pack bought under the first price list keeps the price it was sold at.
  const legacy: Record<number, number> = { 100: 5, 300: 12, 1000: 35 };
  if (e.reason.endsWith(" pack") && legacy[-e.amount]) return legacy[-e.amount];
  const pack = PACKS.find((p) => p.credits === -e.amount);
  if (pack) return pack.priceUsdc;
  const plan = PLANS.find((p) => e.reason === `${p.name} plan`);
  return plan?.priceUsdc ?? 0;
}

export function BillingPanel() {
  const account = useStudioAccount();
  const t = useT();
  const lang = useLang();
  const ledger = useStudioStore((s) => s.ledger);
  const setCreditsOpen = useUiStore((s) => s.setCreditsOpen);
  const openSettings = useUiStore((s) => s.openSettings);

  if (!account) return null;
  const plan = planById(account.plan);
  const paid = plan.priceUsdc > 0;
  const purchases = ledger.filter((e) => e.amount < 0).sort((a, b) => b.at - a.at);
  const date = (at: number) => new Date(at).toLocaleDateString(lang === "en" ? "en-US" : lang, { day: "numeric", month: "short", year: "numeric" });
  const since = account.planSince ?? purchases.find((e) => e.reason.endsWith(" plan"))?.at;
  const renews = paid && since ? since + 30 * DAY : null;

  return (
    <PanelHeader title={t("Billing")} description={t("Your plan and every payment you made, paid from your Pollar wallet.")}>
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-line bg-surface">
          <dl className="grid grid-cols-3 gap-4 px-5 pt-4">
            <div>
              <dt className="text-xs text-muted">{t("Your plan")}</dt>
              <dd className="mt-1 text-sm font-semibold">{t("{plan} plan", { plan: t(plan.name) })}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("Price per month")}</dt>
              <dd className="mt-1 font-mono text-sm">{paid ? `${plan.priceUsdc} USDC` : "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("Renews on")}</dt>
              <dd className="mt-1 text-sm">{renews ? date(renews) : "-"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-end gap-2 border-t border-line px-5 py-3">
            <Button variant="ghost" size="sm" onClick={() => setCreditsOpen(true)}>
              {t("Buy credits")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openSettings("plan")}>
              {t("View plans")}
            </Button>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("Payment history")}</h3>
          {purchases.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
              {t("No payments yet. Your starting credits were a gift from the event.")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-2 font-medium">{t("Date")}</th>
                    <th className="px-4 py-2 font-medium">{t("Description")}</th>
                    <th className="px-4 py-2 text-right font-medium">{t("Amount")}</th>
                    <th className="px-4 py-2 font-medium">{t("Status")}</th>
                    <th className="px-4 py-2 text-right font-medium">{t("Receipt")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {purchases.map((e) => {
                    const usdc = paidFor(e);
                    return (
                      <tr key={e.id}>
                        <td className="whitespace-nowrap px-4 py-3">{date(e.at)}</td>
                        <td className="px-4 py-3">
                          <span className="block">{t(e.reason)}</span>
                          <span className="block text-xs text-muted">{t("+{n} credits", { n: -e.amount })}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-mono">{usdc > 0 ? `${usdc} USDC` : t("Free")}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {usdc > 0 ? t("Paid") : t("Redeemed")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {e.hash ? (
                            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted" title={e.hash}>
                              {shortHash(e.hash)} <CopyButton value={e.hash} compact />
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PanelHeader>
  );
}
