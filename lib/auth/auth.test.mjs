import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true };
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

const ISSUER = 'https://accounts.test/oidc';
Object.assign(process.env, {
  OIDC_ISSUER: ISSUER, OIDC_CLIENT_ID: 'studio', OIDC_CLIENT_SECRET: 's3cret:+/', OIDC_HUB_RESOURCE: 'https://hub-api.test',
  STUDIO_SESSION_SECRET: 'test-session-secret-of-at-least-32-chars', STUDIO_PUBLIC_URL: 'https://studio.test/ignored-path',
});

const { codeChallenge, randomToken, safeReturnTo } = await import('./pkce.ts');
const { seal, unseal } = await import('./seal.ts');
const oidc = await import('./oidc.ts');
const cookies = await import('./session-cookie.ts');

const SECRET = 'a-secret-that-is-long-enough-for-the-key';

test('PKCE challenge matches the RFC 7636 appendix B vector', async () => {
  assert.equal(await codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('random tokens are URL-safe, 256-bit and distinct', () => {
  const values = new Set(Array.from({ length: 50 }, () => randomToken()));
  assert.equal(values.size, 50);
  for (const value of values) assert.match(value, /^[A-Za-z0-9_-]{43}$/);
});

test('returnTo keeps same-origin paths and refuses everything else', () => {
  assert.equal(safeReturnTo('/studio/prj_1?tab=deploys'), '/studio/prj_1?tab=deploys');
  for (const value of [null, '', 'studio', 'https://evil.test', '//evil.test', '/\\evil.test']) {
    assert.equal(safeReturnTo(value), '/studio');
  }
});

test('seal and unseal round-trip a value', async () => {
  const value = { accessToken: 'at', profile: { id: 'u1', mail: 'a@b.test' } };
  const token = await seal(value, SECRET, 60);
  assert.equal(token.split('.').length, 5, 'compact JWE');
  assert.ok(!token.includes('a@b.test'));
  assert.deepEqual(await unseal(token, SECRET), value);
});

test('unseal refuses a wrong key, tampering, expiry and garbage', async () => {
  const token = await seal({ v: 1 }, SECRET, 60);
  assert.equal(await unseal(token, 'another-secret-that-is-long-enough-too'), null);
  const parts = token.split('.');
  parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith('AA') ? 'BB' : 'AA');
  assert.equal(await unseal(parts.join('.'), SECRET), null);
  assert.equal(await unseal(await seal({ v: 1 }, SECRET, -1), SECRET), null);
  assert.equal(await unseal('not-a-jwe', SECRET), null);
  assert.equal(await unseal(undefined, SECRET), null);
});

test('seal refuses a short secret', async () => {
  await assert.rejects(seal({}, 'short', 60), /at least 32/);
});

test('cookie parsing finds the session among other cookies', () => {
  const request = new Request('https://studio.test/', { headers: { Cookie: 'a=1; pollar_studio_session=abc.def; b=2' } });
  assert.equal(cookies.readCookie(request, cookies.SESSION_COOKIE), 'abc.def');
  assert.equal(cookies.readCookie(request, 'missing'), undefined);
});

test('studioAuthorization reads the access token from the sealed cookie only', async () => {
  const session = { accessToken: 'access-1', idToken: 'id', expiresAt: Date.now() + 600_000, profile: { id: 'u1', mail: '', first_name: '', last_name: '', avatar: '' } };
  const cookie = `${cookies.SESSION_COOKIE}=${await cookies.sealSession(session)}`;
  assert.equal(await cookies.studioAuthorization(new Request('https://studio.test/', { headers: { Cookie: cookie } })), 'Bearer access-1');
  assert.equal(await cookies.studioAuthorization(new Request('https://studio.test/', { headers: { Authorization: 'Bearer x' } })), null);
});

test('profile maps the OIDC claims onto the fields the UI reads', () => {
  assert.deepEqual(oidc.profileFromClaims({ sub: 'u1', email: 'a@b.test', given_name: 'Ana', family_name: 'Paz', picture: 'https://p', pollar_role: 'ADMIN' }),
    { id: 'u1', mail: 'a@b.test', first_name: 'Ana', last_name: 'Paz', avatar: 'https://p', role: 'ADMIN' });
  assert.deepEqual(oidc.profileFromClaims({ sub: 'u2' }), { id: 'u2', mail: '', first_name: '', last_name: '', avatar: '', role: undefined });
});

// A fake issuer: discovery, JWKS and a token endpoint that records its calls.
const { privateKey, publicKey } = await generateKeyPair('ES256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256', use: 'sig' };
const idToken = (claims) => new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'k1' })
  .setIssuer(ISSUER).setAudience('studio').setIssuedAt().setExpirationTime('5m').sign(privateKey);

