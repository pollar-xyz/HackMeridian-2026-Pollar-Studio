import { Suspense } from "react";
import { redirect } from "next/navigation";

export default function AppDetailPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="flex-1" aria-busy="true" />}><RedirectToPreview params={params} /></Suspense>;
}

async function RedirectToPreview({ params }: { params: Promise<{ appId: string }> }): Promise<React.ReactNode> {
  const { appId } = await params;
  redirect(`/studio/${appId}/preview`);
}
