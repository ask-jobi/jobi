import {
  EvaluationOptions,
  ResumeEvaluationOutput
} from './types';
import type {ResumeData} from '@/types/resume';
import {evaluateResume as evaluateResumeLLM} from "@/lib/evaluation/llm-evaluator";
import {toast} from "sonner";

/**
 * Main resume evaluation function
 * Uses LLM-based evaluation to assess resume quality
 */
export async function evaluateResume(
  resumeData: ResumeData,
  options: EvaluationOptions = {}
): Promise<ResumeEvaluationOutput> {
  const {
    jobDescription
  } = options;

  try {
    const result = await evaluateResumeLLM(resumeData, jobDescription);
    return result;
  } catch (error) {
    toast.error("Evaluation Error: " + (error instanceof Error ? error.message : 'Unknown error'));
    throw error;
  }
}

// Main type exports
export type {
  ResumeEvaluationOutput,
  EvaluationCriterion,
  EvaluationRecommendation,
  ImprovementSuggestion,
  KeywordAnalysis,
  EvaluationOptions
} from './types';


