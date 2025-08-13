import { defaultLLMEvaluator } from '../llm-evaluator';
import type { ResumeData } from '@/types/resume';
import type { ModuleEvaluationReport, EvaluationResult } from '../types';

// Rule configuration interface
export interface SubjectiveRuleConfig {
  name: string;
  description: string;
  criteria: string[];
  enabled: boolean;
  weight: number;
}

// Default subjective rules configuration
export const DEFAULT_SUBJECTIVE_RULES: Record<string, SubjectiveRuleConfig> = {
  personalInfo: {
    name: "Personal Information Quality",
    description: "Evaluate personal information completeness and professionalism",
    criteria: [
      "Completeness and accuracy of contact information",
      "Professional presentation of personal details",
      "Appropriate inclusion of relevant links (LinkedIn, website)"
    ],
    enabled: true,
    weight: 1.0
  },
  education: {
    name: "Education Relevance",
    description: "Evaluate education section relevance and quality",
    criteria: [
      "Relevance of education to target position",
      "Quality of academic achievement descriptions",
      "Professional presentation of educational background"
    ],
    enabled: true,
    weight: 1.0
  },
  employment: {
    name: "Employment Experience Quality",
    description: "Evaluate employment experience descriptions",
    criteria: [
      "Clarity and professionalism of job descriptions",
      "Specificity of achievements and contributions",
      "Use of appropriate professional terminology",
      "Quantifiable results and impact"
    ],
    enabled: true,
    weight: 1.0
  },
  skills: {
    name: "Skills Assessment",
    description: "Evaluate skills section quality and relevance",
    criteria: [
      "Relevance to target industry and position",
      "Specificity of skill descriptions",
      "Logical grouping and organization",
      "Demonstration of skill application"
    ],
    enabled: true,
    weight: 1.0
  },
  overall: {
    name: "Overall Resume Quality",
    description: "Evaluate overall resume professionalism and consistency",
    criteria: [
      "Professional consistency across all sections",
      "Logical information organization",
      "Language accuracy and professionalism",
      "Competitive advantage highlighting"
    ],
    enabled: true,
    weight: 1.0
  }
};

export const evaluateResumeProfessionalism = async (
  resumeData: ResumeData,
  rules?: Record<string, SubjectiveRuleConfig>
): Promise<ModuleEvaluationReport[]> => {
  try {
    const result = await defaultLLMEvaluator.evaluateResume(resumeData, rules);

    const moduleReports: ModuleEvaluationReport[] = [];

    // Add Personal Info evaluation
    if (result.personalInfo) {
      const personalInfoResult: EvaluationResult = {
        passed: result.personalInfo.passed,
        ruleName: 'Personal Information Quality',
        message: result.personalInfo.message,
        suggestion: result.personalInfo.suggestion,
        score: result.personalInfo.score,
        type: 'subjective'
      };

      moduleReports.push({
        module: 'Personal Information (Subjective)',
        results: [personalInfoResult],
        overallScore: result.personalInfo.score,
        passed: result.personalInfo.passed
      });
    }

    // Add Education evaluations
    if (result.education && result.education.length > 0) {
      result.education.forEach((edu, index) => {
        const educationResult: EvaluationResult = {
          passed: edu.passed,
          ruleName: `Education Block ${index + 1} Quality`,
          message: edu.message,
          suggestion: edu.suggestion,
          score: edu.score,
          type: 'subjective'
        };

        moduleReports.push({
          module: `Education Block ${index + 1} (Subjective)`,
          results: [educationResult],
          overallScore: edu.score,
          passed: edu.passed
        });
      });
    }

    // Add Employment evaluations
    if (result.employment && result.employment.length > 0) {
      result.employment.forEach((emp, index) => {
        const employmentResult: EvaluationResult = {
          passed: emp.passed,
          ruleName: `Employment Block ${index + 1} Quality`,
          message: emp.message,
          suggestion: emp.suggestion,
          score: emp.score,
          type: 'subjective'
        };

        moduleReports.push({
          module: `Employment Block ${index + 1} (Subjective)`,
          results: [employmentResult],
          overallScore: emp.score,
          passed: emp.passed
        });
      });
    }

    // Add Skills evaluations
    if (result.skills && result.skills.length > 0) {
      result.skills.forEach((skill, index) => {
        const skillResult: EvaluationResult = {
          passed: skill.passed,
          ruleName: `Skills Block ${index + 1} Quality`,
          message: skill.message,
          suggestion: skill.suggestion,
          score: skill.score,
          type: 'subjective'
        };

        moduleReports.push({
          module: `Skills Block ${index + 1} (Subjective)`,
          results: [skillResult],
          overallScore: skill.score,
          passed: skill.passed
        });
      });
    }

    // Add Overall evaluation
    if (result.overall) {
      const overallResult: EvaluationResult = {
        passed: result.overall.passed,
        ruleName: 'Overall Resume Quality',
        message: result.overall.message,
        suggestion: result.overall.suggestion,
        score: result.overall.score,
        type: 'subjective'
      };

      moduleReports.push({
        module: 'Overall Professionalism',
        results: [overallResult],
        overallScore: result.overall.score,
        passed: result.overall.passed
      });
    }

    return moduleReports;
  } catch (error) {
    // Return error report if evaluation fails
    return [{
      module: 'Subjective Evaluation Error',
      results: [{
        passed: false,
        ruleName: 'Subjective Evaluation',
        message: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'subjective'
      }],
      passed: false
    }];
  }
};
