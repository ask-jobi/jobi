// Evaluation result interface
import {ResumeData} from "@/types/resume";

export interface EvaluationResult {
  ruleName: string;
  passed: boolean;
  message?: string;
  suggestion?: string;
  score?: number; // Optional score (0-100)
}

// Module evaluation report
export interface ModuleEvaluationReport {
  module: keyof ResumeData;
  index: number;
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
export type ObjectiveRule<T> = (data: T) => Omit<EvaluationResult, 'ruleName'>;

// Rule configuration
export interface RuleConfig<T> {
  name: string;
  rule: ObjectiveRule<T>;
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
