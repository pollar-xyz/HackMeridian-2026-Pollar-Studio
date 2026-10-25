"use client";

import { useEffect } from "react";
import { hydrateStudioStore, syncStudioStoreFromStorage, STORAGE_KEY } from "@/lib/mock/store";
import { usePrefs, applyPrefs, PREFS_KEY } from "@/lib/prefs";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateStudioStore();
    void usePrefs.persist.rehydrate();
    applyPrefs(usePrefs.getState().theme, usePrefs.getState().lang);

    const unsubscribe = usePrefs.subscribe((s) => applyPrefs(s.theme, s.lang));

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEY) syncStudioStoreFromStorage();
      if (e.key === PREFS_KEY) {
        void usePrefs.persist.rehydrate();
        applyPrefs(usePrefs.getState().theme, usePrefs.getState().lang);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return <>{children}</>;
}
