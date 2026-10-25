import { Suspense } from "react";
import { DeploysTab } from "@/components/studio/AppDeployments";
import { getApp } from "../layout";
import { MOCK_DATA } from "@/lib/mock/data";

export default function DeploysPage({ params }: { params: Promise<{ appId: string }> }) {
  return <Suspense fallback={<div className="m-5 h-96 animate-pulse rounded-2xl bg-surface" aria-busy="true" />}><DeploysContent params={params} /></Suspense>;
}

async function DeploysContent({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const app = getApp(appId);
  if (!app) return null;
  const jobs = MOCK_DATA.jobs.filter((job) => job.appId === appId).sort((a, b) => b.startedAt - a.startedAt);
  return <div className="flex flex-col gap-4 p-4 sm:p-5"><DeploysTab app={app} jobs={jobs} /></div>;
}