function issuer(t, token) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith('/.well-known/openid-configuration')) return Response.json({
      issuer: ISSUER, authorization_endpoint: `${ISSUER}/auth`, token_endpoint: `${ISSUER}/token`, jwks_uri: `${ISSUER}/jwks`,
      end_session_endpoint: `${ISSUER}/session/end`, revocation_endpoint: `${ISSUER}/token/revocation`,
    });
    if (url.endsWith('/jwks')) return Response.json({ keys: [jwk] });
    calls.push({ url, headers: init.headers, body: init.body ? new URLSearchParams(init.body.toString()) : null });
    return token(calls.at(-1));
  });
  return calls;
}

test('authorization URL carries the contract parameters', async (t) => {
  issuer(t, () => Response.json({}));
  const url = await oidc.authorizationUrl({ state: 'st', nonce: 'nn', codeChallenge: 'cc' });
  assert.equal(url.origin + url.pathname, `${ISSUER}/auth`);
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    client_id: 'studio', response_type: 'code', redirect_uri: 'https://studio.test/auth/callback',
    scope: 'openid email profile offline_access', resource: 'https://hub-api.test',
    state: 'st', nonce: 'nn', code_challenge: 'cc', code_challenge_method: 'S256',
  });
});

test('code exchange uses client_secret_basic and PKCE, and verifies the ID token nonce', async (t) => {
  const token = await idToken({ sub: 'u1', nonce: 'n1', email: 'a@b.test', given_name: 'Ana', pollar_role: 'USER' });
  const calls = issuer(t, () => Response.json({ access_token: 'at', refresh_token: 'rt', id_token: token, expires_in: 600 }));
  const session = await oidc.exchangeCode('code-1', 'verifier-1', 'n1');
  const [call] = calls;
  assert.equal(call.headers.Authorization, `Basic ${Buffer.from('studio:s3cret%3A%2B%2F').toString('base64')}`);
  assert.deepEqual(Object.fromEntries(call.body), { grant_type: 'authorization_code', code: 'code-1', redirect_uri: 'https://studio.test/auth/callback', code_verifier: 'verifier-1', resource: 'https://hub-api.test' });
  assert.equal(session.accessToken, 'at');
  assert.equal(session.refreshToken, 'rt');
  assert.equal(session.profile.mail, 'a@b.test');
  assert.ok(session.expiresAt > Date.now() + 590_000);
  await assert.rejects(oidc.exchangeCode('code-1', 'verifier-1', 'other-nonce'), /nonce_mismatch/);
});

test('an ID token for another audience or issuer is refused', async (t) => {
  const foreign = await new SignJWT({ sub: 'u1', nonce: 'n1' }).setProtectedHeader({ alg: 'ES256', kid: 'k1' })
    .setIssuer(ISSUER).setAudience('dashboard').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  issuer(t, () => Response.json({ access_token: 'at', id_token: foreign, expires_in: 600 }));
  await assert.rejects(oidc.exchangeCode('c', 'v', 'n1'), /aud/);
});

test('parallel refreshes with one refresh token reach the issuer once', async (t) => {
  const calls = issuer(t, async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return Response.json({ access_token: 'at-2', refresh_token: 'rt-2', expires_in: 600 });
  });
  const session = { accessToken: 'at-1', refreshToken: 'rt-shared', idToken: 'id', expiresAt: Date.now(), profile: { id: 'u1' } };
  const results = await Promise.all([cookies.refreshSession(session), cookies.refreshSession(session), cookies.refreshSession(session)]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.get('refresh_token'), 'rt-shared');
  for (const result of results) {
    assert.equal(result.session.accessToken, 'at-2');
    assert.equal(result.session.refreshToken, 'rt-2');
  }
  assert.equal((await cookies.refreshSession(session)).session.accessToken, 'at-2', 'a late request with the old cookie reuses the result');
  assert.equal(calls.length, 1);
});

test('a refused refresh ends the session; a network failure does not', async (t) => {
  issuer(t, () => Response.json({ error: 'invalid_grant' }, { status: 400 }));
  const session = { accessToken: 'a', refreshToken: 'rt-revoked', idToken: 'id', expiresAt: 0, profile: { id: 'u1' } };
  assert.deepEqual(await cookies.refreshSession(session), { expired: true });
  t.mock.restoreAll();
  issuer(t, () => Response.json({ error: 'server_error' }, { status: 503 }));
  await assert.rejects(cookies.refreshSession({ ...session, refreshToken: 'rt-flaky' }), /server_error/);
});

test('logout URL ends the central session with the ID token hint', async (t) => {
  issuer(t, () => Response.json({}));
  const url = await oidc.endSessionUrl('id-token-1');
  assert.equal(url.origin + url.pathname, `${ISSUER}/session/end`);
  assert.deepEqual(Object.fromEntries(url.searchParams), { client_id: 'studio', post_logout_redirect_uri: 'https://studio.test/', id_token_hint: 'id-token-1' });
});
