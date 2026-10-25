import { Suspense } from "react";
import { DeploysTab } from "@/components/studio/AppDeployments";

// Deployment data loads in the client after the workspace mounts.
export const instant = false;

export default function DeploysPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-busy="true" />}><DeploysContent params={params} /></Suspense>;
}

async function DeploysContent({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <DeploysTab key={appId} appId={appId} />;
}
