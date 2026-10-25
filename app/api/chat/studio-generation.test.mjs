import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStudioGeneration, generationPrompt } from './studio-generation.ts';

const id = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const jobId = 'job_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const messages = [{ role: 'user', content: 'Crea una tienda llamada Luna' }];
function fixture(states = ['queued', 'running', 'succeeded']) {
  let step = 0;
  let project = { projectId: id, revision: 2, identity: { displayName: 'Nueva app', description: '', slug: 'nueva-app' }, createdAt: '2026-10-23T00:00:00Z' };
  const calls = [];
  const events = [];
  const api = {
    async createProject(prompt) { calls.push(['create', prompt]); return project; },
    async getProject(projectId) { assert.equal(projectId, id); return project; },
    async renameProject(projectId, revision, name) {
      calls.push(['rename', projectId, revision, name]);
      project = { ...project, revision: revision + 1, identity: { ...project.identity, displayName: name } };
      return project;
    },
    async queueGeneration(projectId, prompt) { calls.push(['queue', projectId, prompt]); return { jobId }; },
    async getJob() { return { jobId, projectId: id, status: states[step], result: { summary: 'PROJECT_NAME: Luna\nTu tienda está lista.', error: 'Build failed', deployment: { phase: 'succeeded' } } }; },
    async getLogs() { return step ? 'Preparing\nGenerating\n' : 'Preparing\n'; },
  };
  return { api, calls, events, options: { api, messages, signal: new AbortController().signal, emit: (event, data) => events.push({ event, data }), wait: async () => { step++; } } };
}

test('creates project, polls without duplicate logs, renames using latest revision and completes', async () => {
  const f = fixture();
  await runStudioGeneration(f.options);
  assert.equal(f.events[0].event, 'app');
  assert.equal(f.events[0].data.appId, id);
  assert.deepEqual(f.events.filter(e => e.event === 'progress').map(e => e.data.status), ['queued', 'running', 'succeeded']);
  assert.equal(f.events.filter(e => e.event === 'log').map(e => e.data.text).join(''), 'Preparing\nGenerating\n');
  assert.deepEqual(f.calls.find(c => c[0] === 'rename'), ['rename', id, 2, 'Luna']);
  assert.equal(f.events.find(e => e.event === 'delta').data.text, 'Tu tienda está lista.');
  assert.equal(f.events.at(-1).event, 'done');
  assert.equal(f.events.filter(e => e.event === 'app').at(-1).data.name, 'Luna');
  assert.match(f.calls.find(c => c[0] === 'queue')[2], /PROJECT_NAME:/);
});

test('continues an existing project without creating another', async () => {
  const f = fixture(['succeeded']);
  await runStudioGeneration({ ...f.options, appId: id });
  assert.equal(f.calls.filter(c => c[0] === 'create').length, 0);
  assert.match(f.calls.find(c => c[0] === 'queue')[2], /Consérvalo salvo/);
});

test('failed job rejects and never emits done or assistant success', async () => {
  const f = fixture(['failed']);
  await assert.rejects(runStudioGeneration(f.options), /Build failed/);
  assert.equal(f.events.some(e => e.event === 'done' || e.event === 'delta'), false);
});

test('cancellation stops polling before the next request', async () => {
  const f = fixture(['running']);
  const controller = new AbortController();
  await assert.rejects(runStudioGeneration({ ...f.options, signal: controller.signal, wait: async () => controller.abort() }), { name: 'AbortError' });
  assert.equal(f.events.some(e => e.event === 'done'), false);
});

test('revision conflict reports a warning without invalidating successful generation', async () => {
  const f = fixture(['succeeded']);
  f.api.renameProject = async () => { throw new Error('REVISION_CONFLICT'); };
  await runStudioGeneration(f.options);
  assert.equal(f.events.some(e => e.event === 'warning'), true);
  assert.equal(f.events.at(-1).event, 'done');
});

test('prompt includes only the latest request as the task and previous messages as context', () => {
  const prompt = generationPrompt([...messages, { role: 'assistant', content: 'De acuerdo' }, { role: 'user', content: 'Pon el fondo azul' }], 'Luna', false);
  assert.ok(prompt.endsWith('Solicitud actual:\n\nPon el fondo azul'));
  assert.match(prompt, /Crea una tienda llamada Luna/);
  assert.match(prompt, /Consérvalo salvo/);
});

test('succeeded is terminal regardless of deployment.phase', async () => {
  const f = fixture(['succeeded']);
  const getJob = f.api.getJob;
  f.api.getJob = async () => ({ ...await getJob(), result: { summary: 'Done', deployment: { phase: 'queued' } } });
  await runStudioGeneration(f.options);
  assert.equal(f.events.at(-1).event, 'done');
});

test('sends the deployment origin before completion even when phase is deploying', async () => {
  const f = fixture(['succeeded']);
  const origin = 'https://luna.pollar.studio';
  f.api.getJob = async () => ({ jobId, projectId: id, status: 'succeeded', result: { summary: 'PROJECT_NAME: Luna\nDone', deployment: { phase: 'deploying', origin } } });
  await runStudioGeneration(f.options);
  assert.deepEqual(f.events.find(e => e.event === 'preview').data, { appId: id, jobId, url: origin });
  assert.equal(f.events.at(-1).event, 'done');
});
