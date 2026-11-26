/**
 * KnowledgeGraphEngine for Amienigma AI
 * Builds and queries a lightweight knowledge graph of entities, relations,
 * and contexts for better retrieval, reasoning, and multi-turn memory.
 * Supports triple storage, path finding, similarity, and export.
 * ~450 lines of TypeScript for production AI orchestration.
 */

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  confidence?: number;
  timestamp?: number;
  source?: string;
}

export interface Entity {
  id: string;
  type: string;
  attributes: Record<string, any>;
  aliases?: string[];
}

export class KnowledgeGraphEngine {
  private triples: Triple[] = [];
  private entities: Map<string, Entity> = new Map();
  private index: Map<string, Set<number>> = new Map(); // subject/object -> triple indices
  private maxTriples = 10000;

  constructor() {
    this.seedCoreKnowledge();
  }

  private seedCoreKnowledge() {
    this.addTriple({ subject: 'Amienigma', predicate: 'is', object: 'studio', confidence: 1.0 });
    this.addTriple({ subject: 'NOCTURNE', predicate: 'isA', object: 'beat-making-studio', confidence: 1.0 });
    this.addTriple({ subject: '108-lock', predicate: 'aesthetic', object: 'cybercore-night', confidence: 0.95 });
    this.addTriple({ subject: 'Neglect Archive', predicate: 'theme', object: 'dark-romanticism', confidence: 0.9 });
    this.addTriple({ subject: 'vault-db', predicate: 'stores', object: 'JSONB', confidence: 1.0 });
  }

  addEntity(entity: Entity) {
    this.entities.set(entity.id, entity);
    if (entity.aliases) {
      entity.aliases.forEach(alias => {
        this.entities.set(alias.toLowerCase(), entity);
      });
    }
  }

  addTriple(triple: Triple) {
    if (this.triples.length >= this.maxTriples) {
      this.triples.shift();
    }
    const idx = this.triples.length;
    this.triples.push({
      ...triple,
      timestamp: triple.timestamp ?? Date.now(),
      confidence: triple.confidence ?? 0.8
    });

    this.indexEntity(triple.subject, idx);
    this.indexEntity(triple.object, idx);
  }

  private indexEntity(entity: string, idx: number) {
    const key = entity.toLowerCase();
    if (!this.index.has(key)) this.index.set(key, new Set());
    this.index.get(key)!.add(idx);
  }

  query(subject?: string, predicate?: string, object?: string): Triple[] {
    return this.triples.filter(t => {
      const sMatch = !subject || t.subject.toLowerCase().includes(subject.toLowerCase());
      const pMatch = !predicate || t.predicate.toLowerCase() === predicate.toLowerCase();
      const oMatch = !object || t.object.toLowerCase().includes(object.toLowerCase());
      return sMatch && pMatch && oMatch;
    });
  }

  findRelated(entity: string, depth = 2): Triple[] {
    const visited = new Set<string>();
    const results: Triple[] = [];
    const queue: { e: string; d: number }[] = [{ e: entity.toLowerCase(), d: 0 }];

    while (queue.length) {
      const { e, d } = queue.shift()!;
      if (visited.has(e) || d > depth) continue;
      visited.add(e);

      const indices = this.index.get(e) || new Set();
      for (const idx of indices) {
        const triple = this.triples[idx];
        results.push(triple);
        if (d < depth) {
          queue.push({ e: triple.subject.toLowerCase(), d: d + 1 });
          queue.push({ e: triple.object.toLowerCase(), d: d + 1 });
        }
      }
    }
    return results;
  }

  shortestPath(from: string, to: string): Triple[] | null {
    // Simple BFS for path
    const queue: { current: string; path: Triple[] }[] = [{ current: from.toLowerCase(), path: [] }];
    const visited = new Set<string>();

    while (queue.length) {
      const { current, path } = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (current === to.toLowerCase()) return path;

      const indices = this.index.get(current) || new Set();
      for (const idx of indices) {
        const triple = this.triples[idx];
        const next = triple.subject.toLowerCase() === current
          ? triple.object.toLowerCase()
          : triple.subject.toLowerCase();
        if (!visited.has(next)) {
          queue.push({ current: next, path: [...path, triple] });
        }
      }
    }
    return null;
  }

  infer(subject: string, predicate: string): string[] {
    const direct = this.query(subject, predicate);
    return direct.map(t => t.object);
  }

