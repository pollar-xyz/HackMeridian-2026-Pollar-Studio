"use client";

import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { usePrefs } from "@/lib/prefs";
import { Sidebar } from "@/components/studio/Sidebar";
import { AddCreditsModal } from "@/components/studio/AddCredits";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { StudioLoading, useStudioAccount } from "@/components/StudioGate";
import { useSession } from "@/lib/auth/session";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const session = useSession();
  const account = useStudioAccount();

  // proxy.ts already gates /studio; this covers a session that ends while the
  // page is open.
  useEffect(() => {
    if (session !== null) return;
    const returnTo = window.location.pathname + window.location.search;
    window.location.assign(new URL(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`, window.location.href));
  }, [session]);

  if (!account) return <StudioLoading />;

  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className="flex-col lg:flex-row"
    >
      <Sidebar account={account} />
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
