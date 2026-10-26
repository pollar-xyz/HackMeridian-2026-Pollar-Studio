"use client";

import { PersonIcon, CheckCircledIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/lib/i18n";

const SETTINGS = [
  { label: "Pollar account", scope: "All Pollar apps", note: "Users who already have a Pollar account from another app sign in with it, same passkey and wallet.", Icon: PersonIcon },
  { label: "Identity check", scope: "All Pollar apps", note: "Users verified in any Pollar app cash out here without verifying again.", Icon: CheckCircledIcon },
  { label: "Sponsor wallet", scope: "Only your apps", note: "Your apps share one fee wallet to cover users’ network fees.", Icon: LightningBoltIcon },
];

export function PublishSharedSettings() {
  const t = useT();
  return <section aria-label={t("Shared on Pollar")} className="flex flex-col gap-2 text-sm">
    <div className="flex items-center justify-between gap-2"><h3 className="font-medium">{t("Shared on Pollar")}</h3><span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-muted">{t("Soon")}</span></div>
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">{SETTINGS.map(({ label, scope, note, Icon }) => <li key={label} className="flex items-start gap-3 px-3.5 py-3"><Checkbox disabled checked={false} aria-label={t(label)} aria-describedby="shared-settings-help" className="mt-0.5" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><Icon className="shrink-0 text-muted" aria-hidden /><span className="font-medium">{t(label)}</span><span className="rounded-full bg-background px-1.5 py-px text-[10px] text-muted">{t(scope)}</span></div><p className="mt-0.5 text-xs leading-relaxed text-muted">{t(note)}</p></div></li>)}</ul>
    <p id="shared-settings-help" className="text-xs text-muted">{t("Shared service settings are not available for publishing yet.")}</p>
  </section>;
}
