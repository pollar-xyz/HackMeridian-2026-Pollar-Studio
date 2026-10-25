import { Suspense } from "react";
import { StudioChatPanel } from "@/components/studio/StudioChatPanel";

export default function ChatPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="h-full animate-pulse bg-surface" aria-busy="true" />}><Conversation params={params} /></Suspense>;
}

async function Conversation({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <StudioChatPanel key={appId} appId={appId} embedded />;
}
