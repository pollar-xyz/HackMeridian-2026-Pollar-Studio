"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { studioChatStore } from "@/lib/ai/studio-chat-store";

export function useStudioChat(appId: string) {
  const getSnapshot = useCallback(() => studioChatStore.getSnapshot(appId), [appId]);
  const snapshot = useSyncExternalStore(
    studioChatStore.subscribe,
    getSnapshot,
    studioChatStore.getServerSnapshot,
  );

  useEffect(() => { studioChatStore.ensureLoaded(appId); }, [appId]);

  const send = useCallback((value: string) => studioChatStore.send(appId, value), [appId]);
  const retry = useCallback(() => studioChatStore.retry(appId), [appId]);
  const stop = useCallback(() => studioChatStore.stop(appId), [appId]);
  const confirmDataLoss = useCallback(() => studioChatStore.confirmDataLoss(appId), [appId]);
  const dismissDataLoss = useCallback(() => studioChatStore.dismissDataLoss(appId), [appId]);

  return { ...snapshot, send, retry, stop, confirmDataLoss, dismissDataLoss };
}
