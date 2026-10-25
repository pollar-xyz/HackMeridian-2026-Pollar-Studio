import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStudioGeneration } from './studio-generation.ts';

const id = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const jobId = 'job_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
const url = 'https://luna-v2.pollar.studio';
const messages = [{ role: 'user', content: 'Crea una tienda llamada Luna' }];
function fixture() {
  const calls = [], events = [];
  let reads = 0;
  const api = {
    async createProject(prompt) { calls.push(['create', prompt]); return { projectId: id, identity: { displayName: 'Studio project' } }; },
    async getProject() { reads++; return { projectId: id, identity: { displayName: reads ? 'Luna' : 'Studio project' } }; },
    async queueGeneration(appId, prompt) { calls.push(['queue', appId, prompt]); return { jobId }; },
    async getJob() { return { projectId: id, jobId, status: 'running' }; },
    async streamJob(_id, emit) {
      emit({ event: 'log', data: { line: 'Preparing workspace' } });
      emit({ event: 'phase', data: { status: 'running', urlStatus: 'building', url } });
      emit({ event: 'phase', data: { status: 'succeeded', urlStatus: 'live', url } });
      emit({ event: 'done', data: { status: 'succeeded', urlStatus: 'live', url, summary: 'Tu tienda está lista.' } });
    },
  };
  return { api, calls, events, options: { api, messages, signal: new AbortController().signal, emit: (event, data) => events.push({ event, data }) } };
}
test('creates an unnamed project, sends the original prompt and forwards native logs and live URL', async () => {
  const f = fixture(); await runStudioGeneration(f.options);
  assert.deepEqual(f.calls, [['create', messages[0].content], ['queue', id, messages[0].content]]);
  assert.equal(f.events[0].data.appId, id);
  assert.equal(f.events.find(e => e.event === 'log').data.text, 'Preparing workspace\n');
  assert.ok(f.events.filter(e => e.event === 'preview').every(e => e.data.url === url));
  assert.equal(f.events.filter(e => e.event === 'app').at(-1).data.name, 'Luna');
  assert.equal(f.events.find(e => e.event === 'delta').data.text, 'Tu tienda está lista.');
  assert.equal(f.events.at(-1).event, 'done');
});
test('continues a project using only the latest user request', async () => {
  const f = fixture(); await runStudioGeneration({ ...f.options, appId: id, messages: [...messages, { role: 'assistant', content: 'Done' }, { role: 'user', content: 'Pon el fondo azul' }] });
  assert.deepEqual(f.calls, [['queue', id, 'Pon el fondo azul']]);
});
test('resumes an existing job without queuing another generation', async () => {
  const f = fixture(); await runStudioGeneration({ ...f.options, appId: id, resumeJobId: jobId });
  assert.deepEqual(f.calls, []);
});
test('rejects a resumed job belonging to another project', async () => {
  const f = fixture(); f.api.getJob = async () => ({ jobId, projectId: 'other' });
  await assert.rejects(runStudioGeneration({ ...f.options, appId: id, resumeJobId: jobId }), /does not belong/);
});
test('does not render a building URL or mark a failed deployment successful', async () => {
  const f = fixture(); f.api.streamJob = async (_id, emit) => {
    emit({ event: 'phase', data: { status: 'running', urlStatus: 'building', url } });
    emit({ event: 'done', data: { status: 'failed', urlStatus: 'failed', error: 'Build failed' } });
  };
  await assert.rejects(runStudioGeneration(f.options), /Build failed/);
  assert.equal(f.events.some(e => ['preview','delta','done'].includes(e.event)), false);
});
test('a metadata read failure preserves successful generation', async () => {
  const f = fixture(); f.api.getProject = async () => { throw new Error('Unavailable'); };
  await runStudioGeneration(f.options);
  assert.equal(f.events.some(e => e.event === 'warning'), true);
  assert.equal(f.events.at(-1).event, 'done');
});
test('cancellation and truncated streams cannot report success', async () => {
  const f = fixture(); f.api.streamJob = async () => {};
  await assert.rejects(runStudioGeneration(f.options), /sin un resultado/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(runStudioGeneration({ ...f.options, signal: controller.signal }), { name: 'AbortError' });
});

test('forwards the selected tools to project creation and the initial chat request', async () => {
  const f = fixture();
  const tools = { blockchain: 'stellar', payments: ['USDC', 'USDT'], countries: ['BO', 'BR'] };
  const create = f.api.createProject;
  const queue = f.api.queueGeneration;
  f.api.createProject = async (prompt, selection) => { assert.deepEqual(selection, tools); return create(prompt); };
  f.api.queueGeneration = async (appId, prompt, selection) => { assert.deepEqual(selection, tools); return queue(appId, prompt); };
  await runStudioGeneration({ ...f.options, tools });
});

test('preserves intentionally empty payment and country selections', async () => {
  const f = fixture();
  const tools = { blockchain: 'stellar', payments: [], countries: [] };
  const queue = f.api.queueGeneration;
  f.api.queueGeneration = async (appId, prompt, selection) => { assert.deepEqual(selection, tools); return queue(appId, prompt); };
  await runStudioGeneration({ ...f.options, tools });
});
