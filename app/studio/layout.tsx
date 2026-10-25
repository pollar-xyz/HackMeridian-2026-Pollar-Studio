"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { usePrefs } from "@/lib/prefs";
import { useT } from "@/lib/i18n";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/mock/store";
import { Sidebar } from "@/components/studio/Sidebar";
import { AddCreditsModal } from "@/components/studio/AddCredits";
import { SettingsModal } from "@/components/studio/SettingsModal";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const t = useT();
  const router = useRouter();
  const hydrated = useStudioStore((s) => s.hydrated);
  const account = useStudioStore((s) => s.account);

  useEffect(() => {
    if (hydrated && !account) router.replace("/");
  }, [hydrated, account, router]);

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className="flex-col lg:flex-row"
    >
      <a
        href="#studio-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-surface p-3 text-foreground focus:not-sr-only"
      >
        {t("Skip to content")}
      </a>
      {hydrated && account && <Sidebar account={account} />}
      <SidebarInset
        id="studio-content"
        tabIndex={-1}
        className="flex min-w-0 flex-1 flex-col"
      >
        {children}
      </SidebarInset>
      {hydrated && account && (
        <>
          <AddCreditsModal />
          <SettingsModal />
        </>
      )}
    </SidebarProvider>
  );
}
