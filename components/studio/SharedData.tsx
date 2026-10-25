"use client";

import { useMemo } from "react";
import { Check, Fuel, ShieldCheck, Users } from "lucide-react";
import type { App, SharedPart } from "@/lib/mock/types";
import { SHARED_PARTS } from "@/lib/mock/types";
import { useStudioStore, MAINNET_COSTS } from "@/lib/mock/store";
import { useT } from "@/lib/i18n";

// Accounts and identity checks are shared across every app on Pollar that opts in, not only the maker's.
// The sponsor wallet is paid with the maker's credits, so it is only shared between their own apps.
export const SHARED_INFO: Record<SharedPart, { label: string; note: string; Icon: typeof Users; scope: "pollar" | "yours" }> = {
  accounts: { label: "Pollar account", note: "Users who already have a Pollar account from another app sign in with it, same passkey and wallet.", Icon: Users, scope: "pollar" },
  kyc: { label: "Identity check", note: "Users verified in any Pollar app cash out here without verifying again.", Icon: ShieldCheck, scope: "pollar" },
  sponsor: { label: "Sponsor wallet", note: "Your apps share one fee wallet. Saves {n} credits on each mainnet deploy after the first.", Icon: Fuel, scope: "yours" },
};

// Checklist used right before publishing: what this app reuses from the maker's other apps.
export function SharedPicker({ app, value, onChange }: { app: App; value: SharedPart[]; onChange: (next: SharedPart[]) => void }) {
  const t = useT();
  const apps = useStudioStore((s) => s.apps);
  // How many live apps on Pollar already share accounts, so the benefit feels real.
  const network = useMemo(() => apps.filter((a) => a.id !== app.id && a.status === "published" && a.shared?.includes("accounts")).length, [apps, app.id]);
  const toggle = (p: SharedPart) => onChange(value.includes(p) ? value.filter((x) => x !== p) : SHARED_PARTS.filter((x) => x === p || value.includes(x)));

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{t("Shared on Pollar")}</span>
        {network > 0 && (
          <span className="text-xs text-muted">
            {network === 1 ? t("1 live app already shares accounts") : t("{n} live apps already share accounts", { n: network })}
          </span>
        )}
      </span>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {SHARED_PARTS.map((p) => {
          const { label, note, Icon } = SHARED_INFO[p];
          const on = value.includes(p);
          return (
            <li key={p}>
              <button type="button" onClick={() => toggle(p)} className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-background">
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-accent bg-accent text-white" : "border-line"}`}>
                  {on && <Check size={11} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon size={14} className="text-muted" /> {t(label)}
                    <span className="rounded-full bg-background px-1.5 py-px text-[10px] font-normal text-muted">
                      {SHARED_INFO[p].scope === "pollar" ? t("All Pollar apps") : t("Only your apps")}
                    </span>
                  </span>
                  <span className="block text-xs text-muted">{t(note, { n: MAINNET_COSTS.sponsor })}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
