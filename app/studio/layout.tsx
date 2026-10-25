"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/mock/store";
import { Sidebar } from "@/components/studio/Sidebar";
import { AddCreditsModal } from "@/components/studio/AddCredits";
import { SettingsModal } from "@/components/studio/SettingsModal";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useStudioStore((s) => s.hydrated);
  const account = useStudioStore((s) => s.account);

  useEffect(() => {
    if (hydrated && !account) router.replace("/");
  }, [hydrated, account, router]);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {hydrated && account && <Sidebar account={account} />}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      {hydrated && account && (
        <>
          <AddCreditsModal />
          <SettingsModal />
        </>
      )}
    </div>
  );
}
