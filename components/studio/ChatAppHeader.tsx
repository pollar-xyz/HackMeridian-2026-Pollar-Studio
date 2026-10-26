"use client";

import { useStudioApps } from "@/hooks/use-studio-apps";
import { useT } from "@/lib/i18n";
import { getWorkspaceMockApp } from "@/lib/mock/workspace";
import { AppWorkspaceHeader } from "./AppWorkspaceHeader";

export function ChatAppHeader({ appId }: { appId: string }) {
  const { apps } = useStudioApps();
  const t = useT();
  const app = apps.find((item) => item.id === appId);
  const workspace = getWorkspaceMockApp(appId);
  if (!workspace) return null;

  return <AppWorkspaceHeader origin={app?.origin} app={{
    ...workspace,
    name: app?.name ?? t("New app"),
    prompt: app?.prompt ?? "",
    listing: app?.marketplace?.published ? {
      tagline: app.marketplace.tagline, logo: app.marketplace.logo, banner: app.marketplace.banner,
      listedAt: Date.parse(app.marketplace.publishedAt),
    } : undefined,
  }} />;
}
