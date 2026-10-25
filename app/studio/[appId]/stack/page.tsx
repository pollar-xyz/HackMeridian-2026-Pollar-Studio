import { Suspense } from "react";
import { StudioBuiltWith } from "@/components/studio/StudioBuiltWith";

// Project details load in the client after the workspace mounts.
export const instant = false;

export default function StackPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-busy="true" />}><StackContent params={params} /></Suspense>;
}

async function StackContent({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <StudioBuiltWith key={appId} appId={appId} />;
}
