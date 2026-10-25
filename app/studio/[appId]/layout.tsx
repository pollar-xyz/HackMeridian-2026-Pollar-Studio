import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { AppWorkspaceHeader } from "@/components/studio/AppWorkspaceHeader";
import { AppSectionNav } from "@/components/studio/AppSectionNav";
import { MOCK_DATA } from "@/lib/mock/data";
import { getT } from "@/lib/i18n/translate";
import type { App } from "@/lib/mock/types";

const SECTIONS = [
  ["preview", "Preview"],
  ["contract", "Contract"],
  ["stack", "Built with"],
  ["deploys", "Deploys"],
  ["settings", "Settings"],
] as const;

export function generateStaticParams() {
  return MOCK_DATA.apps.map((app) => ({ appId: app.id }));
}

export default function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex flex-1" aria-busy="true" />}>
      <Workspace params={params}>{children}</Workspace>
    </Suspense>
  );
}

async function Workspace({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = MOCK_DATA.apps.find((item) => item.id === appId);
  if (!app) notFound();
  const t = getT("en");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4 lg:h-dvh lg:flex-none">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex-row">
        <aside className="flex h-[28rem] w-full shrink-0 flex-col border-b border-line lg:h-auto lg:w-[22rem] lg:border-b-0 lg:border-r xl:w-[25rem]">
          <ChatPanel app={app} embedded />
        </aside>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppWorkspaceHeader app={app} />
          <AppSectionNav appId={app.id} sections={SECTIONS.map(([section, label]) => ({ section, label: t(label) }))} ariaLabel={t("App sections")} />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">{children}</main>
        </section>
      </div>
    </div>
  );
}

export function getApp(appId: string): App | undefined {
  return MOCK_DATA.apps.find((item) => item.id === appId);
}
