"use client";

import { useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { useStudioAccount } from "@/components/StudioGate";
import { Field } from "@/components/ui/Field";

// Name and email come from the central Pollar account, so Studio only shows them.
export function ProfilePanel() {
  const account = useStudioAccount();
  const t = useT();

  if (!account) return null;
  const name = account.name?.trim() || account.email.split("@")[0];

  return (
    <PanelHeader title={t("Profile")} description={t("How you show up in Studio and on the apps you publish.")}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent">
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="truncate text-sm text-muted">{account.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
          <Field label={t("Display name")} value={name} readOnly />
          <Field label={t("Email")} value={account.email} readOnly hint={t("Managed in your Pollar account.")} />
        </div>
      </div>
    </PanelHeader>
  );
}
