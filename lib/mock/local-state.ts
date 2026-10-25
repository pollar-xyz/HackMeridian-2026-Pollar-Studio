"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Small localStorage hook built on useSyncExternalStore so reads are hydration safe
// and writes made from this tab or another tab propagate to every subscriber.

const listeners = new Set<() => void>();
const SERVER = "__server__";

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeLocal<T>(key: string, value: T | null): void {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
  emit();
}

// Returns `undefined` while rendering on the server or before hydration, `null` if empty.
export function useLocalValue<T>(key: string): T | null | undefined {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => SERVER,
  );
  return useMemo(() => {
    if (raw === SERVER) return undefined;
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [raw]);
}

export function useLocalState<T>(key: string): [T | null | undefined, (next: T | null) => void] {
  const value = useLocalValue<T>(key);
  const setValue = useCallback((next: T | null) => writeLocal(key, next), [key]);
  return [value, setValue];
}
