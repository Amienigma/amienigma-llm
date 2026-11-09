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

type Options = {
  apiKey: string;
  model?: string;
  siteUrl?: string;
  fetchImpl?: typeof fetch;
};

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
  try {
    const response = await (options.fetchImpl ?? fetch)(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: options.model || "openrouter/free",
          messages: [{ role: "system", content: system }, ...messages],
          stream: false,
          max_tokens: 1800,
        }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
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
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return Response.json(
        { error: "Amienigma returned an empty reply. Try again." },
        { status: 502 },
      );
    }
    // The existing browser reads plain text; no provider response or credential is forwarded.
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
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
