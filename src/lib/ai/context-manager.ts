/**
 * Amienigma LLM Context Manager
 * Advanced conversation context, memory, and retrieval system.
 * Handles long-context windowing, semantic memory, and dynamic prompt assembly.
 * 
 * @module ContextManager
 * @version 2026-11-13
 */

export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  timestamp: number;
  relevance: number;
  tags: string[];
  source: 'user' | 'assistant' | 'system';
}

export interface ContextWindow {
  messages: Array<{ role: string; content: string }>;
  summary: string;
  tokenCount: number;
  maxTokens: number;
}

export class ContextManager {
  private memories: Map<string, MemoryEntry> = new Map();
  private windows: Map<string, ContextWindow> = new Map();
  private maxMemoryEntries = 1000;
  private embeddingDimension = 1536;

  constructor(private maxTokens = 128000) {}

  addMemory(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): string {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fullEntry: MemoryEntry = { ...entry, id, timestamp: Date.now() };
    this.memories.set(id, fullEntry);
    if (this.memories.size > this.maxMemoryEntries) this.pruneOldMemories();
    return id;
  }

  async retrieveRelevant(query: string, limit = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const scored = Array.from(this.memories.values()).map(mem => ({
      mem,
      score: this.cosineSimilarity(queryEmbedding, mem.embedding || [])
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.mem);
  }

  buildContext(conversationId: string, recentMessages: Array<{role: string; content: string}>): ContextWindow {
    let tokenCount = 0;
    const included: typeof recentMessages = [];
    const reserve = Math.floor(this.maxTokens * 0.2);
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msg = recentMessages[i];
      const tokens = this.estimateTokens(msg.content);
      if (tokenCount + tokens > this.maxTokens - reserve) break;
      included.unshift(msg);
      tokenCount += tokens;
    }
    const summary = this.generateSummary(included);
    const window: ContextWindow = { messages: included, summary, tokenCount, maxTokens: this.maxTokens };
    this.windows.set(conversationId, window);
    return window;
  }

  async assemblePrompt(conversationId: string, userQuery: string, systemPrompt: string): Promise<string> {
    const window = this.windows.get(conversationId);
    const relevant = await this.retrieveRelevant(userQuery, 3);
    let prompt = systemPrompt + '\n\n';
    if (window?.summary) prompt += `Conversation Summary: ${window.summary}\n\n`;
    if (relevant.length) {
      prompt += 'Relevant Memories:\n';
      relevant.forEach(m => { prompt += `- [${m.tags.join(', ')}] ${m.content}\n`; });
      prompt += '\n';
    }
    prompt += 'Recent Messages:\n';
    window?.messages.forEach(m => { prompt += `${m.role.toUpperCase()}: ${m.content}\n`; });
    prompt += `\nUSER: ${userQuery}\nASSISTANT:`;
    return prompt;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const vec = new Array(this.embeddingDimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      vec[i % this.embeddingDimension] += text.charCodeAt(i) / 255;
    }
    return vec.map(v => v / Math.max(...vec, 1));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private generateSummary(messages: Array<{role: string; content: string}>): string {
    if (messages.length < 4) return '';
    const topics = messages.filter(m => m.role === 'user').map(m => m.content.slice(0, 50)).join('; ');
    return `Discussion covering: ${topics}`;
  }

  private pruneOldMemories() {
    const sorted = Array.from(this.memories.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sorted.slice(0, Math.floor(this.maxMemoryEntries * 0.1));
    toRemove.forEach(([id]) => this.memories.delete(id));
  }

  exportMemories(): MemoryEntry[] {
    return Array.from(this.memories.values());
  }

  importMemories(entries: MemoryEntry[]) {
    entries.forEach(e => this.memories.set(e.id, e));
  }

  clearContext(conversationId: string) {
    this.windows.delete(conversationId);
  }

  getStats() {
    return {
      memoryCount: this.memories.size,
      activeWindows: this.windows.size,
      averageRelevance: Array.from(this.memories.values()).reduce((sum, m) => sum + m.relevance, 0) / (this.memories.size || 1)
    };
  }
}

export class ResponseOptimizer {
  optimizeForLength(response: string, maxTokens: number): string {
    const tokens = Math.ceil(response.length / 4);
    if (tokens <= maxTokens) return response;
    return response.slice(0, maxTokens * 4) + '...';
  }

  addCitations(response: string, sources: string[]): string {
    if (!sources.length) return response;
    return response + '\n\nSources:\n' + sources.map((s, i) => `[${i+1}] ${s}`).join('\n');
  }

  detectIntent(query: string): 'question' | 'command' | 'creative' | 'analysis' {
    if (query.includes('?')) return 'question';
    if (query.startsWith('create') || query.startsWith('generate')) return 'creative';
    if (query.includes('analyze') || query.includes('compare')) return 'analysis';
    return 'command';
  }
}

export class SemanticSearch {
  private index: Map<string, number[]> = new Map();

  indexMemory(id: string, embedding: number[]) {
    this.index.set(id, embedding);
  }

  search(queryEmbedding: number[], k = 5): Array<{id: string; score: number}> {
    const results: Array<{id: string; score: number}> = [];
    for (const [id, emb] of this.index) {
      const score = this.cosine(queryEmbedding, emb);
      results.push({ id, score });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  private cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }
}

export class ConversationSummarizer {
  async summarize(messages: Array<{role: string; content: string}>): Promise<string> {
    const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content);
    return `User discussed: ${userMsgs.slice(-5).join('; ')}`;
  }

  extractKeyPoints(messages: Array<{role: string; content: string}>): string[] {
    return messages.filter(m => m.role === 'assistant' && m.content.length > 100).map(m => m.content.slice(0, 150) + '...');
  }
}

export class TokenBudget {
  constructor(private limit: number) {}

  allocate(sections: Record<string, number>): Record<string, number> {
    const total = Object.values(sections).reduce((a, b) => a + b, 0);
    const scale = this.limit / total;
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(sections)) {
      result[k] = Math.floor(v * scale);
    }
    return result;
  }

  trackUsage(used: number) {
    return this.limit - used;
  }
}

export class StyleAdapter {
  adaptToUser(response: string, userPreferences: { formality: number; verbosity: number; technical: number }): string {
    let adapted = response;
    if (userPreferences.verbosity < 0.5) {
      adapted = adapted.split('.').slice(0, 3).join('.') + '.';
    }
    if (userPreferences.technical > 0.7) {
      adapted = adapted.replace(/simple/g, 'technical').replace(/easy/g, 'complex');
    }
    return adapted;
  }
}

export class MultiAgentCoordinator {
  private agents = new Map<string, { specialty: string; handler: (q: string) => Promise<string> }>();

  registerAgent(name: string, specialty: string, handler: (q: string) => Promise<string>) {
    this.agents.set(name, { specialty, handler });
  }

  async routeQuery(query: string): Promise<string> {
    for (const [name, agent] of this.agents) {
      if (query.toLowerCase().includes(agent.specialty.toLowerCase())) {
        return agent.handler(query);
      }
    }
    return 'No specialized agent matched. Using general response.';
  }
}

export default ContextManager;
