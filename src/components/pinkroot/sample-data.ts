export const SAMPLE_PLUGINS = [
  {
    id: "plug_1",
    name: "Discord Webhook Notifier",
    version: "v2.1.0",
    category: "Alerts",
    enabled: true,
    perms: ["Read Vault Status", "Outbound Webhooks"],
    desc: "Dispatches notifications for API errors or spend threshold alerts.",
  },
  {
    id: "plug_2",
    name: "Prometheus Telemetry Sync",
    version: "v1.4.2",
    category: "Metrics",
    enabled: true,
    perms: ["Read Metrics", "Expose HTTP Port"],
    desc: "Exposes a scrapable /metrics endpoint in OpenTelemetry format.",
  },
  {
    id: "plug_3",
    name: "JWT Auth Security Gateway",
    version: "v3.0.1",
    category: "Security",
    enabled: true,
    perms: ["Interception", "Key Management"],
    desc: "Enforces bearer token validation for proxied requests.",
  },
  {
    id: "plug_4",
    name: "Pinecone Vector Bridge",
    version: "v0.9.5",
    category: "Storage",
    enabled: false,
    perms: ["Outbound Webhooks"],
    desc: "Syncs request embeddings with vector database collections.",
  },
];

export const SAMPLE_AUDIT_LOGS = [
  {
    id: "log_101",
    timestamp: "Sample · 14:22:01",
    user: "studio",
    event: "KEY_STATUS",
    details: "Provider configuration read for the request console (values not exposed).",
    ip: "local",
    severity: "info",
  },
  {
    id: "log_102",
    timestamp: "Sample · 14:20:15",
    user: "system",
    event: "FALLBACK_TRIGGERED",
    details: "Example fallback narrative: primary timeout, then next configured provider.",
    ip: "local",
    severity: "warning",
  },
  {
    id: "log_103",
    timestamp: "Sample · 13:58:11",
    user: "studio",
    event: "CONSOLE_HINT",
    details: "Live console requests go through /api/console on this app's server.",
    ip: "local",
    severity: "info",
  },
];

export const SAMPLE_ORCH_RULES = [
  {
    id: 1,
    name: "Primary LLM fallback chain",
    trigger: "Configured provider fails or times out",
    action: "OpenRouter → xAI → OpenAI → Anthropic → Gemini (first key that exists)",
    status: "Documented",
  },
  {
    id: 2,
    name: "Server-only credentials",
    trigger: "Any language-model call",
    action: "Use environment variables. Never send keys to the browser.",
    status: "Active",
  },
  {
    id: 3,
    name: "Sensitive data redaction",
    trigger: "Provider or console errors",
    action: "Return a sanitized message instead of upstream payloads.",
    status: "Active",
  },
];

export const ENV_HINTS: Record<string, string> = {
  openrouter: "OPENROUTER_API_KEY",
  xai: "XAI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
};
