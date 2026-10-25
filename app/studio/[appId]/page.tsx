import { AppDetail } from "@/components/studio/AppDetail";
import { MOCK_DATA } from "@/lib/mock/data";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default function AppDetailPage({ params }: PageProps<"/studio/[appId]">) {
  return <Suspense fallback={<div className="flex flex-1 items-center justify-center py-20" aria-busy="true" />}><AppDetailContent params={params} /></Suspense>;
}

async function AppDetailContent({ params }: { params: PageProps<"/studio/[appId]">["params"] }) {
  const { appId } = await params;
  const app = MOCK_DATA.apps.find((item) => item.id === appId);
  if (!app) notFound();
  const jobs = MOCK_DATA.jobs.filter((job) => job.appId === appId).sort((a, b) => b.startedAt - a.startedAt);
  const txs = MOCK_DATA.txs.filter((tx) => tx.appSlug === app.slug);
  return <AppDetail app={app} jobs={jobs} txs={txs} />;
}
