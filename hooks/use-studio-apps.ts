"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getStudioAccessToken, useSession } from "@/lib/auth/session";
import { studioAppsStore } from "@/lib/ai/studio-apps-store";

export function useStudioApps() {
  useSession(); // Re-select the user-scoped cache when the session changes.
  const key = typeof window === "undefined" ? "" : getStudioAccessToken() ?? "";
  const getSnapshot = useCallback(() => studioAppsStore.getSnapshot(key), [key]);
  const state = useSyncExternalStore(
    studioAppsStore.subscribe,
    getSnapshot,
    studioAppsStore.getServerSnapshot,
  );

  useEffect(() => { studioAppsStore.ensureLoaded(key); }, [key]);
  const refresh = useCallback(() => studioAppsStore.refresh(key), [key]);

  return { ...state, refresh };
}
