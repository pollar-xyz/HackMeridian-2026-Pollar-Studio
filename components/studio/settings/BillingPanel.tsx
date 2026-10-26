"use client";

import { useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { useStudioCredits } from "@/hooks/use-studio-credits";

export function BillingPanel() {
  const t = useT();
  const { credits, error, loading } = useStudioCredits();

  return (
    <PanelHeader
      title={t("Billing")}
      description={t("Your plan and the credits your builds use.")}
    >
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-line bg-surface">
          <dl className="grid grid-cols-3 gap-4 px-5 pt-4">
            <div>
              <dt className="text-xs text-muted">{t("Your plan")}</dt>
              <dd className="mt-1 text-sm font-semibold">{t("{plan} plan", { plan: t("Free") })}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("Price per month")}</dt>
              <dd className="mt-1 font-mono text-sm">-</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("Renews on")}</dt>
              <dd className="mt-1 text-sm">-</dd>
            </div>
          </dl>
          <div className="px-5 pt-4">
            {loading ? <div className="h-16 animate-pulse rounded-lg bg-background" aria-busy="true" />
              : error || !credits ? <p role="alert" className="text-sm text-danger">{t(error ?? "Could not load your credits.")}</p>
              : <>
                <dl className="grid grid-cols-3 gap-3">
                  <StatTile label={t("Credits left")} value={Math.max(0, credits.available)} />
                  <StatTile label={t("Starting credits")} value={credits.starting} />
                  <StatTile label={t("Credits spent")} value={credits.spent} />
                </dl>
                {credits.available <= 0 && <p role="alert" className="mt-2 text-xs text-danger">{t("You have used all your credits. Buying more is coming soon.")}</p>}
              </>}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            <span className="mr-auto text-xs text-muted">{t("Buying credits and paid plans are coming soon.")}</span>
            <Button variant="ghost" size="sm" disabled>{t("Buy credits")}</Button>
            <Button variant="secondary" size="sm" disabled>{t("View plans")}</Button>
          </div>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("Payment history")}</h3>
          <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
            {t("No payments yet. Your starting credits were a gift from the event.")}
          </p>
        </section>
      </div>
    </PanelHeader>
  );
}
