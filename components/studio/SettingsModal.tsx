"use client";

import { X } from "lucide-react";
import { useUiStore, type SettingsSection } from "@/lib/mock/ui-store";
import { useT } from "@/lib/i18n";
import { Modal } from "@/components/Modal";
import { ProfilePanel } from "./settings/ProfilePanel";
import { BillingPanel } from "./settings/BillingPanel";
import { UsagePanel } from "./settings/UsagePanel";
import { PlanPanel } from "./settings/PlanPanel";

const GROUPS: Array<{ title: string; items: Array<{ key: SettingsSection; label: string }> }> = [
  {
    title: "Account",
    items: [
      { key: "profile", label: "Profile" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { key: "billing", label: "Billing" },
      { key: "usage", label: "Usage" },
      { key: "plan", label: "Plan" },
    ],
  },
];

// Settings live in a dialog, like a desktop app: left sections, right content, nothing leaves the page.
export function SettingsModal() {
  const t = useT();
  const section = useUiStore((s) => s.settings);
  const openSettings = useUiStore((s) => s.openSettings);
  const close = useUiStore((s) => s.closeSettings);

  return (
    <Modal open={section !== null} onClose={close} size="xl" bare>
      <div className="flex h-[min(80vh,44rem)] flex-col sm:flex-row">
        <aside className="shrink-0 border-b border-line bg-background/60 p-3 sm:w-52 sm:border-b-0 sm:border-r sm:p-4">
          <div className="mb-2 flex items-center justify-between px-2 sm:mb-4">
            <h1 className="text-lg font-semibold tracking-tight">{t("Settings")}</h1>
            <button type="button" onClick={close} className="rounded-md p-1 text-muted hover:bg-background sm:hidden" aria-label={t("Close")}>
              <X size={16} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto sm:flex-col sm:gap-4">
            {GROUPS.map((group) => (
              <div key={group.title} className="flex shrink-0 gap-1 sm:flex-col">
                <p className="hidden px-2 text-[11px] font-medium uppercase tracking-wide text-muted sm:block">{t(group.title)}</p>
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openSettings(item.key)}
                    className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
                      section === item.key ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-background hover:text-foreground"
                    }`}
                  >
                    {t(item.label)}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="relative min-w-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 hidden rounded-md p-1 text-muted hover:bg-background sm:block"
            aria-label={t("Close")}
          >
            <X size={18} />
          </button>
          {section === "profile" && <ProfilePanel />}
          {section === "billing" && <BillingPanel />}
          {section === "usage" && <UsagePanel />}
          {section === "plan" && <PlanPanel />}
        </div>
      </div>
    </Modal>
  );
}
