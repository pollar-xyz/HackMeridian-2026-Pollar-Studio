"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type Lang = "en" | "es" | "pt";
export const PREFS_KEY = "pollar-studio-prefs";
interface PrefsState {
  theme: Theme; lang: Lang; sidebarCollapsed: boolean;
  setTheme(theme: Theme): void; setLang(lang: Lang): void; setSidebarCollapsed(collapsed: boolean): void;
}
const PrefsContext = createContext<PrefsState | null>(null);
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLang] = useState<Lang>("en");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => applyPrefs(theme, lang), [theme, lang]);
  const value = useMemo(() => ({ theme, lang, sidebarCollapsed, setTheme, setLang, setSidebarCollapsed }), [theme, lang, sidebarCollapsed]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
export function usePrefs<T>(selector: (state: PrefsState) => T): T {
  const value = useContext(PrefsContext);
  if (!value) throw new Error("usePrefs must be used within PrefsProvider");
  return selector(value);
}
export function applyPrefs(theme: Theme, lang: Lang): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;
}
export const PREFS_BOOT_SCRIPT = `document.documentElement.dataset.theme='light';document.documentElement.lang='en';`;
