"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Maximize2, Monitor, Smartphone } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/lib/i18n";

type PreviewMode = "desktop" | "mobile";
const Context = createContext<{
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;
  /** The element PreviewFrame hands to the browser's fullscreen. */
  frameRef: RefObject<HTMLDivElement | null>;
  fullscreen: boolean;
  toggleFullscreen: () => void;
} | null>(null);

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const frameRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  // Esc leaves fullscreen without going through toggleFullscreen, so the state follows the document.
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement !== null && document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  }, []);
  return <Context.Provider value={{ mode, setMode, frameRef, fullscreen, toggleFullscreen }}>{children}</Context.Provider>;
}

export function usePreviewMode() {
  const context = useContext(Context);
  if (!context) throw new Error("Preview controls require PreviewModeProvider");
  return context;
}

export function PreviewModeControls() {
  const { mode, setMode, toggleFullscreen } = usePreviewMode();
  const t = useT();
  return (
    <div className="flex items-center gap-0.5">
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
    {mode === "desktop" && (
      <button
        type="button"
        onClick={toggleFullscreen}
        title={t("Full screen")}
        aria-label={t("Full screen")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-background hover:text-foreground"
      >
        <Maximize2 size={16} />
      </button>
    )}
    </div>
  );
}

export function PreviewModeCorner() {
  return <div className="absolute bottom-4 right-4 z-10 rounded-xl border border-line bg-surface p-1 shadow-sm"><PreviewModeControls /></div>;
}
