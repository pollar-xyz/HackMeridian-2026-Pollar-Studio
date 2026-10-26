"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { SessionProfile } from "./profile";

export type { SessionProfile } from "./profile";

// The profile of the session cookie, read once per page load from the BFF.
let profile: SessionProfile | null | undefined;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

function set(next: SessionProfile | null) {
  profile = next;
  listeners.forEach((listener) => listener());
}

function load() {
  loading ??= fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" })
    .then(async (response) => set(response.ok ? ((await response.json()).profile as SessionProfile) : null))
    .catch(() => set(null));
  return loading;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** `undefined` while loading, `null` when signed out. */
export function useSession(): SessionProfile | null | undefined {
  const value = useSyncExternalStore(subscribe, () => profile, () => undefined);
  useEffect(() => { void load(); }, []);
  return value;
}

/** Scopes per-user client caches; empty before the profile loads. */
export function getSessionKey() {
  return profile?.id ?? "";
}

/** Ends the studio session and the central Pollar one. */
export function signOut() {
  // A document navigation: these are route handlers that leave for the issuer.
  window.location.assign(new URL("/auth/logout", window.location.href));
}
