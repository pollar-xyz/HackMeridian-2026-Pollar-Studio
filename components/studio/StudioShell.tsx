"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { usePrefs } from "@/lib/prefs";
import { Sidebar } from "@/components/studio/Sidebar";
import { AddCreditsModal } from "@/components/studio/AddCredits";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { PasskeyPrompt } from "@/components/auth/PasskeyPrompt";
import { PASSKEYS_ENABLED } from "@/lib/auth/hub";
import { StudioLoading, useStudioAccount } from "@/components/StudioGate";
import { useSession } from "@/lib/auth/session";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const setCollapsed = usePrefs((s) => s.setSidebarCollapsed);
  const router = useRouter();
  const session = useSession();
  const account = useStudioAccount();

  // The studio is signed in only: no session sends the browser to the login.
  useEffect(() => {
    if (session === null) router.replace("/");
  }, [session, router]);

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
      {PASSKEYS_ENABLED && <PasskeyPrompt />}
    </SidebarProvider>
  );
}
