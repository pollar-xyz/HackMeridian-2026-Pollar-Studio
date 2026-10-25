"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { usePrefs } from "@/lib/prefs";
import { Sidebar } from "@/components/studio/Sidebar";
import { AddCreditsModal } from "@/components/studio/AddCredits";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { MOCK_ACCOUNT } from "@/lib/mock/data";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className="flex-col lg:flex-row"
    >
      <Sidebar account={MOCK_ACCOUNT} />
      <SidebarInset
        id="studio-content"
        tabIndex={-1}
        className="flex min-w-0 flex-1 flex-col"
      >
        {children}
      </SidebarInset>
      <AddCreditsModal />
      <SettingsModal />
    </SidebarProvider>
  );
}
