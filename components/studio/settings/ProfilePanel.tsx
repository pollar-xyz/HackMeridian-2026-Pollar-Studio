"use client";

import { useState } from "react";
import { useStudioStore } from "@/lib/mock/store";
import { planById } from "@/lib/mock/plans";
import { useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { useStudioAccount } from "@/components/StudioGate";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/Toast";

export function ProfilePanel() {
  const account = useStudioAccount();
  const t = useT();
  const updateProfile = useStudioStore((s) => s.updateProfile);
  const [name, setName] = useState<string | null>(null);

  if (!account) return null;
  const value = name ?? account.name ?? "";
  const plan = planById(account.plan);

  return (
    <PanelHeader title={t("Profile")} description={t("How you show up in Studio and on the apps you publish.")}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent">
            {(value || account.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{value || account.email.split("@")[0]}</p>
            <p className="truncate text-sm text-muted">{account.email}</p>
            <p className="text-xs text-muted">{t("{plan} plan", { plan: t(plan.name) })}</p>
          </div>
        </div>

        <form
          className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile({ name: value.trim() });
            setName(null);
            toast(t("Profile saved"));
          }}
        >
          <Field label={t("Display name")} value={value} onChange={(e) => setName(e.target.value)} placeholder="Ana Quispe" />
          <Field label={t("Email")} value={account.email} readOnly hint={t("Your passkey is tied to this email.")} />
          <div>
            <Button type="submit" disabled={name === null || name.trim() === (account.name ?? "")}>
              {t("Save changes")}
            </Button>
          </div>
        </form>
      </div>
    </PanelHeader>
  );
}
