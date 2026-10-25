import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJobStream } from './job-stream.ts';
function response(text) {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
    controller.close();
  } }), { headers: { 'Content-Type': 'text/event-stream' } });
}
test('parses fragmented upstream UTF-8 logs, phases and completion', async () => {
  const frames = [];
  await readJobStream(response(': heartbeat\n\nevent: log\ndata: {"line":"Construyendo café ☕"}\n\nevent: phase\ndata: {"status":"running","urlStatus":"building","url":null}\n\nevent: done\ndata: {"status":"succeeded","urlStatus":"live","url":"https://cafe.pollar.studio","summary":"Lista"}\n\n'), e => frames.push(e));
  assert.equal(frames[0].data.line, 'Construyendo café ☕');
  assert.equal(frames[1].data.urlStatus, 'building');
  assert.equal(frames[2].data.url, 'https://cafe.pollar.studio');
});
test('rejects disconnected streams and unsafe deployment URLs', async () => {
  await assert.rejects(readJobStream(response('event: log\ndata: {"line":"Partial"}\n\n'), () => {}), /interrumpió/);
  await assert.rejects(readJobStream(response('event: done\ndata: {"status":"succeeded","url":"javascript:alert(1)"}\n\n'), () => {}));
});
test('cancels the reader after completion and ignores subsequent events', async () => {
  const frames = [];
  await readJobStream(response('event: done\ndata: {"status":"failed","error":"Build failed"}\n\nevent: log\ndata: {"line":"Ignored"}\n\n'), e => frames.push(e));
  assert.equal(frames.length, 1);
  assert.equal(frames[0].data.error, 'Build failed');
});
