import { Suspense } from "react";
import { Globe } from "lucide-react";
import { EnvTab } from "@/components/studio/AppEnvironment";
import { DeleteProject } from "@/components/studio/DeleteProject";
import { PollarCredits } from "@/components/studio/PollarCredits";
import { projectIdSchema } from "@/app/api/chat/schemas/studio-api";
import { CopyButton } from "@/components/CopyButton";
import { getT } from "@/lib/i18n/translate";
import { getWorkspaceMockApp } from "@/lib/mock/workspace";

export default function SettingsPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="m-5 h-72 animate-pulse rounded-2xl bg-surface" aria-busy="true" />}><SettingsContent params={params} /></Suspense>;
}

async function SettingsContent({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const app = getWorkspaceMockApp(appId);
  if (!app) return null;
  const t = getT("en");
  const live = app.status === "published";

  return <div className="flex flex-col gap-4 p-4 sm:p-5"><section className="rounded-2xl border border-line bg-surface p-5"><h2 className="text-sm font-semibold">{t("Domain")}</h2><p className="text-xs text-muted">{live ? t("Where your users open the app.") : t("Not published yet. Pick the address when you publish.")}</p><div className="mt-3 flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"><Globe size={15} className="shrink-0 text-muted" /><span className="min-w-0 flex-1 truncate font-mono text-sm">{live ? app.url.replace("https://", "") : t("Not published")}</span>{live && <CopyButton value={app.url} compact />}</div><p className="mt-2 text-xs text-muted">{t("Custom domains like pay.yourshop.com come with the Builder plan.")}</p></section>{projectIdSchema.safeParse(appId).success && <PollarCredits appId={appId} />}<EnvTab app={app} />{projectIdSchema.safeParse(appId).success && <DeleteProject appId={appId} />}</div>;
}
