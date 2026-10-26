import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { SessionProfile } from "./profile";

// Studio is the `studio` confidential client of the hub-api OIDC provider
// (docs/plane/DEV-311/contract.md). Every variable is required.
export function oidcConfig() {
  const env = process.env;
  const missing = ["OIDC_ISSUER", "OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET", "OIDC_HUB_RESOURCE", "STUDIO_SESSION_SECRET", "STUDIO_PUBLIC_URL"]
    .filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing ${missing.join(", ")}`);
  if (env.STUDIO_SESSION_SECRET!.length < 32) throw new Error("STUDIO_SESSION_SECRET must be at least 32 characters");
  const publicUrl = new URL(env.STUDIO_PUBLIC_URL!).origin;
  return {
    issuer: env.OIDC_ISSUER!.replace(/\/$/, ""),
    clientId: env.OIDC_CLIENT_ID!,
    clientSecret: env.OIDC_CLIENT_SECRET!,
    resource: env.OIDC_HUB_RESOURCE!,
    sessionSecret: env.STUDIO_SESSION_SECRET!,
    publicUrl,
    redirectUri: `${publicUrl}/auth/callback`,
    postLogoutRedirectUri: `${publicUrl}/`,
  };
}

type Metadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  revocation_endpoint?: string;
};

let discovery: Promise<{ metadata: Metadata; jwks: ReturnType<typeof createRemoteJWKSet> }> | undefined;

export function discover() {
  const { issuer } = oidcConfig();
  discovery ??= (async () => {
    const response = await fetch(`${issuer}/.well-known/openid-configuration`, { cache: "no-store" });
    if (!response.ok) throw new Error(`OIDC discovery failed with ${response.status}`);
    const metadata = (await response.json()) as Metadata;
    if (metadata.issuer !== issuer) throw new Error(`OIDC issuer mismatch: ${metadata.issuer}`);
    return { metadata, jwks: createRemoteJWKSet(new URL(metadata.jwks_uri)) };
  })();
  // A failed discovery is retried on the next request instead of being cached.
  discovery.catch(() => { discovery = undefined; });
  return discovery;
}

export async function authorizationUrl(params: { state: string; nonce: string; codeChallenge: string }) {
  const config = oidcConfig();
  const { metadata } = await discover();
  const url = new URL(metadata.authorization_endpoint);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: "openid email profile offline_access",
    resource: config.resource,
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  }).toString();
  return url;
}

// client_secret_basic: RFC 6749 section 2.3.1 form-encodes both parts first.
function basicAuth(clientId: string, secret: string) {
  return `Basic ${Buffer.from(`${encodeURIComponent(clientId)}:${encodeURIComponent(secret)}`).toString("base64")}`;
}

export class OidcError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(`OIDC ${code} (${status})`);
    this.code = code;
    this.status = status;
  }
}

type TokenResponse = { access_token: string; expires_in?: number; refresh_token?: string; id_token?: string };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const config = oidcConfig();
  const { metadata } = await discover();
  const response = await fetch(metadata.token_endpoint, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: basicAuth(config.clientId, config.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ ...body, resource: config.resource }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.access_token !== "string") {
    throw new OidcError(typeof data?.error === "string" ? data.error : "invalid_response", response.status);
  }
  return data as TokenResponse;
}

async function verifyIdToken(idToken: string, expected: { nonce?: string; sub?: string }) {
  const config = oidcConfig();
  const { jwks } = await discover();
  const { payload } = await jwtVerify(idToken, jwks, { issuer: config.issuer, audience: config.clientId });
  if (expected.nonce !== undefined && payload.nonce !== expected.nonce) throw new OidcError("nonce_mismatch", 400);
  if (expected.sub !== undefined && payload.sub !== expected.sub) throw new OidcError("subject_mismatch", 400);
  if (!payload.sub) throw new OidcError("missing_subject", 400);
  return payload;
}

export function profileFromClaims(claims: JWTPayload): SessionProfile {
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    id: claims.sub ?? "",
    mail: text(claims.email),
    first_name: text(claims.given_name),
    last_name: text(claims.family_name),
    avatar: text(claims.picture),
    role: text(claims.pollar_role) || undefined,
  };
}

export interface StudioSession {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  /** Epoch milliseconds when the access token stops being accepted. */
  expiresAt: number;
  profile: SessionProfile;
}

// Without `expires_in` the token is treated as already due, so the next
// request refreshes it instead of trusting an unknown lifetime.
const expiry = (tokens: TokenResponse) => Date.now() + (tokens.expires_in ?? 0) * 1000;

export async function exchangeCode(code: string, verifier: string, nonce: string): Promise<StudioSession> {
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: oidcConfig().redirectUri,
    code_verifier: verifier,
  });
  if (!tokens.id_token) throw new OidcError("missing_id_token", 400);
  const claims = await verifyIdToken(tokens.id_token, { nonce });
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    expiresAt: expiry(tokens),
    profile: profileFromClaims(claims),
  };
}

export async function refreshTokens(session: StudioSession): Promise<StudioSession> {
  if (!session.refreshToken) throw new OidcError("invalid_grant", 400);
  const tokens = await tokenRequest({ grant_type: "refresh_token", refresh_token: session.refreshToken });
  const claims = tokens.id_token ? await verifyIdToken(tokens.id_token, { sub: session.profile.id }) : null;
  return {
    accessToken: tokens.access_token,
    // The provider rotates the refresh token; keep the old one only if it sent none.
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    idToken: tokens.id_token ?? session.idToken,
    expiresAt: expiry(tokens),
    profile: claims ? profileFromClaims(claims) : session.profile,
  };
}

export async function revokeRefreshToken(token: string) {
  const config = oidcConfig();
  const { metadata } = await discover();
  if (!metadata.revocation_endpoint) return;
  await fetch(metadata.revocation_endpoint, {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: basicAuth(config.clientId, config.clientSecret), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, token_type_hint: "refresh_token" }),
  });
}

export async function endSessionUrl(idToken: string | undefined) {
  const config = oidcConfig();
  const { metadata } = await discover();
  if (!metadata.end_session_endpoint) return new URL(config.postLogoutRedirectUri);
  const url = new URL(metadata.end_session_endpoint);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    post_logout_redirect_uri: config.postLogoutRedirectUri,
    ...(idToken ? { id_token_hint: idToken } : {}),
  }).toString();
  return url;
}
