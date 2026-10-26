"use client";

import { Minimize2 } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { useT } from "@/lib/i18n";
import { usePreviewMode } from "./PreviewMode";
import { useStudioApps } from "@/hooks/use-studio-apps";
import { useStudioChat } from "@/hooks/use-studio-chat";

export function PreviewFrame({ app }: { app: App }) {
  const { mode, frameRef, fullscreen, toggleFullscreen } = usePreviewMode();
  const t = useT();
  const { apps } = useStudioApps();
  const project = apps.find((item) => item.id === app.id);
  const { urlStatus, error } = useStudioChat(app.id);
  const realProject = app.id.startsWith("prj_");
  const src = project?.origin ?? `/preview/${app.slug}`;
  const name = project?.name ?? app.name;

  if (realProject && (urlStatus === "expired" || urlStatus === "failed" || urlStatus === "building" || !project?.origin)) return <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted" role="status">{error ?? (urlStatus === "expired" ? "Este deployment expiró. Envía un mensaje para generar una nueva versión." : urlStatus === "failed" ? "El deployment falló." : "El preview aparecerá cuando el servidor confirme que la app está disponible.")}</div>;

  return (
    <div ref={frameRef} className="relative flex min-h-0 flex-1 flex-col bg-background">
      {fullscreen && <button type="button" onClick={toggleFullscreen} title={t("Exit full screen")} aria-label={t("Exit full screen")} className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-sm hover:text-foreground"><Minimize2 size={16} /></button>}
      {/* The app is cross-origin: without the clipboard-write delegation its copy buttons fail silently. */}
      {mode === "desktop" ? <iframe title={`${name} preview`} src={src} allow="clipboard-write" className="block min-h-[560px] w-full flex-1 bg-surface" /> : <div className="flex flex-1 justify-center overflow-x-auto px-3 py-6"><div className="shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-lg" style={{ width: 402 }}><div className="overflow-hidden rounded-[1.7rem] bg-surface" style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "linear-gradient(white, white)" }}><iframe title={`${name} preview`} src={src} allow="clipboard-write" className="block" style={{ width: 390, height: 720 }} /></div></div></div>}
    </div>
  );
}
