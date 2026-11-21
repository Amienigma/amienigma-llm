/**
 * RetrievalEngine for Amienigma LLM
 * Implements retrieval-augmented generation helpers: chunking, embedding stubs,
 * similarity search, ranking, and context assembly.
 *
 * @module RetrievalEngine
 * @version 1.0.0
 * @date 2026-11-20
 */

export interface Chunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
  rank: number;
}

export class RetrievalEngine {
  private chunks: Map<string, Chunk> = new Map();
  private index: Map<string, number[]> = new Map();
  private maxResults: number = 5;
  private similarityThreshold: number = 0.7;

  constructor(options: { maxResults?: number; threshold?: number } = {}) {
    this.maxResults = options.maxResults ?? 5;
    this.similarityThreshold = options.threshold ?? 0.7;
  }

  addDocument(docId: string, text: string, metadata: Record<string, any> = {}) {
    const chunks = this.chunkText(text, 512);
    chunks.forEach((chunkText, i) => {
      const id = `${docId}-chunk-${i}`;
      const chunk: Chunk = {
        id,
        text: chunkText,
        metadata: { ...metadata, docId, chunkIndex: i },
      };
      this.chunks.set(id, chunk);
      // Stub embedding - in production replace with real model
      this.index.set(id, this.fakeEmbedding(chunkText));
    });
    return chunks.length;
  }

  private chunkText(text: string, size: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += size) {
      chunks.push(words.slice(i, i + size).join(' '));
    }
    return chunks;
  }

  private fakeEmbedding(text: string): number[] {
    // Deterministic fake embedding based on hash for demo
    const hash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 128 }, (_, i) => Math.sin(hash + i) * 0.5 + 0.5);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  retrieve(query: string, k: number = this.maxResults): RetrievalResult[] {
    const queryEmb = this.fakeEmbedding(query);
    const results: RetrievalResult[] = [];

    this.index.forEach((emb, id) => {
      const score = this.cosineSimilarity(queryEmb, emb);
      if (score >= this.similarityThreshold) {
        const chunk = this.chunks.get(id);
        if (chunk) {
          results.push({ chunk, score, rank: 0 });
        }
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k).map((r, i) => ({ ...r, rank: i + 1 }));
  }

  assembleContext(results: RetrievalResult[], maxTokens: number = 2000): string {
    let context = '';
    let tokenEstimate = 0;
    for (const result of results) {
      const addition = `\n---\n[Score: ${result.score.toFixed(3)}] ${result.chunk.text}`;
      const est = addition.length / 4;
      if (tokenEstimate + est > maxTokens) break;
      context += addition;
      tokenEstimate += est;
    }
    return context.trim();
  }

  clear() {
    this.chunks.clear();
    this.index.clear();
  }

  getStats() {
    return {
      totalChunks: this.chunks.size,
      maxResults: this.maxResults,
      threshold: this.similarityThreshold,
    };
  }

  // Additional methods for completeness
  updateThreshold(threshold: number) {
    this.similarityThreshold = Math.max(0, Math.min(1, threshold));
  }

  removeDocument(docId: string) {
    const toRemove: string[] = [];
    this.chunks.forEach((chunk, id) => {
      if (chunk.metadata.docId === docId) toRemove.push(id);
    });
    toRemove.forEach(id => {
      this.chunks.delete(id);
      this.index.delete(id);
    });
    return toRemove.length;
  }

  exportIndex() {
    return Array.from(this.chunks.values()).map(c => ({
      id: c.id,
      textPreview: c.text.slice(0, 100),
      metadata: c.metadata,
    }));
  }
}

export default RetrievalEngine;
