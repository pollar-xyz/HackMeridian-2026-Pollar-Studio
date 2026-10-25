"use client";

import { readLocal, useLocalValue, writeLocal } from "@/lib/mock/local-state";

// The hub-api session, the same one the dashboard, Pay and Admin sign into.
export interface SessionData {
  token: string;
  refresh?: { token: string; expiresAt: number };
  user: { id: string; role?: string };
  data: { mail: string; first_name: string; last_name: string; avatar: string };
}

const SESSION_KEY = "pollar-studio:session";
// Set by a login that used no passkey; the studio then offers to set one up.
const PROMPT_KEY = "pollar-studio:passkey-prompt";

export const HUB_API = process.env.NEXT_PUBLIC_HUB_API_URL;

/** `undefined` before hydration, `null` when signed out. */
export function useSession(): SessionData | null | undefined {
  return useLocalValue<SessionData>(SESSION_KEY);
}

export function getSession(): SessionData | null {
  return readLocal<SessionData>(SESSION_KEY);
}

export function signIn(session: SessionData, offerPasskey: boolean) {
  if (offerPasskey) sessionStorage.setItem(PROMPT_KEY, "1");
  writeLocal(SESSION_KEY, session);
}

export function takePasskeyPrompt(): boolean {
  const pending = sessionStorage.getItem(PROMPT_KEY) === "1";
  sessionStorage.removeItem(PROMPT_KEY);
  return pending;
}

/** Drops the session here and revokes it on hub-api. */
export function signOut() {
  const session = getSession();
  writeLocal(SESSION_KEY, null);
  if (!session) return;
  void fetch(`${HUB_API}/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
    body: "{}",
  }).catch(() => {});
}

// Temporary Studio development credential; production uses the signed-in user.
export function getStudioAccessToken() {
  return (process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_STUDIO_DEV_TOKEN : undefined) ?? getSession()?.token;
}
