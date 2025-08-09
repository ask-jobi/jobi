import { 
  EvaluationResult, 
  ModuleEvaluationReport, 
  RuleConfig, 
  ModuleEvaluatorConfig 
} from './types';

/**
 * Module Evaluator class
 * Responsible for executing all evaluation rules for a specific module
 */
export class ModuleEvaluator<T> {
  private config: ModuleEvaluatorConfig<T>;

  constructor(config: ModuleEvaluatorConfig<T>) {
    this.config = config;
  }

  /**
   * Evaluate module data
   * @param data Module data
   * @param options Evaluation options
   * @returns Promise<ModuleEvaluationReport>
   */
  async evaluate(data: T, options: { includeObjective?: boolean; includeSubjective?: boolean } = {}): Promise<ModuleEvaluationReport> {
    const { includeObjective = true, includeSubjective = true } = options;
    
    const enabledRules = this.config.rules.filter(rule => 
      rule.enabled !== false && 
      ((rule.type === 'objective' && includeObjective) || (rule.type === 'subjective' && includeSubjective))
    );

    const results: EvaluationResult[] = [];

    // Execute objective rules first (synchronous)
    for (const ruleConfig of enabledRules) {
      if (ruleConfig.type === 'objective' && includeObjective) {
        const rule = ruleConfig.rule as (data: T) => EvaluationResult;
        const result = rule(data);
        results.push({
          ...result,
          ruleName: ruleConfig.name
        });
      }
    }

    // Execute subjective rules (asynchronous)
    for (const ruleConfig of enabledRules) {
      if (ruleConfig.type === 'subjective' && includeSubjective) {
        const rule = ruleConfig.rule as (data: T) => Promise<EvaluationResult>;
        try {
          const result = await rule(data);
          results.push({
            ...result,
            ruleName: ruleConfig.name
          });
        } catch (error) {
          results.push({
            passed: false,
            ruleName: ruleConfig.name,
            message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'subjective'
          });
        }
      }
    }

    // Calculate module overall score
    const overallScore = this.calculateOverallScore(results, enabledRules);
    const passed = results.every(result => result.passed);

    return {
      module: this.config.moduleName,
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
    this.config.rules = this.config.rules.filter(rule => rule.name !== ruleName);
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
} 