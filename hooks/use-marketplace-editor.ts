"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { marketplaceListingSchema, type MarketplaceInput } from "@/lib/schemas/marketplace";
import { projectToolsSchema } from "@/lib/schemas/studio-built-with";
import { rememberMarketplace } from "@/lib/ai/studio-apps-store";

const editorSchema = z.object({ revision: z.number().int().positive(), name: z.string(), url: z.string().nullable(), marketplace: marketplaceListingSchema.nullable(), tools: projectToolsSchema.optional() });
const savedSchema = z.object({ projectId: z.string(), revision: z.number(), marketplace: marketplaceListingSchema.nullable() });

export function useMarketplaceEditor(appId: string) {
  const [initial, setInitial] = useState<z.infer<typeof editorSchema>>();
  const [loading, setLoading] = useState(!!appId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const load = useCallback((signal?: AbortSignal) => {
    const request = async () => {
      if (!appId) throw new Error("A project is required for publishing.");
      const response = await fetch(`/api/marketplace?appId=${encodeURIComponent(appId)}`, { credentials: "same-origin", cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load the marketplace listing.");
      return editorSchema.parse(data);
    };
    return request().then(data => {
      if (!signal?.aborted) { setInitial(data); setError(undefined); }
    }).catch(error => {
      if (!signal?.aborted) setError(error instanceof Error ? error.message : "Could not load the marketplace listing.");
    }).finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [appId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  async function write(input?: MarketplaceInput) {
    if (saving || (appId && !initial)) return null;
    setSaving(true); setError(undefined);
    try {
      const response = await fetch("/api/marketplace", {
        method: !input ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json", ...(initial ? { "If-Match": `rev-${initial.revision}` } : {}) },
        body: JSON.stringify(!input ? { appId } : { appId, listing: input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update the marketplace. Please try again.");
      const saved = savedSchema.parse(data);
      rememberMarketplace(saved.projectId, saved.marketplace ?? undefined);
      return saved;
    } catch (error) { setError(error instanceof Error ? error.message : "Could not update the marketplace. Please try again."); return null; }
    finally { setSaving(false); }
  }
  return { initial, loading, saving, error, reload: load, save: (input: MarketplaceInput) => write(input), remove: () => write() };
}
