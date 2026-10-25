import { test } from "node:test";
import assert from "node:assert/strict";
import { streamChat } from "./chat-stream.ts";

const body = { messages: [{ role: "user", content: "Hola" }] };

test('delivers the deployed URL from fragmented SSE before completion', async (t) => {
  const appId = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
  const url = 'https://luna.pollar.studio';
  t.mock.method(globalThis, 'fetch', async () => mockResponse(`event: preview\ndata: ${JSON.stringify({ appId, url })}\n\nevent: done\ndata: {"messageId":"1"}\n\n`));
  const events = [];
  await streamChat(body, new AbortController().signal, () => {}, undefined, undefined, undefined, undefined, {
    onPreview(id, origin) { events.push([id, origin]); },
    onDone() { events.push('done'); },
  });
  assert.deepEqual(events, [[appId, url], 'done']);
});
function mockResponse(text, status = 200) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({
    start(controller) {
      // Split every UTF-8 character and frame across network chunks.
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  }), { status, headers: { "Content-Type": "text/event-stream" } });
}

test("assembles split SSE frames and UTF-8, preserving request history", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), body);
    return mockResponse('event: delta\r\ndata: {"messageId":"1","text":"¡Hola 🌎!"}\r\n\r\nevent: done\ndata: {"messageId":"1"}\n\n');
  });
  let text = "";
  await streamChat(body, new AbortController().signal, (delta) => { text += delta; });
  assert.equal(text, "¡Hola 🌎!");
});

test("surfaces SSE errors and does not report success", async (t) => {
  t.mock.method(globalThis, "fetch", async () => mockResponse('event: error\ndata: {"messageId":"1","message":"Unavailable"}\n\n'));
  await assert.rejects(streamChat(body, new AbortController().signal, () => {}), /Unavailable/);
});

test("rejects a disconnected stream without done", async (t) => {
  t.mock.method(globalThis, "fetch", async () => mockResponse('event: delta\ndata: {"messageId":"1","text":"Partial"}\n\n'));
  await assert.rejects(streamChat(body, new AbortController().signal, () => {}), /interrupted/);
});

test("surfaces HTTP errors before streaming", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Not configured" }, { status: 503 }));
  await assert.rejects(streamChat(body, new AbortController().signal, () => {}), /Not configured/);
});

test("passes cancellation to fetch", async (t) => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    options.signal.throwIfAborted();
  });
  await assert.rejects(streamChat(body, controller.signal, () => {}), { name: "AbortError" });
});

test("receives the server app ID before text even with fragmented frames", async (t) => {
  const appId = "87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1";
  t.mock.method(globalThis, "fetch", async () => mockResponse(`event: app\ndata: {"appId":"${appId}"}\n\nevent: delta\ndata: {"messageId":"1","text":"Hola"}\n\nevent: done\ndata: {"messageId":"1"}\n\n`));
  const events = [];
  await streamChat(body, new AbortController().signal, (text) => events.push(text), (id) => events.push(id));
  assert.deepEqual(events, [appId, "Hola"]);
});

test("includes the app ID when continuing an existing conversation", async (t) => {
  const appId = "87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1";
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(JSON.parse(options.body).appId, appId);
    return mockResponse(`event: app\ndata: {"appId":"${appId}"}\n\nevent: done\ndata: {"messageId":"1"}\n\n`);
  });
  await streamChat({ ...body, appId }, new AbortController().signal, () => {});
});

test("forwards the caller's bearer and receives project renames and polling progress", async (t) => {
  const appId = 'prj_87a8b810-2d01-4fd8-9f17-3f7a9bfb1df1';
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-user-token');
    return mockResponse(`event: app\ndata: {"appId":"${appId}","name":"Nueva app"}\n\nevent: progress\ndata: {"status":"running"}\n\nevent: app\ndata: {"appId":"${appId}","name":"Luna"}\n\nevent: done\ndata: {"messageId":"1"}\n\n`);
  });
  const names = [];
  const progress = [];
  await streamChat(body, new AbortController().signal, () => {}, (_id, name) => names.push(name), (status) => progress.push(status), 'test-user-token');
  assert.deepEqual(names, ['Nueva app', 'Luna']);
  assert.deepEqual(progress, ['running']);
});

test('delivers job identity, partial terminal log chunks, resets and completion', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => mockResponse('event: job\ndata: {"jobId":"job_1"}\n\nevent: log\ndata: {"text":"Preparing\\nSending ","reset":false}\n\nevent: log\ndata: {"text":"6 files\\n","reset":false}\n\nevent: log\ndata: {"text":"Restarted\\n","reset":true}\n\nevent: done\ndata: {"messageId":"1"}\n\n'));
  let jobId;
  let logs = '';
  let completed = false;
  await streamChat(body, new AbortController().signal, () => {}, undefined, undefined, undefined, undefined, {
    onJob(id) { jobId = id; },
    onLog(text, reset) { logs = reset ? text : logs + text; },
    onDone() { completed = true; },
  });
  assert.equal(jobId, 'job_1');
  assert.equal(logs, 'Restarted\n');
  assert.equal(completed, true);
});
