/**
 * CORS for the public chat API. Only exact, listed origins get
 * Access-Control-Allow-Origin; everything else is same-origin only, as before.
 * Every response carries `Vary: Origin` so shared caches never mix them up.
 */
export const CHAT_CORS_ORIGINS: readonly string[] = [
  // NOCTURNE's "Describe a beat" (Amienigma/nocturne on GitHub Pages).
  "https://amienigma.github.io",
];

function allowedOrigin(request: Request, allowed: readonly string[]): string | null {
  const origin = request.headers.get("Origin");
  return origin && allowed.includes(origin) ? origin : null;
}

function appendVary(headers: Headers) {
  const vary = headers.get("Vary");
  if (!vary) headers.set("Vary", "Origin");
  else if (!vary.split(",").some((v) => v.trim().toLowerCase() === "origin")) {
    headers.set("Vary", `${vary}, Origin`);
  }
}

/** Return `response` with CORS headers for allowed origins (body and status untouched, streams included). */
export function withCors(
  request: Request,
  response: Response,
  allowed: readonly string[] = CHAT_CORS_ORIGINS,
): Response {
  // Copy headers so this works even if the response's headers are immutable.
  const headers = new Headers(response.headers);
  appendVary(headers);
  const origin = allowedOrigin(request, allowed);
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Answer a CORS preflight. Disallowed origins get a 204 without Allow-Origin, so the browser blocks them. */
export function corsPreflight(
  request: Request,
  allowed: readonly string[] = CHAT_CORS_ORIGINS,
): Response {
  const headers = new Headers({ "Cache-Control": "no-store" });
  appendVary(headers);
  const origin = allowedOrigin(request, allowed);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "600");
  }
  return new Response(null, { status: 204, headers });
}
