"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { App } from "@/lib/mock/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getT } from "@/lib/i18n/translate";

export function PreviewFrame({ app }: { app: App }) {
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const t = getT("en");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex justify-end border-b border-line px-3 py-1">
        <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as typeof mode)} aria-label={t("Preview")} className="gap-0.5">
          {(["desktop", "mobile"] as const).map((item) => <ToggleGroupItem key={item} value={item} title={t(item === "desktop" ? "Desktop" : "Mobile")} aria-label={t(item === "desktop" ? "Desktop" : "Mobile")} className={`flex h-7 w-7 items-center justify-center rounded-md ${mode === item ? "bg-surface text-accent shadow-sm" : "text-muted hover:text-foreground"}`}>{item === "desktop" ? <Monitor size={15} /> : <Smartphone size={15} />}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      {mode === "desktop" ? <iframe title={`${app.name} preview`} src={`/preview/${app.slug}`} className="block min-h-[560px] w-full flex-1 bg-surface" /> : <div className="flex flex-1 justify-center overflow-x-auto px-3 py-6"><div className="shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-lg" style={{ width: 402 }}><div className="overflow-hidden rounded-[1.7rem] bg-surface" style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", maskImage: "linear-gradient(white, white)" }}><iframe title={`${app.name} preview`} src={`/preview/${app.slug}`} className="block" style={{ width: 390, height: 720 }} /></div></div></div>}
    </div>
  );
}
