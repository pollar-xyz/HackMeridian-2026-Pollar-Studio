"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type SettingsSection = "profile" | "billing" | "usage" | "plan";
interface UiState {
  creditsOpen: boolean; setCreditsOpen(open: boolean): void;
  settings: SettingsSection | null; openSettings(section?: SettingsSection): void; closeSettings(): void;
}
const UiContext = createContext<UiState | null>(null);
export function UiProvider({ children }: { children: ReactNode }) {
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsSection | null>(null);
  const value = useMemo<UiState>(() => ({ creditsOpen, setCreditsOpen, settings,
    openSettings: (section = "profile") => { setSettings(section); setCreditsOpen(false); },
    closeSettings: () => setSettings(null),
  }), [creditsOpen, settings]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}
export function useUiStore<T>(selector: (state: UiState) => T): T {
  const value = useContext(UiContext);
  if (!value) throw new Error("useUiStore must be used within UiProvider");
  return selector(value);
}
