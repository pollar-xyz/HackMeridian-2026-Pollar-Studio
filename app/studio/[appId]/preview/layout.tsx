import { Suspense } from "react";
import { getMockApp } from "@/lib/mock/get-app";
import { AppWorkspaceHeader } from "@/components/studio/AppWorkspaceHeader";
import { ChatAppHeader } from "@/components/studio/ChatAppHeader";
import { PreviewModeCorner, PreviewModeProvider } from "@/components/studio/PreviewMode";

export const instant = false;

export default function PreviewLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}) {
  return <Suspense fallback={<div className="min-h-96 flex-1 animate-pulse bg-surface" aria-busy="true" />}>
    <PreviewBrowser params={params}>{children}</PreviewBrowser>
  </Suspense>;
}

async function PreviewBrowser({ children, params }: { children: React.ReactNode; params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const app = getMockApp(appId);
  return <PreviewModeProvider>
    <div className="relative flex min-h-0 flex-1 flex-col">
      {app ? <AppWorkspaceHeader app={app} /> : <ChatAppHeader appId={appId} />}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">{children}</div>
      <PreviewModeCorner />
    </div>
  </PreviewModeProvider>;
}
