"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { pollarCreditsSchema, type PollarCredits as Credits } from "@/lib/schemas/pollar-credits";
import { useT } from "@/lib/i18n";

const usd = (credits: string) => (Number(credits) / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });

/** What the app's Pollar account has left and what its users' activity spent: wallets, gas, sponsored fees. */
export function PollarCredits({ appId }: { appId: string }) {
  const t = useT();
  const [state, setState] = useState<{ credits?: Credits; error?: string; loading: boolean }>({ loading: true });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/projects?appId=${encodeURIComponent(appId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Could not load the app's Pollar credits.");
        setState({ credits: pollarCreditsSchema.parse(await response.json()).credits, loading: false });
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setState({ error: error instanceof Error ? error.message : "Could not load the app's Pollar credits.", loading: false }); });
    return () => controller.abort();
  }, [appId]);

  const { credits, error, loading } = state;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><Coins size={15} className="text-accent" />{t("Pollar credits")}</h2>
      <p className="text-xs text-muted">{t("Your app pays Pollar in credits for its users' wallets and network fees. 100 credits = 1 USD.")}</p>
      {loading ? <div className="mt-3 h-16 animate-pulse rounded-xl bg-background" aria-busy="true" />
        : error ? <p role="alert" className="mt-3 text-sm text-danger">{t(error)}</p>
        : !credits ? <p className="mt-3 text-sm text-muted">{t("Credits appear once the app's Pollar account is set up, with its first message.")}</p>
        : <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-background px-3 py-2.5">
              <p className="text-xs text-muted">{t("Available")}</p>
              <p className="text-lg font-semibold tabular-nums">{Number(credits.available).toLocaleString()}</p>
              <p className="text-xs text-muted">{usd(credits.available)}{Number(credits.promo) > 0 ? ` · ${t("{n} free", { n: Number(credits.promo).toLocaleString() })}` : ""}</p>
            </div>
            <div className="rounded-xl bg-background px-3 py-2.5">
              <p className="text-xs text-muted">{t("Spent in the last 30 days")}</p>
              <p className="text-lg font-semibold tabular-nums">{Number(credits.spent.total).toLocaleString()}</p>
              <p className="text-xs text-muted">{usd(credits.spent.total)}</p>
            </div>
          </div>
          {Number(credits.overdraft) < 0 && <p role="alert" className="mt-2 text-xs text-danger">{t("The balance is negative: add credits in the Pollar dashboard so the app keeps working.")}</p>}
          {credits.spent.events.length > 0 && <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {credits.spent.events.map((event) => (
              <li key={event.event} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate font-mono text-xs">{event.event}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums">{t("{count} times", { count: event.count })} · {t("{n} credits", { n: Number(event.credits).toLocaleString() })}</span>
              </li>
            ))}
          </ul>}
        </>}
    </section>
  );
}
