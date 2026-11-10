import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Code,
  Copy,
  Cpu,
  Database,
  FileText,
  Globe,
  Key,
  Layers,
  Lock,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { ENV_HINTS, SAMPLE_AUDIT_LOGS, SAMPLE_ORCH_RULES, SAMPLE_PLUGINS } from "./sample-data";

type ProviderPublic = {
  id: string;
  name: string;
  configured: boolean;
  defaultModel: string;
  models: string[];
  baseUrl: string;
  protocol: string;
};

type Tab =
  | "dashboard"
  | "terminal"
  | "vault"
  | "registry"
  | "console"
  | "orchestrator"
  | "telemetry"
  | "plugins"
  | "audit"
  | "security"
  | "config"
  | "docs";

const NAV: Array<{ id: Tab; label: string; icon: typeof Activity; badge?: string }> = [
  { id: "dashboard", label: "Dashboard Overview", icon: Activity },
  { id: "terminal", label: "Server Terminal", icon: Terminal, badge: "Sandbox" },
  { id: "vault", label: "API Key Vault", icon: Key },
  { id: "registry", label: "Provider Registry", icon: Globe },
  { id: "console", label: "API Request Console", icon: Code },
  { id: "orchestrator", label: "AI Orchestrator", icon: Layers },
  { id: "telemetry", label: "Live Telemetry", icon: Cpu },
  { id: "plugins", label: "Plugin Suite", icon: Database },
  { id: "audit", label: "Audit & Request Logs", icon: FileText },
  { id: "security", label: "Security & RBAC", icon: Shield },
  { id: "config", label: "System Configuration", icon: Settings },
  { id: "docs", label: "Documentation & CLI", icon: Sparkles },
];

type ConsoleResponse = {
  content?: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  error?: string;
};

