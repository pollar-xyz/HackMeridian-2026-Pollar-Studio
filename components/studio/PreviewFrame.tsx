"use client";

import type { App } from "@/lib/mock/types";
import { usePreviewMode } from "./PreviewMode";
import { useStudioApps } from "@/lib/ai/studio-apps";
import { rememberStudioApp } from "@/lib/ai/studio-apps";
import { getChatAccessToken, useStudioChat } from "@/lib/ai/use-studio-chat";
import { useEffect, useState } from "react";
import { studioJobSchema } from "@/app/api/chat/schemas/studio-api";

export function PreviewFrame({ app }: { app: App }) {
  const { mode } = usePreviewMode();
  const { apps } = useStudioApps();
  const project = apps.find((item) => item.id === app.id);
  const { jobId, status, initialPrompt } = useStudioChat(app.id);
  const [previewError, setPreviewError] = useState<string>();
  const realProject = app.id.startsWith("prj_");
  useEffect(() => {
    if (!realProject || project?.origin || !jobId || status !== "idle") return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function recover() {
      try {
        const response = await fetch(`/api/chat?jobId=${encodeURIComponent(jobId!)}`, {
          headers: { Authorization: `Bearer ${getChatAccessToken()}` },
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudo recuperar la URL del preview.");
        const job = studioJobSchema.parse(await response.json());
        if (job.projectId !== app.id) throw new Error("El job no pertenece a esta app.");
        const origin = job.result?.deployment?.origin;
        if (origin) {
          rememberStudioApp(app.id, project?.prompt ?? initialPrompt ?? "Nueva app", undefined, origin);
        } else if (job.status === "failed") {
          throw new Error("La generación falló.");
        } else if (++attempts < 30) {
          timer = setTimeout(recover, 2000);
        } else throw new Error("El servidor todavía no devolvió la URL del preview. Recarga para volver a consultar.");
      } catch (error) {
        if (!controller.signal.aborted) setPreviewError(error instanceof Error ? error.message : "No se pudo cargar el preview.");
      }
    }
    void recover();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [realProject, project?.origin, project?.prompt, jobId, status, app.id, initialPrompt]);
  const src = project?.origin ?? `/preview/${app.slug}`;
  const name = project?.name ?? app.name;

  if (realProject && !project?.origin) return <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted" role="status">{previewError ?? (jobId ? "Recuperando la URL del preview…" : "El preview aparecerá cuando el servidor devuelva la URL de la app.")}</div>;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      {mode === "desktop" ? <iframe title={`${name} preview`} src={src} className="block min-h-[560px] w-full flex-1 bg-surface" /> : <div className="flex flex-1 justify-center overflow-x-auto px-3 py-6"><div className="shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-lg" style={{ width: 402 }}><div className="overflow-hidden rounded-[1.7rem] bg-surface" style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "linear-gradient(white, white)" }}><iframe title={`${name} preview`} src={src} className="block" style={{ width: 390, height: 720 }} /></div></div></div>}
    </div>
  );
}
