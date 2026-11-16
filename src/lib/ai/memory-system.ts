/**
 * MemorySystem - Persistent memory and retrieval for Amienigma AI
 * Handles episodic memory, semantic memory, and context-aware retrieval
 */

export interface MemoryEntry {
  id: string;
  content: string;
  type: 'episodic' | 'semantic' | 'procedural';
  timestamp: number;
  importance: number;
  tags: string[];
  embedding?: number[];
  metadata: Record<string, any>;
}

export interface RetrievalOptions {
  limit?: number;
  minImportance?: number;
  tags?: string[];
  type?: MemoryEntry['type'];
  recencyWeight?: number;
}

export class MemorySystem {
  private memories: Map<string, MemoryEntry> = new Map();
  private index: Map<string, Set<string>> = new Map(); // tag -> ids
  private maxMemories: number;
  private decayRate: number;

  constructor(options: { maxMemories?: number; decayRate?: number } = {}) {
    this.maxMemories = options.maxMemories ?? 1000;
    this.decayRate = options.decayRate ?? 0.01;
  }

  store(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const full: MemoryEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
      importance: entry.importance ?? 0.5
    };
    this.memories.set(id, full);
    this.indexEntry(full);
    this.pruneIfNeeded();
    return id;
  }

  retrieve(query: string, options: RetrievalOptions = {}): MemoryEntry[] {
    const {
      limit = 5,
      minImportance = 0.1,
      tags = [],
      type,
      recencyWeight = 0.3
    } = options;

    let candidates = Array.from(this.memories.values());

    if (type) {
      candidates = candidates.filter(m => m.type === type);
    }

    if (tags.length > 0) {
      candidates = candidates.filter(m =>
        tags.some(tag => m.tags.includes(tag))
      );
    }

    candidates = candidates.filter(m => m.importance >= minImportance);

    // Simple keyword scoring + recency
    const scored = candidates.map(m => {
      const keywordScore = this.scoreRelevance(m.content, query);
      const ageHours = (Date.now() - m.timestamp) / (1000 * 60 * 60);
      const recencyScore = Math.exp(-ageHours * this.decayRate);
      const score = keywordScore * (1 - recencyWeight) + recencyScore * recencyWeight;
      return { memory: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.memory);
  }

  private scoreRelevance(content: string, query: string): number {
    const contentWords = content.toLowerCase().split(/\W+/);
    const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return 0;
    let matches = 0;
    for (const qw of queryWords) {
      if (contentWords.some(cw => cw.includes(qw) || qw.includes(cw))) matches++;
    }
    return matches / queryWords.length;
  }

  updateImportance(id: string, delta: number) {
    const mem = this.memories.get(id);
    if (mem) {
      mem.importance = Math.max(0, Math.min(1, mem.importance + delta));
    }
  }

  forget(id: string) {
    const mem = this.memories.get(id);
    if (mem) {
      this.unindexEntry(mem);
      this.memories.delete(id);
    }
  }

  private indexEntry(entry: MemoryEntry) {
    for (const tag of entry.tags) {
      if (!this.index.has(tag)) this.index.set(tag, new Set());
      this.index.get(tag)!.add(entry.id);
    }
  }

  private unindexEntry(entry: MemoryEntry) {
    for (const tag of entry.tags) {
      this.index.get(tag)?.delete(entry.id);
    }
  }

  private pruneIfNeeded() {
    if (this.memories.size <= this.maxMemories) return;
    const sorted = Array.from(this.memories.values())
      .sort((a, b) => a.importance - b.importance || a.timestamp - b.timestamp);
    const toRemove = sorted.slice(0, this.memories.size - this.maxMemories);
    toRemove.forEach(m => this.forget(m.id));
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  getStats() {
    const types = { episodic: 0, semantic: 0, procedural: 0 };
    let totalImportance = 0;
    this.memories.forEach(m => {
      types[m.type]++;
      totalImportance += m.importance;
    });
    return {
      total: this.memories.size,
      byType: types,
      avgImportance: this.memories.size ? totalImportance / this.memories.size : 0,
      tags: this.index.size
    };
  }

  export(): MemoryEntry[] {
    return Array.from(this.memories.values());
  }

  import(entries: MemoryEntry[]) {
    entries.forEach(e => {
      this.memories.set(e.id, e);
      this.indexEntry(e);
    });
  }

  consolidate() {
    // Merge similar low-importance memories (simplified)
    const lowImportance = Array.from(this.memories.values())
      .filter(m => m.importance < 0.3 && m.type === 'episodic');
    // Group by tags and summarize
    const groups = new Map<string, MemoryEntry[]>();
    lowImportance.forEach(m => {
      const key = m.tags.sort().join('|') || 'untagged';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    });
    groups.forEach((group, key) => {
      if (group.length >= 3) {
        const summary = group.map(g => g.content).join(' | ');
        this.store({
          content: `Consolidated: ${summary.slice(0, 500)}`,
          type: 'semantic',
          importance: 0.6,
          tags: group[0].tags,
          metadata: { consolidatedFrom: group.map(g => g.id), count: group.length }
        });
        group.forEach(g => this.forget(g.id));
      }
    });
  }

  searchByTag(tag: string): MemoryEntry[] {
    const ids = this.index.get(tag);
    if (!ids) return [];
    return Array.from(ids).map(id => this.memories.get(id)!).filter(Boolean);
  }

  clear() {
    this.memories.clear();
    this.index.clear();
  }
}

export default MemorySystem;
