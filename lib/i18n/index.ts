"use client";

import { useCallback } from "react";
import { usePrefs, type Lang } from "@/lib/prefs";
import { getT, translate, LANG_LABELS } from "./translate";

export { getT, translate, LANG_LABELS };

export function useT() {
  const lang = usePrefs((s) => s.lang);
  return useCallback((text: string, vars?: Record<string, string | number>) => getT(lang)(text, vars), [lang]);
}

export function useLang(): Lang {
  return usePrefs((s) => s.lang);
}

// "5m ago" in the studio language. The generated apps keep their own English copy.
export function useAgo() {
  const t = useT();
  return useCallback(
    (at: number, now: number = Date.now()) => {
      const s = Math.floor(Math.max(0, now - at) / 1000);
      if (s < 10) return t("just now");
      if (s < 60) return t("{n}s ago", { n: s });
      const m = Math.floor(s / 60);
      if (m < 60) return t("{n}m ago", { n: m });
      const h = Math.floor(m / 60);
      if (h < 24) return t("{n}h ago", { n: h });
      return t("{n}d ago", { n: Math.floor(h / 24) });
    },
    [t],
  );
}
