"use client";

import { useEffect, useState } from "react";
import type { CreditsView } from "@/app/api/credits/credits";

/** The account's generation credits, read when a panel opens: they change with every build. */
export function useStudioCredits() {
  const [state, setState] = useState<{ credits?: CreditsView; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/credits", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Could not load your credits.");
        setState({ credits: await response.json() as CreditsView, loading: false });
      })
      .catch((error: unknown) => { if (!controller.signal.aborted) setState({ error: error instanceof Error ? error.message : "Could not load your credits.", loading: false }); });
    return () => controller.abort();
  }, []);
  return state;
}
