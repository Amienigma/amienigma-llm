/** Server-only OpenRouter transport. Never import this module into UI code. */
export type ChatInput = { role: "user" | "assistant"; content: string };

export function parseChatMessages(body: unknown): ChatInput[] | null {
  if (!body || typeof body !== "object" || !("messages" in body)) return null;
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20) return null;
  if (
    !messages.every((m: unknown) => {
      if (!m || typeof m !== "object" || !("role" in m) || !("content" in m)) return false;
      return (
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= 12_000
      );
    })
  )
    return null;
  // Copy only the allowed fields; clients cannot override the system prompt.
  return messages.map((m: ChatInput) => ({ role: m.role, content: m.content }));
}

export const DEFAULT_MODEL = "openrouter/free";
/**
 * Tried, in order, only when a model answers with an empty reply (free routers
 * sometimes pick a reasoning model that spends its whole budget thinking).
 * Uses the same OpenRouter key; no extra secrets. Override with
 * OPENROUTER_FALLBACK_MODELS (comma-separated), or "none" to disable.
 */
export const DEFAULT_FALLBACK_MODELS: readonly string[] = ["google/gemma-4-31b-it:free"];
export const MAX_MODEL_ATTEMPTS = 3;
const MODEL_ID = /^[a-z0-9~][a-z0-9._~:/-]{0,127}$/i;

export function parseFallbackModels(value: string | undefined): string[] {
  const raw = value?.trim();
  if (!raw) return [...DEFAULT_FALLBACK_MODELS];
  if (raw.toLowerCase() === "none") return [];
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter((m) => MODEL_ID.test(m))
    .slice(0, MAX_MODEL_ATTEMPTS - 1);
}

type Options = {
  apiKey: string;
  model?: string;
  /** Models to retry with after an empty reply. Defaults to none (callers opt in). */
  fallbackModels?: readonly string[];
  siteUrl?: string;
  fetchImpl?: typeof fetch;
};

class EmptyReply extends Error {}

export async function completeWithOpenRouter(
  request: Request,
  messages: ChatInput[],
  system: string,
  options: Options,
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "amienigma-llm",
  };
  // Attribution is optional. Use a server-configured URL, not an untrusted Origin header.
  if (options.siteUrl) headers["HTTP-Referer"] = options.siteUrl;
  const primary = options.model || DEFAULT_MODEL;
  const models = [primary, ...(options.fallbackModels ?? []).filter((m) => m !== primary)];
  // One deadline for all attempts, so retries never stretch the request past 60 s.
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]);
  try {
    for (const model of models.slice(0, MAX_MODEL_ATTEMPTS)) {
      const response = await (options.fetchImpl ?? fetch)(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: system }, ...messages],
            stream: false,
            max_tokens: 1800,
          }),
          signal,
        },
      );
      if (!response.ok) {
        return Response.json(
          {
            error:
              response.status === 429
                ? "Amienigma is busy. Try again in a moment."
                : "Could not reach Amienigma. Check the server's OpenRouter configuration.",
          },
          { status: response.status === 429 ? 429 : 502 },
        );
      }
      let content: unknown;
      try {
        const data = await response.json();
        content = data?.choices?.[0]?.message?.content;
      } catch {
        content = undefined;
      }
      if (typeof content !== "string" || !content.trim()) continue; // try the next model
      // The existing browser reads plain text; no provider response or credential is forwarded.
      return new Response(content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    throw new EmptyReply();
  } catch (error) {
    if (error instanceof EmptyReply) {
      return Response.json(
        { error: "Amienigma returned an empty reply. Try again." },
        { status: 502 },
      );
    }
    const name = (error as { name?: string })?.name;
    return Response.json(
      {
        error:
          name === "TimeoutError"
            ? "Amienigma took too long to reply. Try again."
            : "Could not reach Amienigma. Try again in a moment.",
      },
      { status: name === "TimeoutError" ? 504 : 502 },
    );
  }
}
