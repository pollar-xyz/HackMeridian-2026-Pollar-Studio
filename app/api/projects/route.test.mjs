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
const sessionCookie = `pollar_studio_session=${await sealSession({ accessToken: 'test-session', idToken: 'id', expiresAt: Date.now() + 600_000,
  profile: { id: 'user_1', mail: 'a@b.test', first_name: '', last_name: '', avatar: '' } })}`;
const { DELETE } = await import('./route.ts');
const appId = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const project = { projectId: appId, revision: 3, identity: { displayName: 'Shop', description: '', slug: 'shop' }, createdAt: '2026-10-26T00:00:00.000Z' };

function request(body, authenticated = true) {
  return new Request('https://studio.test/api/projects', {
    method: 'DELETE', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: sessionCookie } : {}) },
  });
}
function upstream(t, deleteResponse = () => new Response(null, { status: 204 })) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    calls.push({ path: new URL(input).pathname, method: init?.method ?? 'GET', ifMatch: new Headers(init?.headers).get('if-match') });
    return init?.method === 'DELETE' ? deleteResponse() : Response.json(project);
  });
  return calls;
}

test('deletes the project at its current revision with the session token', async (t) => {
  const calls = upstream(t);
  const response = await DELETE(request({ appId }));
  assert.equal(response.status, 204);
  assert.deepEqual(calls, [
    { path: `/api/v1/projects/${appId}`, method: 'GET', ifMatch: null },
    { path: `/api/v1/projects/${appId}`, method: 'DELETE', ifMatch: 'rev-3' },
  ]);
});

test('rejects anonymous or malformed requests without calling the Studio API', async (t) => {
  const calls = upstream(t);
  assert.equal((await DELETE(request({ appId }, false))).status, 401);
  assert.equal((await DELETE(request({ appId: 'prj_nope' }))).status, 400);
  assert.deepEqual(calls, []);
});

test('explains a busy project and a cleanup that stopped halfway', async (t) => {
  upstream(t, () => Response.json({ error: { code: 'PROJECT_BUSY', message: 'PROJECT_BUSY' } }, { status: 409 }));
  const busy = await DELETE(request({ appId }));
  assert.equal(busy.status, 409);
  assert.match((await busy.json()).error, /being built, deployed or published/);
  t.mock.restoreAll();
  upstream(t, () => Response.json({ error: { code: 'PROJECT_CLEANUP_FAILED', message: 'PROJECT_CLEANUP_FAILED' } }, { status: 502 }));
  const failed = await DELETE(request({ appId }));
  assert.equal(failed.status, 502);
  assert.match((await failed.json()).error, /Nothing is lost/);
});
