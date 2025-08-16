import {
  EvaluationResult,
  ModuleEvaluationReport,
  RuleConfig,
  ModuleEvaluatorConfig
} from './types';

/**
 * Module Evaluator class
 * Responsible for executing objective evaluation rules for a specific module
 */
export class ModuleEvaluator<T> {
  private config: ModuleEvaluatorConfig<T>;

  constructor(config: ModuleEvaluatorConfig<T>) {
    this.config = config;
  }

  async evaluate(data: T, index: number): Promise<ModuleEvaluationReport> {
    const enabledRules = this.config.rules.filter(rule => rule.enabled !== false);

    const results: EvaluationResult[] = [];

    // Execute objective rules (synchronous)
    for (const ruleConfig of enabledRules) {
      const rule = ruleConfig.rule as (data: T) => EvaluationResult;
      const result = rule(data);
      results.push({
        ...result,
        ruleName: ruleConfig.name
      });
    }

    // Calculate module overall score
    const overallScore = this.calculateOverallScore(results, enabledRules);
    const passed = results.every(result => result.passed);

    return {
      module: this.config.moduleName,
      index: index,
      results,
      overallScore,
      passed
    };
  }

  /**
   * Calculate module overall score
   */
  private calculateOverallScore(results: EvaluationResult[], rules: RuleConfig<T>[]): number {
    if (results.length === 0) return 0;

    let totalWeight = 0;
    let weightedScore = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const rule = rules[i];
      const weight = rule.weight || 1;

      totalWeight += weight;

      // Use score if available, otherwise calculate based on passed status
      const score = result.score !== undefined ? result.score : (result.passed ? 100 : 0);
      weightedScore += score * weight;
    }

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  /**
   * Add rule
   */
  addRule(rule: RuleConfig<T>): void {
    this.config.rules.push(rule);
  }

  /**
   * Remove rule
   */
  removeRule(ruleName: string): void {
    this.config = {
      ...this.config,
      rules: this.config.rules.filter(rule => rule.name !== ruleName)
    };
  }

  /**
   * Enable/disable rule
   */
  toggleRule(ruleName: string, enabled: boolean): void {
    const rule = this.config.rules.find(r => r.name === ruleName);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all rules
   */
  getRules(): RuleConfig<T>[] {
    return [...this.config.rules];
  }

  /**
   * Update rule configuration
   */
  updateRule(ruleName: string, updates: Partial<RuleConfig<T>>): void {
    const ruleIndex = this.config.rules.findIndex(r => r.name === ruleName);
    if (ruleIndex !== -1) {
      this.config.rules[ruleIndex] = { ...this.config.rules[ruleIndex], ...updates };
    }
  }
}
