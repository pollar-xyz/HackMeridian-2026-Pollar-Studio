"use client";

// hub-api login with passkeys: the email code, passkey login, the second factor
// and registering a passkey. The same flow as @pollar/web-kit/passkeys in
// pollar-web, which this repo cannot import.
import {
  type AuthenticationResponseJSON,
  browserSupportsWebAuthn,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";
import { getSession, HUB_API, type SessionData } from "./session";

export interface MfaChallenge {
  mfaRequired: true;
  mfaToken: string;
}

export type LoginResult = SessionData | MfaChallenge;

export function isMfaChallenge(result: unknown): result is MfaChallenge {
  return typeof result === "object" && result !== null && "mfaRequired" in result;
}

export type HubResult<T> = { ok: true; content: T } | { ok: false; code: string };

interface CeremonyOptions<T> {
  challengeId: string;
  options: T;
}

async function hubPost<T>(path: string, body?: unknown, token?: string): Promise<HubResult<T>> {
  try {
    const res = await fetch(`${HUB_API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body ?? {}),
    });
    const json = (await res.json()) as { success?: boolean; content?: T; code?: string };
    if (json.success && json.content !== undefined) return { ok: true, content: json.content };
    return { ok: false, code: json.code ?? "UNKNOWN_RESPONSE" };
  } catch {
    return { ok: false, code: "NETWORK_ERROR" };
  }
}

// Closing the OS prompt, or letting it time out, is the user saying no. It
// rejects with NotAllowedError, which simplewebauthn passes through as-is.
function ceremonyFailure(err: unknown): string {
  if (err instanceof WebAuthnError && err.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
    return "PASSKEY_ALREADY_REGISTERED";
  }
  if (err instanceof Error && (err.name === "NotAllowedError" || err.name === "AbortError")) return "CEREMONY_CANCELLED";
  return "PASSKEY_VERIFICATION_FAILED";
}

async function getAssertion(options: PublicKeyCredentialRequestOptionsJSON): Promise<HubResult<AuthenticationResponseJSON>> {
  if (!browserSupportsWebAuthn()) return { ok: false, code: "WEBAUTHN_UNSUPPORTED" };
  try {
    return { ok: true, content: await startAuthentication({ optionsJSON: options }) };
  } catch (err) {
    return { ok: false, code: ceremonyFailure(err) };
  }
}

/** The English message for a failed step; the caller passes it through `t()`. */
export function authErrorMessage(code: string): string {
  switch (code) {
    case "CEREMONY_CANCELLED":
      return "The passkey prompt was closed.";
    case "WEBAUTHN_UNSUPPORTED":
      return "This browser does not support passkeys.";
    case "PASSKEY_ALREADY_REGISTERED":
      return "That passkey is already registered.";
    case "HUB_MFA_TOKEN_INVALID":
      return "This sign-in expired. Start again.";
    case "HUB_RECOVERY_CODE_INVALID":
      return "That recovery code is not valid or was already used.";
    case "PASSKEY_UNKNOWN_CREDENTIAL":
    case "PASSKEY_VERIFICATION_FAILED":
    case "PASSKEY_CHALLENGE_MISSING":
      return "We couldn't verify your passkey. Try again.";
    case "INVALID_EMAIL_CODE":
      return "That code is not valid.";
    case "EMAIL_CODE_EXPIRED":
      return "That code has expired. Request a new one.";
    case "EMAIL_CODE_LOCKED":
      return "Too many attempts. Request a new code.";
    default:
      return "Something went wrong. Try again.";
  }
}

export const sendEmailCode = (email: string) => hubPost<{ sent: boolean }>("/v1/auth/email", { email });

export const verifyEmailCode = (email: string, code: string) =>
  hubPost<LoginResult>("/v1/auth/email/verify-code", { email, code });

export const exchangeOAuthCode = (code: string) => hubPost<LoginResult>("/v1/auth/exchange-code", { code });

/** hub-api's Google flow bounces back to `<origin>/auth/callback`; the origin must be in its API_CORS_ORIGINS. */
export function googleLoginUrl() {
  return `${HUB_API}/v1/auth/google?redirect_uri=${encodeURIComponent(window.location.origin)}`;
}

export async function loginWithPasskey(): Promise<HubResult<SessionData>> {
  const started = await hubPost<CeremonyOptions<PublicKeyCredentialRequestOptionsJSON>>("/v1/auth/passkeys/login/options");
  if (!started.ok) return started;
  const assertion = await getAssertion(started.content.options);
  if (!assertion.ok) return assertion;
  return hubPost<SessionData>("/v1/auth/passkeys/login/verify", {
    challengeId: started.content.challengeId,
    response: assertion.content,
  });
}

export async function confirmWithPasskey(mfaToken: string): Promise<HubResult<SessionData>> {
  const started = await hubPost<CeremonyOptions<PublicKeyCredentialRequestOptionsJSON>>("/v1/auth/mfa/passkey/options", {
    mfaToken,
  });
  if (!started.ok) return started;
  const assertion = await getAssertion(started.content.options);
  if (!assertion.ok) return assertion;
  return hubPost<SessionData>("/v1/auth/mfa/passkey/verify", {
    mfaToken,
    challengeId: started.content.challengeId,
    response: assertion.content,
  });
}

export const confirmWithRecoveryCode = (mfaToken: string, code: string) =>
  hubPost<SessionData>("/v1/auth/mfa/recovery-code", { mfaToken, code });

// ─── Signed in ───────────────────────────────────────────────────────────────

export async function countPasskeys(): Promise<number | null> {
  const session = getSession();
  if (!session) return null;
  try {
    const res = await fetch(`${HUB_API}/v1/auth/passkeys`, { headers: { Authorization: `Bearer ${session.token}` } });
    const json = (await res.json()) as { success?: boolean; content?: { passkeys: unknown[] } };
    return json.success && json.content ? json.content.passkeys.length : null;
  } catch {
    return null;
  }
}

/** Create a passkey on this device; the first one comes back with the recovery codes. */
export async function registerPasskey(name: string): Promise<HubResult<{ recoveryCodes: string[] | null }>> {
  const token = getSession()?.token;
  if (!token) return { ok: false, code: "UNAUTHORIZED" };
  if (!browserSupportsWebAuthn()) return { ok: false, code: "WEBAUTHN_UNSUPPORTED" };
  const started = await hubPost<CeremonyOptions<PublicKeyCredentialCreationOptionsJSON>>(
    "/v1/auth/passkeys/register/options",
    {},
    token,
  );
  if (!started.ok) return started;
  let response: RegistrationResponseJSON;
  try {
    response = await startRegistration({ optionsJSON: started.content.options });
  } catch (err) {
    return { ok: false, code: ceremonyFailure(err) };
  }
  return hubPost("/v1/auth/passkeys/register/verify", { challengeId: started.content.challengeId, response, name }, token);
}
