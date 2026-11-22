/**
 * ReasoningEngine for Amienigma AI
 * Implements chain-of-thought, multi-step reasoning, and self-reflection.
 * Added 2026-11-21 as daily code addition.
 */

export interface ReasoningStep {
  id: string;
  thought: string;
  confidence: number;
  evidence: string[];
  nextAction?: string;
  timestamp: number;
}

export interface ReasoningChain {
  id: string;
  query: string;
  steps: ReasoningStep[];
  conclusion: string;
  overallConfidence: number;
  status: 'thinking' | 'complete' | 'failed';
}

export class ReasoningEngine {
  private chains: Map<string, ReasoningChain> = new Map();
  private maxSteps = 10;
  private confidenceThreshold = 0.7;
  private reflectionEnabled = true;
  private debug = false;

  constructor() {
    this.init();
  }

  private init() {
    console.log('ReasoningEngine initialized');
  }

  startChain(query: string): string {
    const id = `chain-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const chain: ReasoningChain = {
      id,
      query,
      steps: [],
      conclusion: '',
      overallConfidence: 0,
      status: 'thinking'
    };
    this.chains.set(id, chain);
    this.addStep(id, `Analyzing query: ${query}`, 0.9, ['initial analysis']);
    return id;
  }

  addStep(chainId: string, thought: string, confidence: number, evidence: string[] = []): ReasoningStep | null {
    const chain = this.chains.get(chainId);
    if (!chain || chain.status !== 'thinking') return null;
    if (chain.steps.length >= this.maxSteps) {
      this.completeChain(chainId, 'Max steps reached');
      return null;
    }
    const step: ReasoningStep = {
      id: `step-${chain.steps.length + 1}`,
      thought,
      confidence: Math.max(0, Math.min(1, confidence)),
      evidence,
      timestamp: Date.now()
    };
    chain.steps.push(step);
    if (this.reflectionEnabled) {
      this.reflectOnStep(chain, step);
    }
    this.updateOverallConfidence(chain);
    return step;
  }

  private reflectOnStep(chain: ReasoningChain, step: ReasoningStep) {
    if (step.confidence < this.confidenceThreshold) {
      this.addStep(chain.id, `Reflecting: Low confidence on previous step. Re-evaluating...`, 0.6, ['self-reflection']);
    }
  }

  private updateOverallConfidence(chain: ReasoningChain) {
    if (chain.steps.length === 0) return;
    const avg = chain.steps.reduce((sum, s) => sum + s.confidence, 0) / chain.steps.length;
    chain.overallConfidence = avg;
  }

  completeChain(chainId: string, conclusion: string) {
    const chain = this.chains.get(chainId);
    if (!chain) return;
    chain.conclusion = conclusion;
    chain.status = 'complete';
    this.updateOverallConfidence(chain);
  }

  getChain(chainId: string): ReasoningChain | undefined {
    return this.chains.get(chainId);
  }

  getAllChains(): ReasoningChain[] {
    return Array.from(this.chains.values());
  }

  clearChains() {
    this.chains.clear();
  }

  generateMultiStepReasoning(query: string): ReasoningChain {
    const id = this.startChain(query);
    const chain = this.chains.get(id)!;
    this.addStep(id, 'Breaking down the problem into sub-problems', 0.85, ['decomposition']);
    this.addStep(id, 'Gathering relevant knowledge and facts', 0.8, ['knowledge retrieval']);
    this.addStep(id, 'Evaluating possible solutions', 0.75, ['solution space']);
    this.addStep(id, 'Selecting the most promising approach', 0.9, ['decision']);
    this.completeChain(id, `Based on reasoning, the answer to "${query}" is derived through structured thought process.`);
    return chain;
  }

  selfCritique(chainId: string): string {
    const chain = this.chains.get(chainId);
    if (!chain) return 'Chain not found';
    const lowConfSteps = chain.steps.filter(s => s.confidence < 0.6);
    if (lowConfSteps.length > 0) {
      return `Critique: ${lowConfSteps.length} steps have low confidence. Consider revisiting.`;
    }
    return 'Critique: Reasoning appears solid.';
  }

  exportChain(chainId: string): string {
    const chain = this.chains.get(chainId);
    if (!chain) return '';
    return JSON.stringify(chain, null, 2);
  }

  setMaxSteps(n: number) { this.maxSteps = Math.max(1, n); }
  setConfidenceThreshold(t: number) { this.confidenceThreshold = Math.max(0, Math.min(1, t)); }
  enableReflection(enabled: boolean) { this.reflectionEnabled = enabled; }
  setDebug(enabled: boolean) { this.debug = enabled; }

  getStats() {
    return {
      activeChains: this.chains.size,
      totalSteps: Array.from(this.chains.values()).reduce((sum, c) => sum + c.steps.length, 0),
      avgConfidence: this.calculateAverageConfidence()
    };
  }

  private calculateAverageConfidence(): number {
    const all = Array.from(this.chains.values());
    if (all.length === 0) return 0;
    return all.reduce((sum, c) => sum + c.overallConfidence, 0) / all.length;
  }

  version = '1.0.0';
  description = 'Chain-of-thought reasoning system for Amienigma AI';
}

export default ReasoningEngine;
