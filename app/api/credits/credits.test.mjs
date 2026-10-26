import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Run the actual Next routes and API client under Node's TypeScript loader.
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
const { creditsFor, STARTING_CREDITS, NEW_APP_LIMIT } = await import('../../../lib/credits/pricing.ts');
const { creditsView, loadCredits } = await import('./credits.ts');
const { GET } = await import('./route.ts');
const { POST } = await import('../chat/route.ts');

const project = (n, byModel) => ({ projectId: `prj_00000000-0000-4000-8000-00000000000${n}`, title: `App ${n}`, usage: { byModel } });
const typicalBuild = { 'gpt-oss:120b': { inputTokens: 50_000, outputTokens: 10_000 } };

test('credits follow the tokens each model used, rounded up', () => {
  assert.equal(creditsFor(typicalBuild), 18);
  assert.equal(creditsFor({ 'gpt-oss:20b': { inputTokens: 1_000, outputTokens: 100 } }), 1);
  assert.equal(creditsFor({ 'some-model': { inputTokens: 0, outputTokens: 1_000, reasoningTokens: 1_000 } }), 2);
  assert.equal(creditsFor({}), 0);
});

test('the balance is the starting gift minus what every app spent, biggest first', () => {
  const view = creditsView({ projects: [project(1, typicalBuild), project(2, { 'gpt-oss:120b': { inputTokens: 500_000, outputTokens: 100_000 } })] }, { 'prj_00000000-0000-4000-8000-000000000001': 1 });
  assert.equal(view.starting, STARTING_CREDITS);
  assert.equal(view.spent, 18 + 180);
  assert.equal(view.available, STARTING_CREDITS - 198);
  assert.deepEqual(view.newApps, { used: 2, limit: NEW_APP_LIMIT });
  assert.equal(view.apps[0].name, 'App 2');
  assert.equal(view.builds, 1);
});

test('builds count only messages that produced a version', async () => {
  const view = await loadCredits({
    async getUsage() { return { projects: [project(1, typicalBuild)] }; },
    async getChat() { return { messages: [{ status: 'succeeded' }, { status: 'succeeded', answered: true }, { status: 'failed' }] }; },
  });
  assert.equal(view.builds, 1);
});

function studioApi(t, projects) {
  const paths = [];
  t.mock.method(globalThis, 'fetch', async (input) => {
    const path = new URL(input).pathname;
    paths.push(path);
    if (path === '/api/v1/usage') return Response.json({ total: {}, projects });
    if (path.endsWith('/chat')) return Response.json({ messages: [] });
    return Response.json({ error: { code: 'UNEXPECTED', message: path } }, { status: 500 });
  });
  return paths;
}
const chat = (body) => POST(new Request('https://studio.test/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: sessionCookie }, body: JSON.stringify(body) }));

test('GET /api/credits answers the signed-in account balance', async (t) => {
  studioApi(t, [project(1, typicalBuild)]);
  const response = await GET(new Request('https://studio.test/api/credits', { headers: { Cookie: sessionCookie } }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).available, STARTING_CREDITS - 18);
  assert.equal((await GET(new Request('https://studio.test/api/credits'))).status, 401);
});

test('a message needs credits left, and a new app a free slot', async (t) => {
  const broke = studioApi(t, [project(1, { 'gpt-oss:120b': { inputTokens: 3_000_000, outputTokens: 0 } })]);
  const noCredits = await chat({ appId: project(1).projectId, messages: [{ role: 'user', content: 'Add a button' }] });
  assert.equal(noCredits.status, 402);
  assert.match((await noCredits.json()).error, /used all your credits/);
  assert.deepEqual(broke, ['/api/v1/usage']);
  t.mock.restoreAll();
  studioApi(t, Array.from({ length: NEW_APP_LIMIT }, (_, n) => project(n, {})));
  const full = await chat({ messages: [{ role: 'user', content: 'A new app' }] });
  assert.equal(full.status, 403);
  assert.match((await full.json()).error, new RegExp(`includes ${NEW_APP_LIMIT} apps`));
});
