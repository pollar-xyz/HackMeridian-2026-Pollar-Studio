import Link from "next/link";
import { Suspense } from "react";
import { GeneratedApp } from "@/components/generated/GeneratedApp";
import { MOCK_DATA } from "@/lib/mock/data";

export default function PreviewPage({ params }: PageProps<"/preview/[slug]">) {
  return <Suspense fallback={<div className="flex min-h-dvh items-center justify-center" aria-busy="true" />}><PreviewContent params={params} /></Suspense>;
}

async function PreviewContent({ params }: { params: PageProps<"/preview/[slug]">["params"] }) {
  const { slug } = await params;
  const app = MOCK_DATA.apps.find((item) => item.slug === slug);
  if (!app) return <PreviewMessage title="This app does not exist" detail={`The slug ${slug} is not registered in Pollar.`} />;
  if (!app.previewSha && app.status !== "published") return <PreviewMessage title={`${app.name} is not published yet`} detail="Finish the build in Studio and come back." />;
  return <main className="flex min-h-dvh flex-col" style={app.themeColor ? ({ "--accent": app.themeColor, "--accent-strong": app.themeColor } as React.CSSProperties) : undefined}>
    {app.status !== "published" && <div className="bg-amber-400 px-4 py-1 text-center text-[11px] font-medium text-[#3b2a00]">Preview, not published yet</div>}
    <GeneratedApp app={app} />
  </main>;
}

function PreviewMessage({ title, detail }: { title: string; detail: string }) {
  return <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center"><p className="text-lg font-semibold">{title}</p><p className="text-sm text-muted">{detail}</p><Link href="/" className="text-sm font-medium text-accent hover:underline">Go to Pollar Studio</Link></main>;
}
