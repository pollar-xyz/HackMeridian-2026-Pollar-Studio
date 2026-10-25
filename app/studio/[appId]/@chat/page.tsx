import { Suspense } from "react";
import { StudioChatPanel } from "@/components/studio/StudioChatPanel";

// The signed-in conversation is restored after the browser session loads.
export const instant = false;

export default function ChatPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="h-full animate-pulse bg-surface" aria-busy="true" />}><Conversation params={params} /></Suspense>;
}

async function Conversation({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <StudioChatPanel key={appId} appId={appId} embedded />;
}
