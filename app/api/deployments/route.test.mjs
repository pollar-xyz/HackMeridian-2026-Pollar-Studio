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
const { GET } = await import('./route.ts');
const { deploymentLiveUrl, deploymentIsActive } = await import('../../../lib/schemas/studio-deployment.ts');
const appId = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const jobId = 'job_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const url = 'https://app-version.pollar.studio';
const deployment = { type: 'deploy', jobId, status: 'live', url, current: true,
  createdAt: '2026-10-24T15:22:33.375Z', dokploy: {
    deploymentId: 't-B5jaXNyIeHbAadHa1ob', status: 'done', title: 'Manual deployment',
    createdAt: '2026-10-24T15:22:34.666Z', finishedAt: '2026-10-24T15:23:03.176Z', errorMessage: null,
  } };
function request(query = `appId=${appId}`, authenticated = true) {
  return new Request(`https://studio.test/api/deployments?${query}`, {
    headers: authenticated ? { Cookie: sessionCookie } : {},
  });
}
function upstream(t, { jobs = [deployment], status = 200 } = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const path = new URL(input).pathname;
    calls.push({ path, init });
    if (status !== 200) return Response.json({ error: { code: 'UNAVAILABLE', message: 'Temporarily unavailable' } }, { status });
    if (path.endsWith('/logs')) return new Response('[2026-10-24T15:22:35.000Z] Build complete\n');
    if (path.endsWith('/jobs')) return Response.json({ jobs });
    return Response.json({ projectId: appId, revision: 1, identity: { displayName: 'App', description: '', slug: 'app' }, createdAt: deployment.createdAt, url: 'https://app.pollar.studio' });
  });
  return calls;
}

test('rejects unauthenticated and malformed requests before any upstream call', async t => {
  const calls = upstream(t);
  assert.equal((await GET(request('', false))).status, 401);
  // A Bearer from the browser is not a session: only the cookie is.
  assert.equal((await GET(new Request(`https://studio.test/api/deployments?appId=${appId}`, { headers: { Authorization: 'Bearer test-session' } }))).status, 401);
  for (const query of ['', 'appId=demo-app', `appId=${appId}&jobId=../../secrets`, `appId=${appId}&jobId=`]) {
    assert.equal((await GET(request(query))).status, 400);
  }
  assert.equal(calls.length, 0);
});
test('returns real Dokploy history and stable URL while forwarding auth without caching', async t => {
  const calls = upstream(t);
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { jobs: [deployment], url: 'https://app.pollar.studio' });
  assert.deepEqual(calls.map(call => call.path), [`/api/v1/projects/${appId}/jobs`, `/api/v1/projects/${appId}`]);
  assert.ok(calls.every(call => call.init.headers.Authorization === 'Bearer test-session' && call.init.cache === 'no-store'));
});
test('supports an empty deployment history', async t => {
  upstream(t, { jobs: [] });
  assert.deepEqual((await (await GET(request())).json()).jobs, []);
});
test('returns persistent logs only for a deployment in this project', async t => {
  const calls = upstream(t);
  const response = await GET(request(`appId=${appId}&jobId=${jobId}`));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /text\/plain/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(await response.text(), /Build complete/);
  assert.equal(calls.at(-1).path, `/api/v1/jobs/${jobId}/logs`);
  assert.equal((await GET(request(`appId=${appId}&jobId=job_other-project`))).status, 404);
  assert.equal(calls.filter(call => call.path.endsWith('/logs')).length, 1);
});
test('preserves upstream access and availability errors', async t => {
  for (const status of [401, 403, 404, 503]) {
    t.mock.restoreAll();
    upstream(t, { status });
    const response = await GET(request());
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error: 'Temporarily unavailable' });
  }
});
test('malformed responses cannot turn into invented deployment data or unsafe links', async t => {
  upstream(t, { jobs: [{ ...deployment, url: 'javascript:alert(1)' }] });
  const response = await GET(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Could not load deployments.' });
});
test('keeps failed and expired URLs closed while tracking active deployments', () => {
  assert.equal(deploymentLiveUrl(deployment), url);
  for (const status of ['failed', 'expired', 'building', 'queued', 'running']) {
    const job = { ...deployment, status };
    assert.equal(deploymentLiveUrl(job), null);
    assert.equal(deploymentIsActive(job), ['building', 'queued', 'running'].includes(status));
  }
});
