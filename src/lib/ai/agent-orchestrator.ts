/**
 * AgentOrchestrator for Amienigma LLM
 * Coordinates multiple specialized AI agents, routes tasks, manages context sharing,
 * handles tool calling delegation, and synthesizes final responses.
 * 
 * @module AgentOrchestrator
 * @version 1.0.0
 * @date 2026-11-18
 */

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  tools?: string[];
  temperature?: number;
  maxTokens?: number;
  active: boolean;
}

export interface Task {
  id: string;
  description: string;
  assignedTo?: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  dependencies?: string[];
}

export interface OrchestrationResult {
  finalResponse: string;
  agentTraces: Array<{ agentId: string; output: string; toolsUsed: string[] }>;
  totalTokens: number;
  durationMs: number;
}

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private sharedContext: Record<string, any> = {};
  private history: OrchestrationResult[] = [];
  private maxHistory = 50;

  constructor() {
    this.registerDefaultAgents();
  }

  /**
   * Register built-in specialist agents.
   */
  private registerDefaultAgents() {
    const defaults: Agent[] = [
      {
        id: "planner",
        name: "Planner",
        role: "Break complex requests into ordered subtasks and assign agents.",
        systemPrompt: "You are a meticulous planning agent. Decompose the user request into clear, sequential subtasks. Output JSON only.",
        temperature: 0.3,
        maxTokens: 1024,
        active: true,
      },
      {
        id: "researcher",
        name: "Researcher",
        role: "Gather facts, search knowledge, and provide cited information.",
        systemPrompt: "You are a research specialist. Provide accurate, up-to-date information with sources when possible. Be concise.",
        tools: ["web_search", "browse_page"],
        temperature: 0.2,
        maxTokens: 2048,
        active: true,
      },
      {
        id: "coder",
        name: "Coder",
        role: "Write, review, and debug code across languages.",
        systemPrompt: "You are an expert software engineer. Produce clean, well-commented, production-ready code. Prefer modern best practices.",
        tools: ["code_execution"],
        temperature: 0.4,
        maxTokens: 4096,
        active: true,
      },
      {
        id: "critic",
        name: "Critic",
        role: "Review outputs for accuracy, safety, completeness, and quality.",
        systemPrompt: "You are a rigorous critic. Identify flaws, missing edge cases, and improvements. Be constructive.",
        temperature: 0.5,
        maxTokens: 1536,
        active: true,
      },
      {
        id: "synthesizer",
        name: "Synthesizer",
        role: "Combine multiple agent outputs into a coherent final response.",
        systemPrompt: "You are a synthesis expert. Merge the provided agent outputs into a single, polished, user-friendly answer. Resolve conflicts by preferring higher-confidence sources.",
        temperature: 0.6,
        maxTokens: 3072,
        active: true,
      },
    ];

    defaults.forEach((a) => this.agents.set(a.id, a));
  }

  /**
   * Register a custom agent.
   */
  registerAgent(agent: Agent) {
    this.agents.set(agent.id, { ...agent, active: agent.active !== false });
  }

  /**
   * Disable or enable an agent.
   */
  setAgentActive(id: string, active: boolean) {
    const agent = this.agents.get(id);
    if (agent) agent.active = active;
  }

  /**
   * Main entry: orchestrate a user request.
   */
  async orchestrate(userRequest: string, options: { maxAgents?: number; timeoutMs?: number } = {}): Promise<OrchestrationResult> {
    const start = Date.now();
    const traces: OrchestrationResult["agentTraces"] = [];
    let totalTokens = 0;

    // Step 1: Planning
    const plan = await this.runAgent("planner", `User request: ${userRequest}\n\nProduce a JSON array of subtasks with fields: id, description, suggestedAgent.`);
    traces.push({ agentId: "planner", output: plan, toolsUsed: [] });
    totalTokens += 400; // estimate

    let subtasks: any[] = [];
    try {
      subtasks = JSON.parse(plan);
    } catch {
      subtasks = [{ id: "t1", description: userRequest, suggestedAgent: "researcher" }];
    }

    // Step 2: Execute subtasks (simplified sequential for demo)
    const results: Record<string, string> = {};
    for (const task of subtasks.slice(0, options.maxAgents || 4)) {
      const agentId = task.suggestedAgent || "researcher";
      if (!this.agents.get(agentId)?.active) continue;
      const output = await this.runAgent(agentId, `Task: ${task.description}\nContext: ${JSON.stringify(this.sharedContext)}`);
      results[task.id] = output;
      traces.push({ agentId, output, toolsUsed: this.agents.get(agentId)?.tools || [] });
      totalTokens += 800;
      this.sharedContext[task.id] = output.slice(0, 500);
    }

    // Step 3: Critique
    const critique = await this.runAgent("critic", `Review these intermediate results for the request "${userRequest}":\n${JSON.stringify(results, null, 2)}`);
    traces.push({ agentId: "critic", output: critique, toolsUsed: [] });
    totalTokens += 600;

    // Step 4: Synthesize
    const final = await this.runAgent(
      "synthesizer",
      `Original request: ${userRequest}\n\nIntermediate results:\n${JSON.stringify(results, null, 2)}\n\nCritique:\n${critique}\n\nProduce the final polished response.`
    );
    traces.push({ agentId: "synthesizer", output: final, toolsUsed: [] });
    totalTokens += 1000;

    const result: OrchestrationResult = {
      finalResponse: final,
      agentTraces: traces,
      totalTokens,
      durationMs: Date.now() - start,
    };

    this.history.push(result);
    if (this.history.length > this.maxHistory) this.history.shift();

    return result;
  }

  /**
   * Simulated agent run (replace with real LLM call in production).
   */
  private async runAgent(agentId: string, prompt: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) return `[Agent ${agentId} not found]`;

    // Placeholder: in real system, call LLM with agent.systemPrompt + prompt
    // For this module we return a structured mock that can be swapped.
    return `[${agent.name}] Processed: ${prompt.slice(0, 120)}... (simulated response for ${agent.role})`;
  }

  /**
   * Share context between agents.
   */
  updateSharedContext(key: string, value: any) {
    this.sharedContext[key] = value;
  }

  /**
   * Get active agents list.
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values()).filter((a) => a.active);
  }

  /**
   * Clear shared context.
   */
  clearContext() {
    this.sharedContext = {};
  }

  /**
   * Retrieve recent orchestration history.
   */
  getHistory(limit = 10): OrchestrationResult[] {
    return this.history.slice(-limit);
  }
}

export default AgentOrchestrator;
