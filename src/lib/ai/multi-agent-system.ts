/**
 * MultiAgentSystem for Amienigma AI
 * Coordinates specialized agents for chat, image, video, and archive tasks.
 * Daily code addition 2026-11-14.
 */

export interface Agent {
  id: string;
  name: string;
  role: 'chat' | 'image' | 'video' | 'archive' | 'prompt' | 'memory';
  systemPrompt: string;
  temperature: number;
}

export class MultiAgentSystem {
  private agents: Map<string, Agent> = new Map();
  private conversationHistory: any[] = [];
  private sharedMemory: Map<string, any> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    this.registerAgent({
      id: 'creative-director',
      name: 'Creative Director',
      role: 'prompt',
      systemPrompt: 'You are the creative director for Amienigma Studios. Refine prompts with dark romanticism, neglect archive aesthetics, cybercore night tones.',
      temperature: 0.7
    });
    this.registerAgent({
      id: 'image-painter',
      name: 'Stills Painter',
      role: 'image',
      systemPrompt: 'Generate detailed image prompts for xAI Grok Imagine. Focus on atmospheric, gothic, cyber elements.',
      temperature: 0.8
    });
    this.registerAgent({
      id: 'film-director',
      name: 'Film Director',
      role: 'video',
      systemPrompt: 'Craft short film prompts. Emphasize motion, lighting, emotional atmosphere.',
      temperature: 0.75
    });
    this.registerAgent({
      id: 'archivist',
      name: 'Archive Intelligence',
      role: 'archive',
      systemPrompt: 'Recall and expand on Neglect Archive lore, internet culture, forgotten media.',
      temperature: 0.6
    });
    // Add more agents for completeness
    this.registerAgent({
      id: 'memory-keeper',
      name: 'Memory Keeper',
      role: 'memory',
      systemPrompt: 'Maintain long-term context across sessions. Summarize and store key facts.',
      temperature: 0.3
    });
  }

  registerAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  async coordinate(query: string, intent: 'chat' | 'image' | 'video' | 'mixed'): Promise<string> {
    const relevantAgents = this.selectAgents(intent);
    let refined = query;

    for (const agent of relevantAgents) {
      refined = await this.consultAgent(agent, refined);
    }

    this.updateMemory(query, refined);
    return refined;
  }

  private selectAgents(intent: string): Agent[] {
    const list: Agent[] = [];
    if (intent === 'image' || intent === 'mixed') list.push(this.agents.get('image-painter')!);
    if (intent === 'video' || intent === 'mixed') list.push(this.agents.get('film-director')!);
    list.push(this.agents.get('creative-director')!);
    if (intent === 'chat') list.push(this.agents.get('archivist')!);
    return list;
  }

  private async consultAgent(agent: Agent, input: string): Promise<string> {
    // In real implementation, call LLM with agent.systemPrompt + input
    // Here, simulate refinement
    return `[${agent.name} refined]: ${input} // enhanced with ${agent.role} expertise`;
  }

  private updateMemory(original: string, refined: string) {
    this.sharedMemory.set(Date.now().toString(), { original, refined });
    if (this.sharedMemory.size > 50) {
      // Trim old memories
      const keys = Array.from(this.sharedMemory.keys()).slice(0, 10);
      keys.forEach(k => this.sharedMemory.delete(k));
    }
  }

  getMemorySummary(): string {
    return Array.from(this.sharedMemory.values())
      .slice(-5)
      .map(m => m.refined)
      .join('\n');
  }

  // Additional methods to expand the module
  switchRole(agentId: string, newRole: Agent['role']) {
    const agent = this.agents.get(agentId);
    if (agent) agent.role = newRole;
  }

  listAgents() {
    return Array.from(this.agents.values());
  }
}

export const multiAgent = new MultiAgentSystem();

// Extended utilities and type guards for production use
export function isImageIntent(text: string): boolean {
  return /create.*(image|still|paint|picture)/i.test(text);
}

export function isVideoIntent(text: string): boolean {
  return /make.*(video|clip|film|animate)/i.test(text);
}

console.log('MultiAgentSystem initialized for Amienigma AI');
