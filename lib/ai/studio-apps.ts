"use client";

import { useLocalValue, readLocal, writeLocal } from "@/lib/mock/local-state";
import { studioAppSchema, type StudioApp } from "@/lib/schemas/studio-app";

const KEY = "studio-created-apps";

function parseApps(value: unknown): StudioApp[] {
  const parsed = studioAppSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function rememberStudioApp(id: string, prompt: string) {
  const apps = parseApps(readLocal(KEY));
  if (apps.some((app) => app.id === id)) return;
  const app = studioAppSchema.parse({
    id, prompt, name: prompt.replace(/\s+/g, " ").trim().slice(0, 80), createdAt: Date.now(),
  });
  try {
    writeLocal(KEY, [app, ...apps]);
  } catch { /* The conversation still works when browser storage is unavailable. */ }
}

export function useStudioApps() {
  const value = useLocalValue<unknown>(KEY);
  return { apps: parseApps(value), loading: value === undefined };
}
