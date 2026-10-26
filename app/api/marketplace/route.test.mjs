import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Run the actual Next route and API client under Node's TypeScript loader.
const root = new URL('../../../', import.meta.url);
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true };
  if (specifier.startsWith('@/')) return nextResolve(new URL(`${specifier.slice(2)}.ts`, root).href, context);
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });
Object.assign(process.env, {
  OIDC_ISSUER: 'https://accounts.test/oidc', OIDC_CLIENT_ID: 'studio', OIDC_CLIENT_SECRET: 'test-secret',
  OIDC_HUB_RESOURCE: 'https://hub-api.test', STUDIO_SESSION_SECRET: 'test-session-secret-of-at-least-32-chars', STUDIO_PUBLIC_URL: 'https://studio.test',
});
const { sealSession } = await import('../../../lib/auth/session-cookie.ts');
const sessionCookie = `pollar_studio_session=${await sealSession({ accessToken: 'user-session', idToken: 'id', expiresAt: Date.now() + 600_000,
  profile: { id: 'user_1', mail: 'a@b.test', first_name: '', last_name: '', avatar: '' } })}`;
const { GET, PUT, DELETE } = await import('./route.ts');
const appId = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const listing = { title: 'Forma', tagline: 'Software built for real people', url: 'https://forma-live.pollar.studio', logo: { color: '#005db4', pattern: 'none' }, banner: { color: '#005db4', pattern: 'dots' } };
function request(method, body, authenticated = true) {
  return new Request('https://studio.test/api/marketplace', { method, headers: { 'Content-Type': 'application/json', 'If-Match': 'rev-1', ...(authenticated ? { Cookie: sessionCookie } : {}) }, body: JSON.stringify(body) });
}

test('publication proxy requires authentication and valid project/fields before contacting the backend', async () => {
  assert.equal((await PUT(request('PUT', { appId, listing }, false))).status, 401);
  assert.equal((await PUT(request('PUT', { appId: 'bad', listing }))).status, 400);
});

test('publication proxy forwards the user token and revision to the real publication endpoint', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(new URL(url).pathname, `/api/v1/projects/${appId}/publication`);
    assert.equal(init.method, 'PUT');
    assert.equal(init.headers.Authorization, 'Bearer user-session');
    assert.equal(init.headers['If-Match'], 'rev-1');
    return Response.json({ projectId: appId, revision: 2, createdAt: new Date().toISOString(), identity: { displayName: 'Forma', description: '', slug: 'forma' }, marketplace: { ...listing, published: true, makerName: 'Owner', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
  };
  try {
    const response = await PUT(request('PUT', { appId, listing }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).marketplace.published, true);
  } finally { globalThis.fetch = original; }
});

test('publication failures stay errors and do not fabricate a successful listing', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: { code: 'PUBLICATION_NOT_CONFIGURED', message: 'PUBLICATION_NOT_CONFIGURED' } }, { status: 503 });
  try {
    const response = await PUT(request('PUT', { appId, listing }));
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /Dokploy/);
  } finally { globalThis.fetch = original; }
});

test('public marketplace reads need no user token and unpublish calls the publication endpoint', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (new URL(url).pathname === '/api/v1/marketplace') return Response.json({ listings: [] });
    assert.equal(init.method, 'DELETE');
    assert.equal(new URL(url).pathname, `/api/v1/projects/${appId}/publication`);
    return Response.json({ projectId: appId, revision: 2, createdAt: new Date().toISOString(), identity: { displayName: 'Forma', description: '', slug: 'forma' } });
  };
  try {
    assert.deepEqual(await (await GET(new Request('https://studio.test/api/marketplace'))).json(), { listings: [] });
    assert.equal((await DELETE(request('DELETE', { appId }))).status, 200);
  } finally { globalThis.fetch = original; }
});