export function PinkrootApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [contentMode, setContentMode] = useState<"STANDARD" | "ADVANCED">("STANDARD");
  const [scanlines, setScanlines] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [plugins, setPlugins] = useState(SAMPLE_PLUGINS);
  const [orchRules] = useState(SAMPLE_ORCH_RULES);
  const [auditLogs, setAuditLogs] = useState(SAMPLE_AUDIT_LOGS);
  const [auditSearch, setAuditSearch] = useState("");
  const [cpuUsage, setCpuUsage] = useState(28);
  const [ramUsage, setRamUsage] = useState(4.2);
  const [netSpeed, setNetSpeed] = useState({ in: 412, out: 890 });
  const [telemetryLogs, setTelemetryLogs] = useState([
    "[SAMPLE] Telemetry shown here is illustrative unless a live console request just ran.",
    "[SYSTEM] Provider registry reads /api/providers and never returns key values.",
  ]);

  const [consoleProvider, setConsoleProvider] = useState("");
  const [consoleModel, setConsoleModel] = useState("openrouter/free");
  const [reqBody, setReqBody] = useState(
    '{\n  "messages": [\n    {"role": "user", "content": "Hello from the PINKROOT request console."}\n  ]\n}',
  );
  const [apiResponse, setApiResponse] = useState<ConsoleResponse | null>(null);
  const [isReqLoading, setIsReqLoading] = useState(false);

  const [termTabs, setTermTabs] = useState([
    { id: 1, title: "sandbox-01:~" },
    { id: 2, title: "notes:~" },
  ]);
  const [activeTermTab, setActiveTermTab] = useState(1);
  const [termHistory, setTermHistory] = useState([
    { tab: 1, text: "PINKROOT sandbox (no remote shell on this host)", type: "sys" },
    { tab: 1, text: 'Type "help" or "status". Live Linux PTY access stays in the standalone pinkroot server.', type: "sys" },
    { tab: 2, text: "This tab is also a local sandbox.", type: "sys" },
  ]);
  const [termInput, setTermInput] = useState("");
  const termEndRef = useRef<HTMLDivElement | null>(null);

  const configured = providers.filter((item) => item.configured);
  const selectedProvider = providers.find((item) => item.id === consoleProvider) ?? configured[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3000);
  };

  async function refreshProviders() {
    setLoadingProviders(true);
    try {
      const response = await fetch("/api/providers");
      const data = (await response.json()) as { providers?: ProviderPublic[]; error?: string };
      if (!response.ok || !data.providers) {
        throw new Error(data.error || "Could not load providers.");
      }
      setProviders(data.providers);
      setProvidersError(null);
      const next = data.providers.find((item) => item.configured) ?? data.providers[0];
      if (next) {
        setConsoleProvider((current) => current || next.id);
        setConsoleModel((current) => current || next.defaultModel);
      }
    } catch (error) {
      setProvidersError(error instanceof Error ? error.message : "Could not load providers.");
    } finally {
      setLoadingProviders(false);
    }
  }

  useEffect(() => {
    void refreshProviders();
  }, []);

  useEffect(() => {
    if (!selectedProvider) return;
    if (!selectedProvider.models.includes(consoleModel)) {
      setConsoleModel(selectedProvider.defaultModel);
    }
  }, [selectedProvider, consoleModel]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCpuUsage((prev) => Math.min(99, Math.max(12, Math.floor(prev + (Math.random() * 12 - 6)))));
      setRamUsage((prev) => Number(Math.min(15.8, Math.max(2.1, prev + (Math.random() * 0.4 - 0.2))).toFixed(1)));
      setNetSpeed({
        in: Math.floor(350 + Math.random() * 300),
        out: Math.floor(700 + Math.random() * 400),
      });
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [termHistory, activeTermTab]);

  const handleTermSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!termInput.trim()) return;
    const cmd = termInput.trim();
    const next = [...termHistory, { tab: activeTermTab, text: `sandbox:~$ ${cmd}`, type: "cmd" }];
    const clean = cmd.toLowerCase();
    let responseText = "";
    if (clean === "help") {
      responseText = `Available sandbox commands:
  help         - This menu
  status       - Show configured providers (no secrets)
  vault list   - Same as status
  routes       - Show documented orchestration rules
  clear        - Clear this tab
The live bash PTY from standalone PINKROOT is not available on this Vercel app.`;
    } else if (clean === "status" || clean === "vault list") {
      responseText = providers
        .map((item) => `[${item.configured ? "READY" : "UNSET"}] ${item.name} → ${ENV_HINTS[item.id] ?? item.id}`)
        .join("\n");
    } else if (clean === "routes") {
      responseText = orchRules.map((rule) => `Rule #${rule.id}: ${rule.name} -> ${rule.action}`).join("\n");
    } else if (clean === "clear") {
      setTermHistory((prev) => prev.filter((item) => item.tab !== activeTermTab));
      setTermInput("");
      return;
    } else {
      responseText = `Sandbox cannot run \`${cmd}\`. Type "help" for available commands.`;
    }
    setTermHistory([...next, { tab: activeTermTab, text: responseText, type: "out" }]);
    setTermInput("");
  };

  const handleExecuteRequest = async () => {
    setIsReqLoading(true);
    setApiResponse(null);
    try {
      let parsed: { messages?: unknown };
      try {
        parsed = JSON.parse(reqBody) as { messages?: unknown };
      } catch {
        throw new Error("Request body must be JSON with a messages array.");
      }
      const response = await fetch("/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider?.id,
          model: consoleModel,
          messages: parsed.messages,
        }),
      });
      const data = (await response.json()) as ConsoleResponse;
      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }
      setApiResponse(data);
      setTelemetryLogs((prev) => [
        `[CONSOLE] ${data.provider}/${data.model} responded in ${data.latencyMs}ms`,
        ...prev.slice(0, 49),
      ]);
      setAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          user: "studio",
          event: "CONSOLE_REQUEST",
          details: `Live console call via ${data.provider} (${data.model})`,
          ip: "local",
          severity: "info",
        },
        ...prev,
      ]);
      showToast(`Request finished in ${data.latencyMs}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed.";
      setApiResponse({ error: message });
      showToast(message);
    } finally {
      setIsReqLoading(false);
    }
  };

  const filteredAuditLogs = useMemo(
    () =>
      auditLogs.filter((log) =>
        `${log.details} ${log.event} ${log.user}`.toLowerCase().includes(auditSearch.toLowerCase()),
      ),
    [auditLogs, auditSearch],
  );

  return (
    <div
      className={`flex min-h-[calc(100dvh-7.5rem)] flex-col bg-[#0d0914] text-pink-100 ${
        scanlines
          ? "before:pointer-events-none before:absolute before:inset-0 before:z-50 before:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] before:bg-[length:100%_4px]"
          : ""
      }`}
    >
      {toastMsg && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-3 rounded-xl border border-pink-300/40 bg-gradient-to-r from-pink-600 to-fuchsia-700 px-5 py-3 text-sm text-white shadow-[0_0_25px_rgba(236,72,153,0.5)]">
          <Sparkles className="h-5 w-5" />
          {toastMsg}
        </div>
      )}

      <header className="flex h-16 items-center justify-between border-b border-pink-500/20 bg-[#160d24]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-rose-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]">
            <Terminal className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="bg-gradient-to-r from-pink-300 via-fuchsia-200 to-white bg-clip-text text-xl font-extrabold tracking-wider text-transparent">
                PINKROOT
              </h1>
              <span className="rounded-full border border-pink-500/30 bg-pink-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-pink-300 uppercase">
                studio
              </span>
            </div>
            <p className="hidden font-mono text-[11px] tracking-tight text-pink-400/80 sm:block">
              Pretty interface. Shared Amienigma server.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-pink-500/30 bg-[#231238] p-1">
            <button
              type="button"
              onClick={() => {
                setContentMode("STANDARD");
                showToast("Display mode: STANDARD");
              }}
              className={`rounded-lg px-3 py-1 text-xs font-bold ${
                contentMode === "STANDARD" ? "bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white" : "text-pink-400"
              }`}
            >
              STANDARD
            </button>
            <button
              type="button"
              onClick={() => {
                setContentMode("ADVANCED");
                showToast("Display mode only — it does not bypass server safety or change API calls.");
              }}
              className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold ${
                contentMode === "ADVANCED" ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white" : "text-pink-400"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              ADVANCED LOOK
            </button>
          </div>
          <button
            type="button"
            onClick={() => setScanlines((value) => !value)}
            className={`rounded-xl border p-2 ${scanlines ? "border-pink-400 bg-pink-500/20 text-pink-200" : "border-pink-500/20 text-pink-400/70"}`}
            title="Toggle scanlines"
          >
            <Radio className="h-4 w-4" />
          </button>
          <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 lg:flex">
            <div className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-semibold text-emerald-300">
              {configured.length} PROVIDER{configured.length === 1 ? "" : "S"} READY
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-pink-500/20 bg-[#12091c]/90 p-4 md:flex">
          <div className="space-y-1">
            <div className="mb-2 px-3 font-mono text-[10px] font-bold tracking-widest text-pink-400/60 uppercase">
              Core modules
            </div>
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badge = item.id === "vault" ? configured.length : item.badge;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium ${
                    isActive
                      ? "border border-pink-500/50 bg-gradient-to-r from-pink-600/30 to-fuchsia-600/20 text-white"
                      : "text-pink-300/70 hover:bg-pink-500/10 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-pink-400" />
                    <span className="font-semibold">{item.label}</span>
                  </span>
                  {badge !== undefined && (
                    <span className="rounded-full bg-pink-950/60 px-2 py-0.5 font-mono text-[10px] text-pink-400">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d0e2e] via-[#0d0914] to-[#050308] p-4 md:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] ${
                  activeTab === item.id ? "border-pink-400 bg-pink-500/20 text-white" : "border-pink-500/20 text-pink-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-900/40 via-fuchsia-900/30 to-purple-950/40 p-6">
                <img src="/pinkroot-cover.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-2xl font-black tracking-wide text-white">System orchestration hub</h2>
                    <p className="mt-1 text-sm text-pink-300/80">
                      Live provider status comes from this app’s server. Spend charts and historical
                      topology numbers below are labeled sample data.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("console")}
                      className="flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-xs font-bold text-white"
                    >
                      <Code className="h-4 w-4" /> Open request console
                    </button>
                    <button
                      type="button"
                      onClick={() => void refreshProviders()}
                      className="flex items-center gap-2 rounded-xl border border-pink-500/40 bg-[#251036] px-4 py-2 text-xs font-bold text-pink-200"
                    >
                      <RefreshCw className="h-4 w-4" /> Refresh providers
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Configured server keys",
                    value: loadingProviders ? "…" : String(configured.length),
                    change: "Read from environment variables",
                    icon: Key,
                    sample: false,
                  },
                  {
                    label: "Total API spend (30d)",
                    value: "$2,355.82",
                    change: "Sample figure — not billed data",
                    icon: Zap,
                    sample: true,
                  },
                  {
                    label: "Last console latency",
                    value: apiResponse?.latencyMs ? `${apiResponse.latencyMs} ms` : "112 ms",
                    change: apiResponse?.latencyMs ? "From the last live console request" : "Sample until you send a request",
                    icon: Activity,
                    sample: !apiResponse?.latencyMs,
                  },
                  {
                    label: "Documented fallback routes",
                    value: String(orchRules.length),
                    change: "Described in the orchestrator panel",
                    icon: Layers,
                    sample: false,
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-2xl border border-pink-500/20 bg-[#180c29]/80 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-pink-300/70 uppercase">{stat.label}</span>
                        <div className="rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 p-2.5 text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-black tracking-tight text-white">{stat.value}</div>
                      <div className="mt-1 font-mono text-[11px] text-pink-400/80">
                        {stat.sample ? "SAMPLE · " : ""}
                        {stat.change}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "terminal" && (
            <div className="flex h-full min-h-[500px] flex-col space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                  <Terminal className="h-5 w-5 text-pink-400" />
                  Sandbox terminal
                </h2>
                <p className="text-xs text-pink-300/70">
                  Local command help only. The standalone PINKROOT Linux PTY and WebSocket shell are
                  not part of this hosted app.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-pink-500/30 bg-[#170a26] p-1">
                {termTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTermTab(tab.id)}
                    className={`rounded-lg px-3 py-1 font-mono text-xs font-bold ${
                      activeTermTab === tab.id ? "bg-pink-500 text-white" : "text-pink-400"
                    }`}
                  >
                    {tab.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTermTabs((prev) => [...prev, { id: prev.length + 1, title: `tab-0${prev.length + 1}:~` }])}
                  className="rounded-lg p-1 text-pink-400"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-pink-500/40 bg-[#09040e] font-mono">
                <div className="flex-1 space-y-2 overflow-y-auto p-4 text-xs">
                  {termHistory
                    .filter((item) => item.tab === activeTermTab)
                    .map((item, index) => (
                      <div key={`${item.tab}-${index}`} className="whitespace-pre-wrap leading-relaxed">
                        {item.type === "cmd" && <div className="font-bold text-pink-400">{item.text}</div>}
                        {item.type === "sys" && <div className="italic text-fuchsia-300/80">{item.text}</div>}
                        {item.type === "out" && (
                          <div className="border-l-2 border-pink-500/30 pl-4 text-pink-100/90">{item.text}</div>
                        )}
                      </div>
                    ))}
                  <div ref={termEndRef} />
                </div>
                <form onSubmit={handleTermSubmit} className="flex items-center gap-3 border-t border-pink-500/30 bg-[#11061f] p-3">
                  <span className="text-sm font-bold text-emerald-400">sandbox:~$</span>
                  <input
                    value={termInput}
                    onChange={(event) => setTermInput(event.target.value)}
                    placeholder='Type "help", "status", or "vault list"'
                    className="flex-1 border-none bg-transparent font-mono text-xs text-pink-100 outline-none"
                  />
                  <button type="submit" className="rounded-lg bg-pink-500 px-4 py-1.5 text-xs font-bold text-white">
                    EXEC
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "vault" && (
            <div className="space-y-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                  <Key className="h-5 w-5 text-pink-400" />
                  Server credential vault
                </h2>
                <p className="text-xs text-pink-300/70">
                  Keys live in server environment variables. This table never shows or copies secret
                  values, and the browser cannot add a production key.
                </p>
              </div>
              <div className="overflow-hidden rounded-3xl border border-pink-500/30 bg-[#150a24]/90">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-pink-500/30 bg-[#200d36] text-[10px] tracking-wider text-pink-300 uppercase">
                    <tr>
                      <th className="p-4">Provider</th>
                      <th className="p-4">Environment variable</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Secret</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-500/10">
                    {providers.map((item) => (
                      <tr key={item.id}>
                        <td className="p-4 font-semibold text-white">{item.name}</td>
                        <td className="p-4 text-pink-300">{ENV_HINTS[item.id]}</td>
                        <td className="p-4">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              item.configured
                                ? "border-emerald-500/30 bg-emerald-950 text-emerald-300"
                                : "border-pink-500/30 bg-pink-950 text-pink-300"
                            }`}
                          >
                            {item.configured ? "Configured" : "Not set"}
                          </span>
                        </td>
                        <td className="p-4 text-pink-400">
                          {item.configured ? "Stored on the server · value hidden" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {providersError && <p className="text-sm text-rose-300">{providersError}</p>}
            </div>
          )}

          {activeTab === "registry" && (
            <div className="space-y-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                  <Globe className="h-5 w-5 text-pink-400" />
                  Provider registry
                </h2>
                <p className="text-xs text-pink-300/70">
                  Live configuration from `/api/providers`. Latency and historical error rates from
                  the original demo board are not claimed here.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {providers.map((prov) => (
                  <div key={prov.id} className="space-y-3 rounded-3xl border border-pink-500/20 bg-[#160b24]/80 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{prov.name}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                          prov.configured
                            ? "border-emerald-500/30 bg-emerald-950 text-emerald-400"
                            : "border-pink-500/30 bg-pink-950 text-pink-300"
                        }`}
                      >
                        {prov.configured ? "Configured" : "Not configured"}
                      </span>
                    </div>
                    <div className="truncate rounded-xl border border-pink-500/10 bg-[#0e0618] p-2.5 font-mono text-xs text-pink-300/70">
                      {prov.baseUrl}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-xl border border-pink-500/20 bg-[#1f0d36] p-2">
                        <div className="text-[10px] text-pink-400">PROTOCOL</div>
                        <div className="font-mono text-xs font-bold text-white">{prov.protocol}</div>
                      </div>
                      <div className="rounded-xl border border-pink-500/20 bg-[#1f0d36] p-2">
                        <div className="text-[10px] text-pink-400">DEFAULT MODEL</div>
                        <div className="font-mono text-xs font-bold text-white">{prov.defaultModel}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {prov.models.map((model) => (
                        <span key={model} className="rounded-md border border-pink-500/30 bg-pink-950/60 px-2 py-0.5 font-mono text-[10px] text-pink-200">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "console" && (
            <div className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                  <Code className="h-5 w-5 text-pink-400" />
                  API request console
                </h2>
                <p className="text-xs text-pink-300/70">
                  Sends a real request to `/api/console` on this server. You pick a configured
                  provider and messages — not an arbitrary URL or Authorization header.
                </p>
              </div>
              <div className="space-y-4 rounded-2xl border border-pink-500/30 bg-[#150a24]/90 p-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <select
                    value={selectedProvider?.id ?? ""}
                    onChange={(event) => setConsoleProvider(event.target.value)}
                    className="rounded-xl border border-pink-500/40 bg-[#240e3a] px-3 py-2.5 font-mono text-xs font-bold text-pink-200"
                  >
                    {providers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.configured ? "" : " (not configured)"}
                      </option>
                    ))}
                  </select>
                  <select
                    value={consoleModel}
                    onChange={(event) => setConsoleModel(event.target.value)}
                    className="flex-1 rounded-xl border border-pink-500/30 bg-[#0f061c] px-4 py-2.5 font-mono text-xs text-pink-100"
                  >
                    {(selectedProvider?.models ?? []).map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleExecuteRequest()}
                    disabled={isReqLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 px-6 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {isReqLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    SEND REQUEST
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="font-mono text-xs font-bold text-pink-300 uppercase">JSON messages payload</label>
                    <textarea
                      value={reqBody}
                      onChange={(event) => setReqBody(event.target.value)}
                      rows={10}
                      className="w-full rounded-xl border border-pink-500/30 bg-[#0b0414] p-3 font-mono text-xs text-pink-200 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs font-bold text-pink-300 uppercase">Response</label>
                      {apiResponse?.latencyMs != null && (
                        <span className="font-mono text-[10px] text-pink-400">{apiResponse.latencyMs}ms</span>
                      )}
                    </div>
                    <div className="h-[210px] overflow-y-auto rounded-xl border border-pink-500/30 bg-[#0b0414] p-3 font-mono text-xs text-pink-200">
                      {isReqLoading ? (
                        "Dispatching server request…"
                      ) : apiResponse ? (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                      ) : (
                        <span className="italic text-pink-500/40">Send a request to inspect a live model reply.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orchestrator" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <Layers className="h-5 w-5 text-pink-400" />
                Orchestration notes
              </h2>
              {orchRules.map((rule) => (
                <div key={rule.id} className="rounded-3xl border border-pink-500/30 bg-[#150a24]/90 p-5">
                  <div className="mb-2 font-mono text-[10px] text-pink-300">SAMPLE RULE #{rule.id}</div>
                  <h3 className="text-base font-bold text-white">{rule.name}</h3>
                  <p className="mt-1 font-mono text-xs text-pink-300/80">TRIGGER: {rule.trigger}</p>
                  <p className="font-mono text-xs text-fuchsia-300">ACTION: {rule.action}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "telemetry" && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <Activity className="h-5 w-5 text-pink-400" />
                Telemetry
              </h2>
              <p className="text-xs text-pink-300/70">
                CPU, RAM, and network bars are sample motion for the dashboard look. Console lines
                appended after a live request are real.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  ["CPU (sample)", `${cpuUsage}%`, cpuUsage],
                  ["Memory (sample)", `${ramUsage} GB`, (ramUsage / 16) * 100],
                  ["Network (sample)", `↓${netSpeed.in} KB/s ↑${netSpeed.out} KB/s`, (netSpeed.out / 1200) * 100],
                ].map(([label, value, width]) => (
                  <div key={String(label)} className="space-y-3 rounded-3xl border border-pink-500/30 bg-[#150a24]/90 p-5">
                    <div className="flex justify-between text-xs font-bold text-pink-300">
                      <span>{label}</span>
                      <span className="font-mono text-pink-400">{value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border border-pink-500/20 bg-pink-950">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-72 space-y-2 overflow-y-auto rounded-3xl border border-pink-500/30 bg-[#09040e] p-4 font-mono text-xs">
                {telemetryLogs.map((log, index) => (
                  <div key={`${log}-${index}`} className="text-pink-200/90">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "plugins" && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <Database className="h-5 w-5 text-pink-400" />
                Plugin suite
                <span className="rounded-full border border-pink-500/30 px-2 py-0.5 text-[10px] text-pink-300">SAMPLE</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {plugins.map((plug) => (
                  <div key={plug.id} className="space-y-4 rounded-3xl border border-pink-500/30 bg-[#150a24]/90 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">{plug.name}</h3>
                        <span className="font-mono text-[10px] text-pink-400">{plug.version}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPlugins((prev) =>
                            prev.map((item) => (item.id === plug.id ? { ...item, enabled: !item.enabled } : item)),
                          )
                        }
                        className={`rounded-xl px-4 py-1.5 text-xs font-bold ${
                          plug.enabled ? "bg-pink-500 text-white" : "border border-pink-500/30 bg-pink-950 text-pink-400"
                        }`}
                      >
                        {plug.enabled ? "ACTIVE" : "DISABLED"}
                      </button>
                    </div>
                    <p className="text-xs text-pink-300/80">{plug.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                  <FileText className="h-5 w-5 text-pink-400" />
                  Audit log
                </h2>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-pink-400" />
                  <input
                    value={auditSearch}
                    onChange={(event) => setAuditSearch(event.target.value)}
                    placeholder="Search logs"
                    className="w-64 rounded-xl border border-pink-500/30 bg-[#160b26] py-2 pr-4 pl-9 text-xs text-pink-100 outline-none"
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-3xl border border-pink-500/30 bg-[#150a24]/90">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="border-b border-pink-500/30 bg-[#200d36] text-[10px] tracking-wider text-pink-300 uppercase">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-500/10">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="p-4 text-pink-300/80">{log.timestamp}</td>
                        <td className="p-4 font-semibold text-white">{log.user}</td>
                        <td className="p-4 text-pink-300">{log.event}</td>
                        <td className="p-4 text-pink-200">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <Shield className="h-5 w-5 text-pink-400" />
                Security notes
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-pink-500/30 bg-[#150a24]/90 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                    <Lock className="h-4 w-4 text-pink-400" />
                    Credential handling
                  </h3>
                  <p className="text-xs text-pink-300/80">
                    Language-model keys stay in server environment variables. UI routes never receive
                    them, and the request console cannot supply its own Authorization header.
                  </p>
                </div>
                <div className="space-y-3 rounded-3xl border border-pink-500/30 bg-[#150a24]/90 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                    <ShieldAlert className="h-4 w-4 text-pink-400" />
                    What was not ported
                  </h3>
                  <p className="text-xs text-pink-300/80">
                    Host login, JWT sessions, and a WebSocket bash PTY belong to the standalone
                    PINKROOT Linux installer — not this multi-tenant Vercel app.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <Settings className="h-5 w-5 text-pink-400" />
                Configuration
              </h2>
              <div className="max-w-2xl space-y-3 rounded-3xl border border-pink-500/30 bg-[#150a24]/90 p-6 text-xs text-pink-200">
                <p>Set server keys in the host environment, then redeploy:</p>
                <pre className="overflow-x-auto rounded-xl bg-[#10061e] p-3 font-mono text-pink-100">
{`OPENROUTER_API_KEY=
XAI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=`}
                </pre>
                <button
                  type="button"
                  onClick={() => void refreshProviders()}
                  className="rounded-xl bg-pink-500 px-5 py-2.5 font-bold text-white"
                >
                  Recheck configured providers
                </button>
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                <Sparkles className="h-5 w-5 text-pink-400" />
                Documentation
              </h2>
              <div className="space-y-3 rounded-3xl border border-pink-500/40 bg-[#09040e] p-5 font-mono text-xs text-pink-200">
                <div>Chat, images, and video stay on the main Amienigma AI studio.</div>
                <div>Translator: /translator</div>
                <div>Pinkroot console: POST /api/console with provider, model, and messages.</div>
                <div>Providers: GET /api/providers</div>
                <div className="flex items-center justify-between rounded-xl border border-pink-500/20 bg-[#170b26] p-3">
                  <code>GET /api/providers</code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText("GET /api/providers");
                      showToast("Copied endpoint");
                    }}
                    className="rounded-lg border border-pink-500/30 p-1.5"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
