// EvaluationEngine - Comprehensive AI response evaluation and scoring system
// Supports multiple metrics, human feedback loops, and automated quality checks
// Daily code addition 2026-11-17

export interface EvaluationMetric {
  name: string;
  weight: number;
  evaluate: (response: string, context: any) => number;
}

export interface EvaluationResult {
  overallScore: number;
  metrics: Record<string, number>;
  feedback: string[];
  timestamp: Date;
  responseId: string;
}

export class EvaluationEngine {
  private metrics: EvaluationMetric[] = [];
  private history: EvaluationResult[] = [];
  private thresholds = {
    excellent: 0.85,
    good: 0.7,
    acceptable: 0.5,
    poor: 0.3
  };

  constructor() {
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics() {
    this.metrics = [
      {
        name: 'coherence',
        weight: 0.25,
        evaluate: (response, context) => this.evaluateCoherence(response, context)
      },
      {
        name: 'relevance',
        weight: 0.3,
        evaluate: (response, context) => this.evaluateRelevance(response, context)
      },
      {
        name: 'factuality',
        weight: 0.2,
        evaluate: (response, context) => this.evaluateFactuality(response, context)
      },
      {
        name: 'creativity',
        weight: 0.15,
        evaluate: (response, context) => this.evaluateCreativity(response)
      },
      {
        name: 'safety',
        weight: 0.1,
        evaluate: (response) => this.evaluateSafety(response)
      }
    ];
  }

  evaluate(response: string, context: any = {}, responseId: string = crypto.randomUUID()): EvaluationResult {
    const metricScores: Record<string, number> = {};
    let weightedSum = 0;
    let totalWeight = 0;
    const feedback: string[] = [];

    for (const metric of this.metrics) {
      const score = Math.max(0, Math.min(1, metric.evaluate(response, context)));
      metricScores[metric.name] = score;
      weightedSum += score * metric.weight;
      totalWeight += metric.weight;

      if (score < 0.5) {
        feedback.push(`${metric.name} score is low (${score.toFixed(2)}). Consider improving ${metric.name}.`);
      }
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    const result: EvaluationResult = {
      overallScore,
      metrics: metricScores,
      feedback,
      timestamp: new Date(),
      responseId
    };

    this.history.push(result);
    return result;
  }

  private evaluateCoherence(response: string, context: any): number {
    // Simple coherence check based on sentence structure and flow
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 0.6;
    
    let coherenceScore = 0.8;
    // Check for abrupt topic changes (simplified)
    const words = response.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = 1 - (uniqueWords.size / words.length);
    coherenceScore -= repetitionRatio * 0.3;
    
    return Math.max(0, Math.min(1, coherenceScore));
  }

  private evaluateRelevance(response: string, context: any): number {
    if (!context.prompt) return 0.7;
    const promptWords = context.prompt.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    const overlap = promptWords.filter(w => responseWords.includes(w)).length;
    return Math.min(1, overlap / Math.max(1, promptWords.length * 0.3));
  }

  private evaluateFactuality(response: string, context: any): number {
    // Placeholder for fact-checking integration
    // In real implementation, would call external fact-check APIs
    const uncertainPhrases = ['I think', 'maybe', 'possibly', 'not sure'];
    const hasUncertainty = uncertainPhrases.some(p => response.toLowerCase().includes(p));
    return hasUncertainty ? 0.6 : 0.85;
  }

  private evaluateCreativity(response: string): number {
    const creativeIndicators = ['imagine', 'novel', 'unique', 'innovative', 'metaphor'];
    const matches = creativeIndicators.filter(ind => response.toLowerCase().includes(ind)).length;
    return Math.min(1, 0.5 + matches * 0.15);
  }

  private evaluateSafety(response: string): number {
    const unsafePatterns = ['harm', 'illegal', 'violence', 'explicit'];
    const hasUnsafe = unsafePatterns.some(p => response.toLowerCase().includes(p));
    return hasUnsafe ? 0.2 : 0.95;
  }

  getQualityLevel(score: number): string {
    if (score >= this.thresholds.excellent) return 'excellent';
    if (score >= this.thresholds.good) return 'good';
    if (score >= this.thresholds.acceptable) return 'acceptable';
    if (score >= this.thresholds.poor) return 'poor';
    return 'failing';
  }

  getHistory(limit: number = 50): EvaluationResult[] {
    return this.history.slice(-limit);
  }

  getAverageScore(metric?: string): number {
    if (this.history.length === 0) return 0;
    if (metric) {
      const scores = this.history.map(h => h.metrics[metric] || 0);
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    return this.history.reduce((sum, h) => sum + h.overallScore, 0) / this.history.length;
  }

  addCustomMetric(metric: EvaluationMetric) {
    this.metrics.push(metric);
  }

  removeMetric(name: string) {
    this.metrics = this.metrics.filter(m => m.name !== name);
  }

  // Advanced features
  compareResponses(responses: string[], context: any): EvaluationResult[] {
    return responses.map(r => this.evaluate(r, context));
  }

  generateImprovementSuggestions(result: EvaluationResult): string[] {
    const suggestions: string[] = [];
    if (result.metrics.coherence < 0.7) suggestions.push('Improve logical flow between sentences');
    if (result.metrics.relevance < 0.7) suggestions.push('Better address the original prompt');
    if (result.metrics.factuality < 0.7) suggestions.push('Verify factual claims');
    if (result.metrics.creativity < 0.6) suggestions.push('Add more original ideas or metaphors');
    if (result.metrics.safety < 0.8) suggestions.push('Review for potentially harmful content');
    return suggestions;
  }

  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  clearHistory() {
    this.history = [];
  }
}

export default EvaluationEngine;

// Helper utilities
export function calculateSimilarity(text1: string, text2: string): number {
  // Simple Jaccard similarity
  const set1 = new Set(text1.toLowerCase().split(/\s+/));
  const set2 = new Set(text2.toLowerCase().split(/\s+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

console.log('EvaluationEngine initialized - 2026-11-17 daily addition');
