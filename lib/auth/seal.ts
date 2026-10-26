import { EncryptJWT, jwtDecrypt, type JWTPayload } from "jose";

const encoder = new TextEncoder();
const keys = new Map<string, Promise<Uint8Array>>();

// A 256-bit key for `dir` + A256GCM, derived from the configured secret so any
// string of enough entropy works as STUDIO_SESSION_SECRET.
function keyFor(secret: string) {
  if (secret.length < 32) throw new Error("STUDIO_SESSION_SECRET must be at least 32 characters");
  let key = keys.get(secret);
  if (!key) {
    key = crypto.subtle.digest("SHA-256", encoder.encode(secret)).then((digest) => new Uint8Array(digest));
    keys.set(secret, key);
  }
  return key;
}

/** Encrypts `value` into a compact JWE that expires after `maxAge` seconds. */
export async function seal(value: object, secret: string, maxAge: number) {
  return new EncryptJWT({ v: value } as JWTPayload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .encrypt(await keyFor(secret));
}

/** The sealed value, or null when the JWE is malformed, tampered with, expired or from another key. */
export async function unseal<T>(token: string | undefined, secret: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, await keyFor(secret), {
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    return (payload.v as T) ?? null;
  } catch {
    return null;
  }
}
