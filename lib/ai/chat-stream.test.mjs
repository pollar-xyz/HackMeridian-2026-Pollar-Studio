import { test } from "node:test";
import assert from "node:assert/strict";
import { streamChat } from "./chat-stream.ts";

const body = { messages: [{ role: "user", content: "Hola" }] };
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
