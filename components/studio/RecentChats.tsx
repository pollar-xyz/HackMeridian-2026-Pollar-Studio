"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudioApps } from "@/hooks/use-studio-apps";
import { useT } from "@/lib/i18n";

function RecentChatsLoading() {
  return <div className="space-y-2 px-3 py-2" aria-busy="true">
    {["w-4/5", "w-3/5", "w-5/6"].map(width => <div key={width} className={`h-4 animate-pulse rounded bg-line/60 ${width}`} />)}
  </div>;
}

// Avoid repeated segment prefetches for the parallel @chat catch-all in Next 16.4.2.
// Workspace routes load on navigation instead.
export function RecentChats({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  return <section className="mt-7 min-w-0 pb-2" aria-label={t("Recent chats")}>
    <h2 className="mb-2 px-3 text-xs font-medium text-muted">{t("Recent chats")}</h2>
    <Suspense fallback={<RecentChatsLoading />}><RecentChatLinks onNavigate={onNavigate} /></Suspense>
  </section>;
}

function RecentChatLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { apps, loading, error, refresh } = useStudioApps();
  const pathname = usePathname();
  const t = useT();
  if (loading) return <RecentChatsLoading />;
  if (error) return <div className="px-3 py-2 text-xs text-muted" role="alert">
    <p>{t("Could not load recent chats.")}</p>
    <button type="button" onClick={() => void refresh()} className="mt-2 rounded text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent">{t("Try again")}</button>
  </div>;
  if (!apps.length) return <p className="px-3 py-2 text-xs leading-relaxed text-muted">{t("No recent chats yet.")}</p>;

  return <nav aria-label={t("Recent chats")}>
    <ul className="space-y-0.5">{apps.slice(0, 20).map(app => {
      const active = pathname?.startsWith(`/studio/${app.id}/`) ?? false;
      return <li key={app.id} className="min-w-0">
        <Link prefetch={false} href={`/studio/${app.id}/preview`} onClick={onNavigate} title={app.name}
          aria-current={active ? "page" : undefined}
          className={`block truncate rounded-lg px-3 py-2 text-sm leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${active ? "bg-background font-medium text-foreground" : "text-foreground/80 hover:bg-background hover:text-foreground"}`}>
          {app.name}
        </Link>
      </li>;
    })}</ul>
    {apps.length > 20 && <Link href="/studio/apps" onClick={onNavigate} className="mt-3 block rounded-lg px-3 py-2 text-xs text-muted hover:text-foreground">{t("All chats")}</Link>}
  </nav>;
}
