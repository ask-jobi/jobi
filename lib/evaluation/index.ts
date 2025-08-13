import {
  ResumeEvaluationReport,
  ModuleEvaluationReport,
  EvaluationOptions
} from './types';
import {evaluatorRegistry} from './evaluators';
import type {ResumeData} from '@/types/resume';
import {ModuleEvaluator} from './module-evaluator';
import {evaluateResumeProfessionalism} from "@/lib/evaluation/rules/subjective-rules";

/**
 * Evaluate multiple data blocks in a module
 */
async function evaluateSectionBlocks<T>(
  blocks: T[],
  evaluator: ModuleEvaluator<any>,
  moduleName: string
): Promise<ModuleEvaluationReport[]> {
  const reports: ModuleEvaluationReport[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const report = await evaluator.evaluate(block);

    // Add index identifier for each block
    report.module = `${moduleName} ${i + 1}`;
    reports.push(report);
  }

  return reports;
}

/**
 * Calculate overall score
 */
function calculateOverallScore(moduleReports: ModuleEvaluationReport[]): number {
  if (moduleReports.length === 0) return 0;

  const totalScore = moduleReports.reduce((sum, report) => {
    return sum + (report.overallScore || 0);
  }, 0);

  return Math.round(totalScore / moduleReports.length);
}

/**
 * Generate evaluation summary
 */
function generateSummary(moduleReports: ModuleEvaluationReport[]): string {
  const passedModules = moduleReports.filter(report => report.passed);
  const failedModules = moduleReports.filter(report => !report.passed);

  const totalModules = moduleReports.length;
  const passedCount = passedModules.length;
  const overallScore = calculateOverallScore(moduleReports);

  let summary = `Resume evaluation completed!\n\n`;
  summary += `📊 Overall Score: ${overallScore}/100\n`;
  summary += `✅ Passed Modules: ${passedCount}/${totalModules}\n`;

  if (failedModules.length > 0) {
    summary += `❌ Modules Needing Improvement: ${failedModules.map(r => r.module).join(', ')}\n`;
  }

  // Add specific suggestions
  const suggestions = moduleReports
    .flatMap(report => report.results)
    .filter(result => !result.passed && result.suggestion)
    .map(result => `• ${result.suggestion}`)
    .slice(0, 5); // Show at most 5 suggestions

  if (suggestions.length > 0) {
    summary += `\n💡 Key Suggestions:\n${suggestions.join('\n')}`;
  }

  return summary;
}

/**
 * Main resume evaluation function
 * Provides unified API to evaluate resume with configurable options
 */
export async function evaluateResume(
  resumeData: ResumeData,
  options: EvaluationOptions = {}
): Promise<ResumeEvaluationReport> {
  const {
    includeObjective = true,
    includeSubjective = false,
    enableScoring = true
  } = options;

  const moduleReports: ModuleEvaluationReport[] = [];

  if (includeObjective) {
    // Evaluate personal information
    if (resumeData.personalInfo) {
      const personalInfoReport = await evaluatorRegistry.personalInfo.evaluate(resumeData.personalInfo);
      moduleReports.push(personalInfoReport);
    }

    // Evaluate education experience
    if (resumeData.education?.blocks?.length > 0) {
      const educationReports = await evaluateSectionBlocks(
        resumeData.education.blocks,
        evaluatorRegistry.education,
        'Education Experience'
      );
      moduleReports.push(...educationReports);
    }

    // Evaluate employment experience
    if (resumeData.employment?.blocks?.length > 0) {
      const employmentReports = await evaluateSectionBlocks(
        resumeData.employment.blocks,
        evaluatorRegistry.employment,
        'Employment Experience'
      );
      moduleReports.push(...employmentReports);
    }

    // Evaluate skills
    if (resumeData.skills?.blocks?.length > 0) {
      const skillReports = await evaluateSectionBlocks(
        resumeData.skills.blocks,
        evaluatorRegistry.skills,
        'Skills'
      );
      moduleReports.push(...skillReports);
    }
  }

  if (includeSubjective) {
    try {
      const subjectiveReports = await evaluateResumeProfessionalism(resumeData);
      moduleReports.push(...subjectiveReports);
    } catch (error) {
      moduleReports.push({
        module: 'Subjective Evaluation Error',
        results: [{
          passed: false,
          ruleName: 'Subjective Evaluation',
          message: 'Subjective evaluation failed',
          type: 'subjective'
        }],
        passed: false
      });
    }
  }

  // Calculate overall score and status
  const overallScore = enableScoring ? calculateOverallScore(moduleReports) : undefined;
  const passed = moduleReports.every(report => report.passed);
  const summary = generateSummary(moduleReports);

  return {
    modules: moduleReports,
    overallScore,
    passed,
    summary
  };
}

/**
 * Objective evaluation only function
 * No LLM subjective evaluation, faster
 */
export async function evaluateResumeObjective(
  resumeData: ResumeData
): Promise<ResumeEvaluationReport> {
  return await evaluateResume(resumeData, {
    includeObjective: true,
    includeSubjective: false,
    enableScoring: true
  });
}

export async function evaluateResumeSubjective(
  resumeData: ResumeData,
): Promise<ResumeEvaluationReport> {
  return await evaluateResume(resumeData, {
    includeObjective: false,
    includeSubjective: true,
    enableScoring: true
  });
}

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
export {ModuleEvaluator} from './module-evaluator';
export {LLMEvaluator, defaultLLMEvaluator} from './llm-evaluator';

// Evaluator instance exports
export {
  personalInfoEvaluator,
  educationEvaluator,
  employmentEvaluator,
  skillEvaluator,
  evaluatorRegistry
} from './evaluators';

