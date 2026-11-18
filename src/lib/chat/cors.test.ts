import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAT_CORS_ORIGINS, corsPreflight, withCors } from "./cors.ts";

const req = (origin?: string, method = "POST") =>
  new Request("https://amienigma-llm.vercel.app/api/chat", {
    method,
    headers: origin ? { Origin: origin } : {},
  });

test("allows exactly the NOCTURNE origin", () => {
  assert.deepEqual(CHAT_CORS_ORIGINS, ["https://amienigma.github.io"]);
  const ok = withCors(req("https://amienigma.github.io"), new Response("hi"));
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), "https://amienigma.github.io");
  assert.equal(ok.headers.get("Vary"), "Origin");
  for (const origin of [
    undefined,
    "https://evil.example",
    "https://amienigma.github.io.evil.example",
    "http://amienigma.github.io",
    "https://AMIENIGMA.github.io",
    "null",
  ]) {
    const res = withCors(req(origin), new Response("hi"));
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), null, String(origin));
    assert.equal(res.headers.get("Vary"), "Origin");
    assert.equal(res.headers.get("Access-Control-Allow-Credentials"), null);
  }
});

test("keeps status, body, existing headers and streams; merges Vary", async () => {
  const err = withCors(
    req("https://amienigma.github.io"),
    Response.json({ error: "Invalid request." }, { status: 400, headers: { Vary: "Accept" } }),
  );
  assert.equal(err.status, 400);
  assert.equal(err.headers.get("Content-Type"), "application/json");
  assert.equal(err.headers.get("Vary"), "Accept, Origin");
  assert.deepEqual(await err.json(), { error: "Invalid request." });
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode("a"));
      c.enqueue(new TextEncoder().encode("b"));
      c.close();
    },
  });
  const res = withCors(
    req("https://amienigma.github.io"),
    new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } }),
  );
  assert.equal(await res.text(), "ab");
  assert.equal(res.headers.get("Content-Type"), "text/plain; charset=utf-8");
  // Immutable upstream headers (e.g. a fetch() response) are fine too.
  const frozen = await fetch("data:text/plain,x");
  assert.equal(withCors(req("https://amienigma.github.io"), frozen).headers.get("Vary"), "Origin");
});

test("preflight: 204 with methods and headers for the allowed origin only", () => {
  const ok = corsPreflight(req("https://amienigma.github.io", "OPTIONS"));
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get("Access-Control-Allow-Origin"), "https://amienigma.github.io");
  assert.equal(ok.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
  assert.equal(ok.headers.get("Access-Control-Allow-Headers"), "Content-Type");
  assert.equal(ok.headers.get("Vary"), "Origin");
  const no = corsPreflight(req("https://evil.example", "OPTIONS"));
  assert.equal(no.status, 204);
  assert.equal(no.headers.get("Access-Control-Allow-Origin"), null);
  assert.equal(no.headers.get("Access-Control-Allow-Methods"), null);
});
