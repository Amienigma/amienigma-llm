import assert from "node:assert/strict";
import { test } from "node:test";
import {
  completeWithProvider,
  firstConfiguredProvider,
  isSafeModelId,
  listProviders,
  parseConsoleRequest,
  parseUserAssistantMessages,
  resolveProvider,
} from "./providers.server.ts";

const KEYS = [
  "OPENROUTER_API_KEY",
  "XAI_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
] as const;

function withEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>, run: () => void) {
  const previous = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  for (const key of KEYS) {
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
  try {
    run();
  } finally {
    for (const key of KEYS) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("lists providers without revealing secrets", () => {
  withEnv({ OPENROUTER_API_KEY: "secret-should-not-appear", OPENAI_API_KEY: undefined }, () => {
    const providers = listProviders();
    const serialized = JSON.stringify(providers);
    assert.equal(serialized.includes("secret-should-not-appear"), false);
    const openrouter = providers.find((item) => item.id === "openrouter");
    const openai = providers.find((item) => item.id === "openai");
    assert.equal(openrouter?.configured, true);
    assert.equal(openai?.configured, false);
    assert.equal(openrouter?.name, "OpenRouter");
    assert.ok(openrouter?.models.includes("openrouter/free"));
  });
});

test("resolves the first configured provider in catalog order", () => {
  withEnv({ OPENROUTER_API_KEY: undefined, XAI_API_KEY: "x", OPENAI_API_KEY: "o" }, () => {
    assert.equal(firstConfiguredProvider(), "xai");
    assert.equal(resolveProvider(), "xai");
    assert.equal(resolveProvider("openai"), "openai");
    assert.equal(resolveProvider("gemini"), null);
    assert.equal(resolveProvider("nope"), null);
  });
});

test("rejects malformed console payloads and unsafe model ids", () => {
  assert.equal(isSafeModelId("openrouter/free"), true);
  assert.equal(isSafeModelId("meta-llama/llama-3.1-8b-instruct:free"), true);
  assert.equal(isSafeModelId("../etc/passwd"), false);
  assert.equal(isSafeModelId("model with spaces"), false);
  assert.equal(parseUserAssistantMessages({ messages: [{ role: "system", content: "no" }] }), null);
  assert.equal(parseConsoleRequest({ messages: [{ role: "user", content: "Hi" }], provider: "nope" }), null);
  assert.equal(
    parseConsoleRequest({ messages: [{ role: "user", content: "Hi" }], model: "bad model" }),
    null,
  );
  assert.deepEqual(parseConsoleRequest({ messages: [{ role: "user", content: "Hi", extra: 1 }] }), {
    provider: undefined,
    model: undefined,
    messages: [{ role: "user", content: "Hi" }],
  });
});

test("completeWithProvider returns 503 when no key is configured", async () => {
  const previous = { ...process.env };
  for (const key of KEYS) delete process.env[key];
  try {
    const result = await completeWithProvider({
      messages: [{ role: "user", content: "hello" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 503);
      assert.match(result.error, /configured on the server/i);
    }
  } finally {
    for (const key of KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("completeWithProvider calls OpenRouter without forwarding the raw provider payload", async () => {
  const previous = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = "test-key-not-real";
  try {
    const fetchImpl = (async (url, init) => {
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("Authorization"), "Bearer test-key-not-real");
      assert.equal(headers.get("X-Title"), "amienigma-llm");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.stream, false);
      assert.equal(body.model, "openrouter/free");
      return Response.json({ choices: [{ message: { content: "console-ok" } }] });
    }) as typeof fetch;
    const result = await completeWithProvider({
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "hi" },
      ],
      fetchImpl,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.text, "console-ok");
      assert.equal(result.provider, "openrouter");
    }
  } finally {
    if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previous;
  }
});

test("sanitizes upstream provider failures", async () => {
  const previous = process.env.OPENAI_API_KEY;
  const others = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  for (const key of KEYS) delete process.env[key];
  process.env.OPENAI_API_KEY = "test-key-not-real";
  try {
    const fetchImpl = (async () => new Response("nope", { status: 401 })) as typeof fetch;
    const result = await completeWithProvider({
      provider: "openai",
      messages: [{ role: "user", content: "hi" }],
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 502);
      assert.equal(result.error.includes("401"), false);
      assert.equal(result.error.includes("test-key-not-real"), false);
    }
  } finally {
    for (const key of KEYS) {
      const value = others[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
