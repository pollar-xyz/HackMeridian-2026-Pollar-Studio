"use client";

import type { App } from "@/lib/mock/types";
import { usePreviewMode } from "./PreviewMode";

export function PreviewFrame({ app }: { app: App }) {
  const { mode } = usePreviewMode();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {mode === "desktop" ? <iframe title={`${app.name} preview`} src={`/preview/${app.slug}`} className="block min-h-[560px] w-full flex-1 bg-surface" /> : <div className="flex flex-1 justify-center overflow-x-auto px-3 py-6"><div className="shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-lg" style={{ width: 402 }}><div className="overflow-hidden rounded-[1.7rem] bg-surface" style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "linear-gradient(white, white)" }}><iframe title={`${app.name} preview`} src={`/preview/${app.slug}`} className="block" style={{ width: 390, height: 720 }} /></div></div></div>}
    </div>
  );
}
