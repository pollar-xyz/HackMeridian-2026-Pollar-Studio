import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
const { GET } = await import('./route.ts');
const { builtWithTools } = await import('../../../lib/schemas/studio-built-with.ts');
const appId = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const selection = { blockchain: 'stellar', gas: true, payments: ['USDC'], countries: ['BO'] };
const catalog = { tools: {
  blockchain: { type: 'select', label: 'Blockchain', options: [{ id: 'stellar', label: 'Stellar' }] },
  gas: { type: 'toggle', label: 'Sponsored' },
  payments: { type: 'multi-select', label: 'Payment tokens', fallback: 'XLM', options: [{ id: 'USDC', label: 'USDC' }] },
  countries: { type: 'multi-select', label: 'Supported countries', options: [{ id: 'BO', label: 'Bolivia' }] },
} };
const summary = { title: 'Ramp app', description: 'A fiat ramp app', features: ['Ramp demo'], pages: [{ path: '/', purpose: 'Ramp demo' }],
  toolsUsed: [{ tool: 'payments', values: ['USDC'] }, { tool: 'ramps', values: ['USDC'] }], lastChange: 'Added ramp demo',
  tools: [{ tool: 'blockchain', values: ['stellar'], status: 'used', evidence: ['app/page.tsx: usePollar'] },
    { tool: 'payments', values: ['USDC'], status: 'not_used' }], updatedAt: '2026-10-24T15:44:43.848Z' };
function request(id = appId, auth = true) {
  return new Request(`https://studio.test/api/built-with?appId=${id}`, { headers: auth ? { Authorization: 'Bearer test-session' } : {} });
}
function upstream(t, { summaryStatus = 200, projectStatus = 200, catalogStatus = 200, summaryBody = summary } = {}) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const path = new URL(input).pathname;
    calls.push({ path, init });
    const status = path.endsWith('/summary') ? summaryStatus : path.endsWith('/tools') ? catalogStatus : projectStatus;
    if (status !== 200) return Response.json({ error: { code: 'UPSTREAM_ERROR', message: 'Unavailable' } }, { status });
    if (path.endsWith('/summary')) return Response.json(summaryBody);
    if (path.endsWith('/tools')) return Response.json(catalog);
    return Response.json({ projectId: appId, revision: 1, identity: { displayName: 'Ramp app', description: '', slug: 'ramp-app' },
      tools: selection, createdAt: '2026-10-24T15:44:43.848Z' });
  });
  return calls;
}

test('rejects unauthenticated and invalid project requests before contacting upstream', async t => {
  const calls = upstream(t);
  assert.equal((await GET(request(appId, false))).status, 401);
  assert.equal((await GET(request('demo-app'))).status, 400);
  assert.equal(calls.length, 0);
});
test('reads real summary, project selection and catalog using the caller token without caching', async t => {
  const calls = upstream(t);
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { summary, selection, catalog });
  assert.equal(calls[0].path, `/api/v1/projects/${appId}`);
  assert.ok(calls.some(call => call.path === `/api/v1/projects/${appId}/summary`));
  assert.ok(calls.some(call => call.path === '/api/v1/tools'));
  assert.ok(calls.every(call => call.init.headers.Authorization === 'Bearer test-session' && call.init.cache === 'no-store'));
});
test('an owned project without a summary retains its configured tools', async t => {
  upstream(t, { summaryStatus: 404 });
  const response = await GET(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { summary: null, selection, catalog });
});
test('a missing or inaccessible project does not become an empty summary', async t => {
  for (const projectStatus of [401, 403, 404]) {
    t.mock.restoreAll();
    const calls = upstream(t, { projectStatus });
    const response = await GET(request());
    assert.equal(response.status, projectStatus);
    assert.equal(calls.length, 1);
  }
});
test('propagates summary and catalog failures instead of inventing integrations', async t => {
  for (const options of [{ summaryStatus: 503 }, { summaryStatus: 401 }, { catalogStatus: 503 }]) {
    t.mock.restoreAll();
    upstream(t, options);
    const response = await GET(request());
    assert.equal(response.status, options.summaryStatus ?? options.catalogStatus);
    assert.deepEqual(await response.json(), { error: 'Unavailable' });
  }
});
test('rejects a malformed summary without exposing schema details', async t => {
  upstream(t, { summaryBody: { title: 'Incomplete' } });
  const response = await GET(request());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Could not load app tools.' });
});
test('code usage wins over AI declarations and catalog labels resolve selected values', () => {
  const tools = builtWithTools({ summary, selection, catalog });
  assert.equal(tools.find(tool => tool.tool === 'payments').status, 'not_used');
  assert.equal(tools.filter(tool => tool.tool === 'payments').length, 1);
  assert.deepEqual(tools.find(tool => tool.tool === 'blockchain').evidence, ['app/page.tsx: usePollar']);
  assert.equal(tools.find(tool => tool.tool === 'ramps').status, 'reported');
  assert.equal(tools.find(tool => tool.tool === 'gas').status, 'configured');
  assert.deepEqual(tools.find(tool => tool.tool === 'countries').values, [{ id: 'BO', label: 'Bolivia' }]);
});
test('never treats catalog defaults as project integrations', () => {
  assert.deepEqual(builtWithTools({ summary: null, selection: {}, catalog }), []);
  const tools = builtWithTools({ summary: null, selection: { payments: [], countries: [], gas: false }, catalog });
  assert.deepEqual(tools.find(tool => tool.tool === 'payments').values, [{ id: 'XLM', label: 'XLM' }]);
  assert.deepEqual(tools.find(tool => tool.tool === 'countries').values, []);
  assert.deepEqual(tools.find(tool => tool.tool === 'gas').values, [{ id: 'Disabled', label: 'Disabled' }]);
  const noValues = builtWithTools({ summary: { ...summary, toolsUsed: [], tools: [{ tool: 'payments', status: 'not_used' }] }, selection: {}, catalog });
  assert.deepEqual(noValues[0].values, []);
});
test('preserves unfamiliar backend tools and does not upgrade unverified statuses', () => {
  const tools = builtWithTools({ summary: { ...summary, toolsUsed: [], tools: [{ tool: 'future_service', values: ['new-option'], status: 'declared_not_found' }] }, selection: {}, catalog });
  assert.equal(tools[0].status, 'declared_not_found');
  assert.equal(tools[0].label, 'future service');
  assert.deepEqual(tools[0].values, [{ id: 'new-option', label: 'new-option' }]);
});
