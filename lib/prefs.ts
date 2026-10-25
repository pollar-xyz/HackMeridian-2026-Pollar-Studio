"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark";
export type Lang = "en" | "es" | "pt";

export const PREFS_KEY = "pollar-studio-prefs";

interface PrefsState {
  theme: Theme;
  lang: Lang;
  sidebarCollapsed: boolean;
  setTheme(theme: Theme): void;
  setLang(lang: Lang): void;
  setSidebarCollapsed(collapsed: boolean): void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: "light",
      lang: "en",
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    { name: PREFS_KEY, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export function applyPrefs(theme: Theme, lang: Lang): void {
  const root = document.documentElement;
  root.dataset.theme = theme === "dark" ? "dark" : "light";
  root.lang = lang;
}

// Runs before hydration so the first paint already has the right theme.
export const PREFS_BOOT_SCRIPT = `try{var p=(JSON.parse(localStorage.getItem('${PREFS_KEY}')||'{}').state)||{};document.documentElement.dataset.theme=p.theme==='dark'?'dark':'light';if(p.lang){document.documentElement.lang=p.lang}}catch(e){}`;
