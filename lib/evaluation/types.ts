// Evaluation result interface
export interface EvaluationResult {
  passed: boolean;
  ruleName: string;
  message?: string;
  suggestion?: string;
  type: 'objective' | 'subjective';
  score?: number; // Optional score (0-100)
}

// Module evaluation report
export interface ModuleEvaluationReport {
  module: string;
  results: EvaluationResult[];
  overallScore?: number; // Module overall score
  passed: boolean; // Whether the module passed all rules
}

// Resume overall evaluation report
export interface ResumeEvaluationReport {
  modules: ModuleEvaluationReport[];
  overallScore?: number;
  passed: boolean;
  summary?: string;
}

// Objective rule type
export type ObjectiveRule<T> = (data: T) => EvaluationResult;

// Subjective rule type (async, requires LLM)
export type SubjectiveRule<T> = (data: T) => Promise<EvaluationResult>;

// Rule configuration
export interface RuleConfig<T> {
  name: string;
  type: 'objective' | 'subjective';
  rule: ObjectiveRule<T> | SubjectiveRule<T>;
  weight?: number; // Rule weight for weighted scoring
  enabled?: boolean; // Whether the rule is enabled
}

// Module evaluator configuration
export interface ModuleEvaluatorConfig<T> {
  moduleName: string;
  rules: RuleConfig<T>[];
}

// Evaluation options
export interface EvaluationOptions {
  includeObjective?: boolean; // Whether to include objective evaluation
  includeSubjective?: boolean; // Whether to include subjective evaluation
  enableScoring?: boolean; // Whether to enable scoring
}
