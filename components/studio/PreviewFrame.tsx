"use client";

import type { App } from "@/lib/mock/types";
import { usePreviewMode } from "./PreviewMode";
import { useStudioApps } from "@/hooks/use-studio-apps";
import { useStudioChat } from "@/hooks/use-studio-chat";

export function PreviewFrame({ app }: { app: App }) {
  const { mode } = usePreviewMode();
  const { apps } = useStudioApps();
  const project = apps.find((item) => item.id === app.id);
  const { urlStatus, error } = useStudioChat(app.id);
  const realProject = app.id.startsWith("prj_");
  const src = project?.origin ?? `/preview/${app.slug}`;
  const name = project?.name ?? app.name;

  if (realProject && (urlStatus === "expired" || urlStatus === "failed" || urlStatus === "building" || !project?.origin)) return <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted" role="status">{error ?? (urlStatus === "expired" ? "Este deployment expiró. Envía un mensaje para generar una nueva versión." : urlStatus === "failed" ? "El deployment falló." : "El preview aparecerá cuando el servidor confirme que la app está disponible.")}</div>;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {mode === "desktop" ? <iframe title={`${name} preview`} src={src} className="block min-h-[560px] w-full flex-1 bg-surface" /> : <div className="flex flex-1 justify-center overflow-x-auto px-3 py-6"><div className="shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-lg" style={{ width: 402 }}><div className="overflow-hidden rounded-[1.7rem] bg-surface" style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "linear-gradient(white, white)" }}><iframe title={`${name} preview`} src={src} className="block" style={{ width: 390, height: 720 }} /></div></div></div>}
    </div>
  );
}
