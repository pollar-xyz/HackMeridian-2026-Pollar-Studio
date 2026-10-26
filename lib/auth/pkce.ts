const encoder = new TextEncoder();

export function base64url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

/** A random URL-safe value for `state`, `nonce` and the PKCE `code_verifier`. */
export function randomToken(bytes = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** The S256 `code_challenge` of a verifier (RFC 7636, section 4.2). */
export async function codeChallenge(verifier: string) {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
}

// Only a path on this origin: `//host` and `/\host` are protocol-relative to a
// browser and would turn the post-login redirect into an open redirect.
export function safeReturnTo(value: string | null | undefined, fallback = "/studio") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
