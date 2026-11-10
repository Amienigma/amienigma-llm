/** Server-only multi-provider LLM layer. Never import this module into UI code. */

export const PROVIDER_IDS = ["openrouter", "xai", "openai", "anthropic", "gemini"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ChatRole = "system" | "user" | "assistant";
export type UserAssistantMessage = { role: "user" | "assistant"; content: string };
export type ChatMessage = { role: "system"; content: string } | UserAssistantMessage;

export type ProviderPublic = {
  id: ProviderId;
  name: string;
  configured: boolean;
  defaultModel: string;
  models: string[];
  baseUrl: string;
  protocol: string;
};

type ProviderCatalog = {
  name: string;
  envKey: string;
  modelEnv: string;
  defaultModel: string;
  models: string[];
  baseUrl: string;
  protocol: string;
};

const CATALOG: Record<ProviderId, ProviderCatalog> = {
  openrouter: {
    name: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "openrouter/free",
    models: [
      "openrouter/free",
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-2.0-flash-001",
    ],
    baseUrl: "https://openrouter.ai/api/v1",
    protocol: "REST/JSON (OpenAI-compat)",
  },
  xai: {
    name: "xAI",
    envKey: "XAI_API_KEY",
    modelEnv: "XAI_MODEL",
    defaultModel: "grok-4.5",
    models: ["grok-4.5", "grok-2"],
    baseUrl: "https://api.x.ai/v1",
    protocol: "REST/JSON (OpenAI-compat)",
  },
  openai: {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o"],
    baseUrl: "https://api.openai.com/v1",
    protocol: "REST/JSON",
  },
  anthropic: {
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-3-5-sonnet-latest",
    models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest"],
    baseUrl: "https://api.anthropic.com/v1",
    protocol: "REST/JSON",
  },
  gemini: {
    name: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-1.5-pro"],
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    protocol: "REST/JSON",
  },
};

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && (PROVIDER_IDS as readonly string[]).includes(value);
}

export function isSafeModelId(model: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_./:%-]{0,79}$/.test(model);
}

function readKey(id: ProviderId): string | undefined {
  return process.env[CATALOG[id].envKey]?.trim() || undefined;
}

function readDefaultModel(id: ProviderId): string {
  const override = process.env[CATALOG[id].modelEnv]?.trim();
  if (override && isSafeModelId(override)) return override;
  return CATALOG[id].defaultModel;
}

export function listProviders(): ProviderPublic[] {
  return PROVIDER_IDS.map((id) => {
    const item = CATALOG[id];
    const defaultModel = readDefaultModel(id);
    const models = item.models.includes(defaultModel)
      ? item.models
      : [defaultModel, ...item.models];
    return {
      id,
      name: item.name,
      configured: Boolean(readKey(id)),
      defaultModel,
      models,
      baseUrl: item.baseUrl,
      protocol: item.protocol,
    };
  });
}

export function firstConfiguredProvider(): ProviderId | null {
  for (const id of PROVIDER_IDS) {
    if (readKey(id)) return id;
  }
  return null;
}

export function resolveProvider(requested?: string): ProviderId | null {
  if (requested) {
    if (!isProviderId(requested)) return null;
    return readKey(requested) ? requested : null;
  }
  return firstConfiguredProvider();
}

export function parseUserAssistantMessages(body: unknown): UserAssistantMessage[] | null {
  if (!body || typeof body !== "object" || !("messages" in body)) return null;
  const messages = (body as { messages: unknown }).messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20) return null;
  if (
    !messages.every((item: unknown) => {
      if (!item || typeof item !== "object" || !("role" in item) || !("content" in item)) {
        return false;
      }
      const row = item as { role: unknown; content: unknown };
      return (
        (row.role === "user" || row.role === "assistant") &&
        typeof row.content === "string" &&
        row.content.trim().length > 0 &&
        row.content.length <= 12_000
      );
    })
  ) {
    return null;
  }
  return messages.map((item: UserAssistantMessage) => ({
    role: item.role,
    content: item.content,
  }));
}

export type ConsoleRequest = {
  provider?: ProviderId;
  model?: string;
  messages: UserAssistantMessage[];
};

export function parseConsoleRequest(body: unknown): ConsoleRequest | null {
  const messages = parseUserAssistantMessages(body);
  if (!messages) return null;
  const record = body as { provider?: unknown; model?: unknown };
  let provider: ProviderId | undefined;
  if (record.provider !== undefined) {
    if (!isProviderId(record.provider)) return null;
    provider = record.provider;
  }
  let model: string | undefined;
  if (record.model !== undefined) {
    if (typeof record.model !== "string" || !isSafeModelId(record.model.trim())) return null;
    model = record.model.trim();
  }
  return { provider, model, messages };
}

