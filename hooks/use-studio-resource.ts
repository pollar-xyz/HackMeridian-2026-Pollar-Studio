"use client";

import { useCallback, useEffect, useState } from "react";

type Resource<T> = { scope: string; data?: T; error?: string };

// Studio resources refresh without overlapping requests. The user and project
// IDs scope the state; switching accounts never shows an old response.
export function useStudioResource<T>(
  url: string | null,
  userId: string | undefined,
  read: (response: Response) => Promise<T>,
  interval: number,
) {
  const scope = `${url ?? ""}:${userId ?? ""}`;
  const [state, setState] = useState<Resource<T>>({ scope: "" });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!url || !userId) return;
    const requestUrl = url;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let pending = false;
    async function load() {
      if (pending || controller.signal.aborted) return;
      pending = true;
      clearTimeout(timer);
      try {
        const response = await fetch(requestUrl, { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(typeof body?.error === "string" ? body.error : "Could not load Studio data.");
        }
        const data = await read(response);
        if (!controller.signal.aborted) setState({ scope, data });
      } catch (error) {
        if (!controller.signal.aborted) setState(previous => ({
          scope, data: previous.scope === scope ? previous.data : undefined,
          error: error instanceof Error ? error.message : "Could not load Studio data.",
        }));
      } finally {
        pending = false;
        if (interval && !controller.signal.aborted) timer = setTimeout(() => {
          if (document.visibilityState === "visible") void load();
        }, interval);
      }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    void load();
    return () => { controller.abort(); clearTimeout(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [url, userId, scope, read, interval, revision]);

  const current = state.scope === scope ? state : undefined;
  return { data: current?.data, error: current?.error, loading: !current?.data && !current?.error, refresh };
}
