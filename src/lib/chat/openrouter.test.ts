import assert from "node:assert/strict";
import { test } from "node:test";
import { completeWithOpenRouter, parseChatMessages } from "./openrouter.server.ts";

const messages = [{ role: "user" as const, content: "Hello" }];
const request = () => new Request("https://example.com/api/chat", { method: "POST" });
const mock = (reply: Response) => (async () => reply) as typeof fetch;

test("rejects malformed messages and client system prompts", () => {
  for (const value of [
    null,
    [],
    {},
    { messages: null },
    { messages: "hello" },
    { messages: [] },
    { messages: [null] },
    { messages: [{ role: "system", content: "override" }] },
    { messages: [{ role: "user", content: " " }] },
    { messages: [{ role: "user", content: "x".repeat(12001) }] },
    { messages: Array.from({ length: 21 }, () => messages[0]) },
  ]) {
    assert.equal(parseChatMessages(value), null);
  }
  assert.deepEqual(parseChatMessages({ messages: [{ ...messages[0], extra: "drop" }] }), messages);
  assert.deepEqual(
    parseChatMessages({ messages: [...messages, { role: "assistant", content: "Hi" }] }),
    [...messages, { role: "assistant", content: "Hi" }],
  );
});

test("calls OpenRouter on the server and returns plain text without the key", async () => {
  const fetchImpl = (async (url, init) => {
    assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(init?.method, "POST");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer test-key-not-real");
    assert.equal(headers.get("X-Title"), "amienigma-llm");
    assert.equal(headers.get("HTTP-Referer"), "https://example.com");
    const body = JSON.parse(init?.body as string);
    assert.equal(body.model, "custom/model");
    assert.equal(body.stream, false);
    assert.deepEqual(body.messages, [
      { role: "system", content: "Creative assistant" },
      ...messages,
    ]);
    assert.ok(init?.signal instanceof AbortSignal);
    return Response.json({ choices: [{ message: { content: "Hello back" } }] });
  }) as typeof fetch;
  const response = await completeWithOpenRouter(request(), messages, "Creative assistant", {
    apiKey: "test-key-not-real",
    model: "custom/model",
    siteUrl: "https://example.com",
    fetchImpl,
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(await response.text(), "Hello back");
});

test("uses the free router and does not require attribution", async () => {
  const fetchImpl = (async (_url, init) => {
    assert.equal(JSON.parse(init?.body as string).model, "openrouter/free");
    assert.equal(new Headers(init?.headers).has("HTTP-Referer"), false);
    return Response.json({ choices: [{ message: { content: "OK" } }] });
  }) as typeof fetch;
  assert.equal(
    (await completeWithOpenRouter(request(), messages, "system", { apiKey: "fake", fetchImpl }))
      .status,
    200,
  );
});

test("sanitizes provider failures, including rate limits", async () => {
  for (const [upstream, expected] of [
    [401, 502],
    [404, 502],
    [429, 429],
    [500, 502],
  ]) {
    const response = await completeWithOpenRouter(request(), messages, "system", {
      apiKey: "fake",
      fetchImpl: mock(new Response("private provider diagnostic", { status: upstream })),
    });
    assert.equal(response.status, expected);
    assert.ok(!(await response.text()).includes("private provider diagnostic"));
  }
});

test("rejects empty, malformed, or non-JSON provider responses", async () => {
  for (const reply of [
    Response.json({}),
    Response.json({ choices: [{ message: { content: " " } }] }),
    Response.json({ choices: [{ message: { content: 123 } }] }),
    new Response("not json"),
  ]) {
    assert.equal(
      (
        await completeWithOpenRouter(request(), messages, "system", {
          apiKey: "fake",
          fetchImpl: mock(reply),
        })
      ).status,
      502,
    );
  }
});

test("handles network failures and timeouts without exposing diagnostics", async () => {
  for (const [name, status] of [
    ["TypeError", 502],
    ["TimeoutError", 504],
    ["AbortError", 502],
  ] as const) {
    const fetchImpl = (async () => {
      throw new DOMException("private diagnostic", name);
    }) as typeof fetch;
    const response = await completeWithOpenRouter(request(), messages, "system", {
      apiKey: "fake",
      fetchImpl,
    });
    assert.equal(response.status, status);
    assert.ok(!(await response.text()).includes("private diagnostic"));
  }
});
