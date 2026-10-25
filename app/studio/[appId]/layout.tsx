import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppSectionNav } from "@/components/studio/AppSectionNav";
import { MOCK_DATA } from "@/lib/mock/data";
import { getMockApp } from "@/lib/mock/get-app";
import { getT } from "@/lib/i18n/translate";
import { workspaceAppIdSchema } from "@/lib/schemas/studio-app";

// StudioShell waits for browser-stored authentication before mounting this layout.
// Its server validation cannot render the workspace until that session is loaded.
export const instant = false;

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
  chat,
  params,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex flex-1" aria-busy="true" />}>
      <Workspace params={params} chat={chat}>{children}</Workspace>
    </Suspense>
  );
}

async function Workspace({
  children,
  chat,
  params,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = getMockApp(appId);
  if (!app && !workspaceAppIdSchema.safeParse(appId).success) notFound();
  const t = getT("en");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4 lg:h-dvh lg:flex-none">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex-row">
        <aside className="flex h-[28rem] w-full shrink-0 flex-col border-b border-line lg:h-auto lg:w-[22rem] lg:border-b-0 lg:border-r xl:w-[25rem]">{chat}</aside>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <AppSectionNav appId={appId} sections={SECTIONS.map(([section, label]) => ({ section, label: t(label) }))} ariaLabel={t("App sections")} />
          <main className="mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-b-xl border border-t-0 border-foreground/20 bg-surface shadow-sm sm:mx-4 sm:mb-4">{children}</main>
        </section>
      </div>
    </div>
  );
}
