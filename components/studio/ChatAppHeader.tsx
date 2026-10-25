"use client";

import { useStudioApps } from "@/lib/ai/studio-apps";
import { useT } from "@/lib/i18n";

export function ChatAppHeader({ appId }: { appId: string }) {
  const { apps } = useStudioApps();
  const t = useT();
  const app = apps.find((item) => item.id === appId);
  return <header className="border-b border-line px-5 py-4"><h1 className="truncate text-base font-semibold">{app?.name ?? t("New app")}</h1><p className="mt-1 text-xs text-muted">{t("Draft")}</p></header>;
}
