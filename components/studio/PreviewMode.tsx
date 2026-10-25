"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/lib/i18n";

type PreviewMode = "desktop" | "mobile";
const Context = createContext<{
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;
} | null>(null);

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  return <Context.Provider value={{ mode, setMode }}>{children}</Context.Provider>;
}

export function usePreviewMode() {
  const context = useContext(Context);
  if (!context) throw new Error("Preview controls require PreviewModeProvider");
  return context;
}

export function PreviewModeControls() {
  const { mode, setMode } = usePreviewMode();
  const t = useT();
  return (
    <ToggleGroup type="single" value={mode} onValueChange={(value) => {
      if (value === "desktop" || value === "mobile") setMode(value);
    }} aria-label={t("Preview")} className="shrink-0 gap-0.5">
      {(["desktop", "mobile"] as const).map((item) => (
        <ToggleGroupItem
          key={item}
          value={item}
          title={t(item === "desktop" ? "Desktop" : "Mobile")}
          aria-label={t(item === "desktop" ? "Desktop" : "Mobile")}
          className="h-8 w-8 shrink-0 rounded-md p-0 text-muted data-[state=on]:bg-surface data-[state=on]:shadow-sm [&_svg]:shrink-0"
        >
          {item === "desktop" ? <Monitor size={16} /> : <Smartphone size={16} />}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function PreviewModeCorner() {
  return <div className="absolute bottom-4 right-4 z-10 rounded-xl border border-line bg-surface p-1 shadow-sm"><PreviewModeControls /></div>;
}
