"use client";

import { useLocalValue, readLocal, writeLocal } from "@/lib/mock/local-state";
import { studioAppSchema, type StudioApp } from "@/lib/schemas/studio-app";

const KEY = "studio-created-apps";

function parseApps(value: unknown): StudioApp[] {
  const parsed = studioAppSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function rememberStudioApp(id: string, prompt: string, name?: string, origin?: string) {
  const apps = parseApps(readLocal(KEY));
  const existing = apps.find((app) => app.id === id);
  const app = studioAppSchema.parse({
    id, prompt, name: (name ?? existing?.name ?? "Nueva app").slice(0, 80), createdAt: existing?.createdAt ?? Date.now(),
    origin: origin ?? existing?.origin,
  });
  try {
    writeLocal(KEY, [app, ...apps.filter((item) => item.id !== id)]);
  } catch { /* The conversation still works when browser storage is unavailable. */ }
}

export function useStudioApps() {
  const value = useLocalValue<unknown>(KEY);
  return { apps: parseApps(value), loading: value === undefined };
}
