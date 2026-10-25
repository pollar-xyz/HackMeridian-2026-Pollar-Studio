import { Suspense } from "react";
import { BuiltWith } from "@/components/studio/BuiltWith";
import { getApp } from "../layout";

export default function StackPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-busy="true" />}><StackContent params={params} /></Suspense>;
}

async function StackContent({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const app = getApp(appId);
  return app ? <div className="p-4 sm:p-5"><BuiltWith app={app} /></div> : null;
}
