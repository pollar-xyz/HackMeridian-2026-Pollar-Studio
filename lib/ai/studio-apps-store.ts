"use client";

import { getSessionKey } from "@/lib/auth/session";
import type { MarketplaceListing } from "@/lib/schemas/marketplace";
import { projectListSchema } from "@/app/api/chat/schemas/studio-api";
import { studioAppSchema, type StudioApp } from "@/lib/schemas/studio-app";

type AppsState = { apps: StudioApp[]; loading: boolean; error?: string };
const empty: AppsState = { apps: [], loading: true };
const states = new Map<string, AppsState>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function update(key: string, state: AppsState) { state = { ...state, apps: [...state.apps].sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)) }; states.set(key, state); listeners.forEach(listener => listener()); }

export function rememberStudioApp(id: string, prompt: string, name?: string, origin?: string) {
  const key = getSessionKey();
  const state = states.get(key) ?? empty;
  const existing = state.apps.find(app => app.id === id);
  const app = studioAppSchema.parse({ id, prompt: prompt || "Studio project", name: (name ?? existing?.name ?? "Studio project").slice(0, 80),
    marketplace: existing?.marketplace,
    createdAt: existing?.createdAt ?? Date.now(), updatedAt: existing?.updatedAt ?? existing?.createdAt ?? Date.now(), origin: origin ?? existing?.origin });
  update(key, { ...state, apps: [app, ...state.apps.filter(item => item.id !== id)] });
}

export function rememberMarketplace(id: string, marketplace?: MarketplaceListing) {
  const key = getSessionKey();
  const state = states.get(key);
  if (state) update(key, { ...state, apps: state.apps.map(app => app.id === id ? { ...app, marketplace } : app) });
}

export function touchStudioApp(id: string) {
  const key = getSessionKey();
  const state = states.get(key);
  if (state) update(key, { ...state, apps: state.apps.map(app => app.id === id ? { ...app, updatedAt: Date.now() } : app) });
}

async function loadApps(key: string) {
  if (pending.has(key)) return;
  pending.add(key);
  const baseline = states.get(key)?.apps ?? [];
  try {
    const response = await fetch("/api/chat", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudieron cargar las apps.");
    const { projects } = projectListSchema.parse(await response.json());
    const apps = projects.map(project => studioAppSchema.parse({ id: project.projectId, name: project.identity.displayName.slice(0, 80),
      prompt: project.identity.description || "Studio project", marketplace: project.marketplace, createdAt: Date.parse(project.createdAt), updatedAt: Date.parse(project.updatedAt ?? project.createdAt), origin: project.url ?? undefined }));
    const serverIds = new Set(apps.map(app => app.id));
    const current = states.get(key)?.apps ?? [];
    const recent = current.filter(app => !serverIds.has(app.id));
    const merged = apps.map(app => {
      const local = current.find(item => item.id === app.id);
      return local && local !== baseline.find(item => item.id === app.id) ? local : app;
    });
    update(key, { apps: [...recent, ...merged], loading: false });
  } catch (error) {
    update(key, { apps: states.get(key)?.apps ?? [], loading: false, error: error instanceof Error ? error.message : "No se pudieron cargar las apps." });
  } finally { pending.delete(key); }
}

export const studioAppsStore = {
  subscribe,
  getSnapshot: (key: string) => states.get(key) ?? empty,
  getServerSnapshot: () => empty,
  ensureLoaded(key: string) {
    if (key && (!states.has(key) || states.get(key)?.loading)) void loadApps(key);
  },
  refresh: loadApps,
};
