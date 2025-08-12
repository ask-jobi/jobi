// Main type exports
export type {
  EvaluationResult,
  ModuleEvaluationReport,
  ResumeEvaluationReport,
  ObjectiveRule,
  SubjectiveRule,
  RuleConfig,
  ModuleEvaluatorConfig,
  LLMEvaluatorConfig,
  EvaluationOptions
} from './types';

// Main class exports
export { ModuleEvaluator } from './module-evaluator';
export { ResumeEvaluator, defaultResumeEvaluator } from './resume-evaluator';
export { LLMEvaluator, defaultLLMEvaluator } from './llm-evaluator';

// Evaluator instance exports
export {
  personalInfoEvaluator,
  educationEvaluator,
  employmentEvaluator,
  skillEvaluator,
  evaluatorRegistry
} from './evaluators';

// Rule exports
export * from './rules/objective-rules';
export * from './rules/subjective-rules';

// Resume data type exports
export type { ResumeData } from '@/types/resume';

// Convenience functions
export { EVALUATION_PROMPTS } from './llm-evaluator';

// Import for convenience functions
import { ResumeEvaluator } from './resume-evaluator';
import type { ResumeEvaluationReport } from './types';

/**
 * Quick evaluation function
 * Provides simple API to evaluate resume
 */
export async function evaluateResume(
  resumeData: any,
  options: {
    includeObjective?: boolean;
    includeSubjective?: boolean;
  } = {}
): Promise<ResumeEvaluationReport> {
  const evaluator = new ResumeEvaluator({
    includeObjective: options.includeObjective ?? true,
    includeSubjective: options.includeSubjective ?? true,
  });

  return await evaluator.evaluateResume(resumeData);
}

/**
 * Objective evaluation only function
 * No LLM subjective evaluation, faster
 */
export async function evaluateResumeObjective(
  resumeData: any
): Promise<ResumeEvaluationReport> {
  const evaluator = new ResumeEvaluator({
    includeObjective: true,
    includeSubjective: false
  });

  return await evaluator.evaluateResume(resumeData);
}

/**
 * Subjective evaluation only function
 * Only LLM-based evaluation, no objective rules
 */
export async function evaluateResumeSubjective(
  resumeData: any,
): Promise<ResumeEvaluationReport> {
  const evaluator = new ResumeEvaluator({
    includeObjective: false,
    includeSubjective: true,
  });

  return await evaluator.evaluateResume(resumeData);
}
