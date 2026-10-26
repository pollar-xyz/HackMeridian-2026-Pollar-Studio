import "server-only";
import { seal, unseal } from "./seal";
import { OidcError, oidcConfig, refreshTokens, type StudioSession } from "./oidc";

export const SESSION_COOKIE = "pollar_studio_session";
export const LOGIN_COOKIE = "pollar_studio_login";

// The refresh token's lifetime on hub-api (contract: 30 days). The cookie
// outliving it would only hold a session that can no longer be refreshed.
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
export const LOGIN_MAX_AGE = 10 * 60;
// Refresh this long before the access token expires, so a request that reaches
// api-studio with it still finds it valid.
export const REFRESH_MARGIN_MS = 60_000;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export const loginCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/auth/callback",
  maxAge: LOGIN_MAX_AGE,
};

export interface LoginTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
}

export const sealSession = (session: StudioSession) => seal(session, oidcConfig().sessionSecret, SESSION_MAX_AGE);
export const unsealSession = (value: string | undefined) => unseal<StudioSession>(value, oidcConfig().sessionSecret);
export const sealLogin = (login: LoginTransaction) => seal(login, oidcConfig().sessionSecret, LOGIN_MAX_AGE);
export const unsealLogin = (value: string | undefined) => unseal<LoginTransaction>(value, oidcConfig().sessionSecret);

export function readCookie(request: Request, name: string) {
  for (const part of request.headers.get("cookie")?.split(";") ?? []) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
}

/** The `Authorization` header route handlers forward to api-studio, or null when signed out. */
export async function studioAuthorization(request: Request) {
  // Local development can talk to api-studio with a fixed token it accepts.
  const devToken = process.env.NODE_ENV === "development" ? process.env.STUDIO_DEV_TOKEN : undefined;
  if (devToken) return `Bearer ${devToken}`;
  const session = await unsealSession(readCookie(request, SESSION_COOKIE));
  return session ? `Bearer ${session.accessToken}` : null;
}

export type RefreshResult = { session: StudioSession } | { expired: true };

// hub-api rotates refresh tokens and revokes the whole grant when one is used
// twice. The browser sends parallel requests (polling, chat, prefetches) with
// the same cookie, so every caller holding the same refresh token shares one
// refresh, and the outcome is kept a while for requests already in flight.
const refreshes = new Map<string, Promise<RefreshResult>>();
const KEEP_RESULT_MS = 2 * 60_000;

export function refreshSession(session: StudioSession): Promise<RefreshResult> {
  const key = session.refreshToken;
  if (!key) return Promise.resolve({ expired: true });
  let pending = refreshes.get(key);
  if (!pending) {
    pending = refreshTokens(session).then(
      (next): RefreshResult => ({ session: next }),
      (error): RefreshResult => {
        if (error instanceof OidcError && error.code === "invalid_grant") return { expired: true };
        throw error;
      },
    );
    refreshes.set(key, pending);
    const forget = () => setTimeout(() => refreshes.delete(key), KEEP_RESULT_MS).unref?.();
    // A transient failure is forgotten at once so the next request can retry.
    pending.then(forget, () => refreshes.delete(key));
  }
  return pending;
}