  expandQuery(query: string): string[] {
    const terms = query.toLowerCase().split(/\s+/);
    const expanded = new Set(terms);
    terms.forEach(term => {
      const related = this.findRelated(term, 1);
      related.forEach(t => {
        expanded.add(t.subject.toLowerCase());
        expanded.add(t.object.toLowerCase());
        expanded.add(t.predicate.toLowerCase());
      });
    });
    return Array.from(expanded);
  }

  mergeFromText(text: string, source = 'chat') {
    // Simple extraction: look for "X is Y", "X has Y" patterns
    const isPattern = /([A-Z][a-zA-Z0-9\s]+)\s+is\s+([a-zA-Z0-9\s]+)/gi;
    const hasPattern = /([A-Z][a-zA-Z0-9\s]+)\s+has\s+([a-zA-Z0-9\s]+)/gi;

    let match;
    while ((match = isPattern.exec(text)) !== null) {
      this.addTriple({
        subject: match[1].trim(),
        predicate: 'is',
        object: match[2].trim(),
        source,
        confidence: 0.6
      });
    }
    while ((match = hasPattern.exec(text)) !== null) {
      this.addTriple({
        subject: match[1].trim(),
        predicate: 'has',
        object: match[2].trim(),
        source,
        confidence: 0.55
      });
    }
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id) || this.entities.get(id.toLowerCase());
  }

  listEntitiesByType(type: string): Entity[] {
    return Array.from(this.entities.values()).filter(e => e.type === type);
  }

  pruneLowConfidence(threshold = 0.3) {
    this.triples = this.triples.filter(t => (t.confidence ?? 1) >= threshold);
    this.rebuildIndex();
  }

  private rebuildIndex() {
    this.index.clear();
    this.triples.forEach((t, idx) => {
      this.indexEntity(t.subject, idx);
      this.indexEntity(t.object, idx);
    });
  }

  exportGraph(): { triples: Triple[]; entities: Entity[] } {
    return {
      triples: this.triples,
      entities: Array.from(this.entities.values())
    };
  }

  importGraph(data: { triples: Triple[]; entities?: Entity[] }) {
    this.triples = data.triples;
    if (data.entities) {
      data.entities.forEach(e => this.addEntity(e));
    }
    this.rebuildIndex();
  }

  // Advanced methods
  similarity(a: string, b: string): number {
    const relatedA = new Set(this.findRelated(a, 1).map(t => t.object + t.subject));
    const relatedB = new Set(this.findRelated(b, 1).map(t => t.object + t.subject));
    const intersection = [...relatedA].filter(x => relatedB.has(x)).length;
    const union = new Set([...relatedA, ...relatedB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  suggestRelations(entity: string): string[] {
    const related = this.findRelated(entity, 1);
    const predicates = new Set(related.map(t => t.predicate));
    return Array.from(predicates);
  }

  clusterByPredicate(predicate: string): Map<string, string[]> {
    const clusters = new Map<string, string[]>();
    this.query(undefined, predicate).forEach(t => {
      if (!clusters.has(t.subject)) clusters.set(t.subject, []);
      clusters.get(t.subject)!.push(t.object);
    });
    return clusters;
  }

  getStats() {
    return {
      tripleCount: this.triples.length,
      entityCount: this.entities.size,
      uniqueSubjects: new Set(this.triples.map(t => t.subject)).size,
      avgConfidence: this.triples.reduce((s, t) => s + (t.confidence ?? 0), 0) / (this.triples.length || 1)
    };
  }

  // Helpers for AI pipeline
  contextFor(entity: string, max = 10): string {
    const related = this.findRelated(entity, 2).slice(0, max);
    return related.map(t => `${t.subject} ${t.predicate} ${t.object}`).join('; ');
  }

  validateConsistency(): string[] {
    const issues: string[] = [];
    const seen = new Map<string, string>();
    this.triples.forEach(t => {
      const key = `${t.subject}|${t.predicate}`;
      if (seen.has(key) && seen.get(key) !== t.object) {
        issues.push(`Conflict: ${t.subject} ${t.predicate} ${seen.get(key)} vs ${t.object}`);
      }
      seen.set(key, t.object);
    });
    return issues;
  }

  // End of KnowledgeGraphEngine
  clear() {
    this.triples = [];
    this.entities.clear();
    this.index.clear();
    this.seedCoreKnowledge();
  }
}

export function createKnowledgeGraphEngine() {
  return new KnowledgeGraphEngine();
}

export default KnowledgeGraphEngine;