export type CompleteRequest = {
  provider?: ProviderId;
  model?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

export type CompleteOk = { ok: true; text: string; provider: ProviderId; model: string };
export type CompleteErr = { ok: false; status: number; error: string };
export type CompleteResult = CompleteOk | CompleteErr;

function sanitizedFailure(status: number): CompleteErr {
  return {
    ok: false,
    status: status === 429 ? 429 : status === 408 ? 504 : 502,
    error:
      status === 429
        ? "Amienigma is busy. Try again in a moment."
        : status === 408
          ? "Amienigma took too long to reply. Try again."
          : "Could not reach the language model. Check the server provider configuration.",
  };
}

function splitSystem(messages: ChatMessage[]): { system: string; rest: UserAssistantMessage[] } {
  const systemParts: string[] = [];
  const rest: UserAssistantMessage[] = [];
  for (const message of messages) {
    if (message.role === "system") {
      if (message.content.trim()) systemParts.push(message.content);
      continue;
    }
    rest.push(message);
  }
  return { system: systemParts.join("\n\n"), rest };
}

async function completeOpenAICompat(
  url: string,
  headers: Record<string, string>,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  jsonMode: boolean,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
): Promise<CompleteResult> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      max_tokens: maxTokens,
      temperature,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal,
  });
  if (!response.ok) return sanitizedFailure(response.status);
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, status: 502, error: "The language model returned an empty reply. Try again." };
  }
  return { ok: true, text, provider: "openai", model };
}

export async function completeWithProvider(request: CompleteRequest): Promise<CompleteResult> {
  const provider = resolveProvider(request.provider);
  if (!provider) {
    return {
      ok: false,
      status: 503,
      error: request.provider
        ? "That provider is not configured on the server."
        : "No language model is configured on the server.",
    };
  }
  const apiKey = readKey(provider);
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "That provider is not configured on the server.",
    };
  }
  const model = request.model && isSafeModelId(request.model) ? request.model : readDefaultModel(provider);
  const maxTokens = Math.min(Math.max(request.maxTokens ?? 1800, 16), 4000);
  const temperature = request.temperature ?? 0.7;
  const fetchImpl = request.fetchImpl ?? fetch;
  const timeout = AbortSignal.timeout(60_000);
  const signal = request.signal ? AbortSignal.any([request.signal, timeout]) : timeout;

  try {
    if (provider === "anthropic") {
      const { system, rest } = splitSystem(request.messages);
      const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          ...(system ? { system } : {}),
          messages: rest.map((item) => ({ role: item.role, content: item.content })),
        }),
        signal,
      });
      if (!response.ok) return sanitizedFailure(response.status);
      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const text = data.content?.find((part) => part.type === "text")?.text;
      if (typeof text !== "string" || !text.trim()) {
        return {
          ok: false,
          status: 502,
          error: "The language model returned an empty reply. Try again.",
        };
      }
      return { ok: true, text, provider, model };
    }

    if (provider === "gemini") {
      const { system, rest } = splitSystem(request.messages);
      const contents = rest.map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
            ...(request.jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        }),
        signal,
      });
      if (!response.ok) return sanitizedFailure(response.status);
      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
      if (!text?.trim()) {
        return {
          ok: false,
          status: 502,
          error: "The language model returned an empty reply. Try again.",
        };
      }
      return { ok: true, text, provider, model };
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    const url = `${CATALOG[provider].baseUrl}/chat/completions`;
    if (provider === "openrouter") {
      headers["X-Title"] = "amienigma-llm";
      const siteUrl = process.env.OPENROUTER_SITE_URL?.trim();
      if (siteUrl) headers["HTTP-Referer"] = siteUrl;
    }
    const result = await completeOpenAICompat(
      url,
      headers,
      model,
      request.messages,
      maxTokens,
      temperature,
      Boolean(request.jsonMode),
      signal,
      fetchImpl,
    );
    if (result.ok) return { ...result, provider, model };
    return result;
  } catch (error) {
    const name = (error as { name?: string })?.name;
    return {
      ok: false,
      status: name === "TimeoutError" ? 504 : 502,
      error:
        name === "TimeoutError"
          ? "Amienigma took too long to reply. Try again."
          : "Could not reach the language model. Try again in a moment.",
    };
  }
}
