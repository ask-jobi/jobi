/**
 * AI 简历评估报告（仅 output 部分）
 * 适配任意简历与职位描述 (JD)
 */
export interface ResumeEvaluationOutput {
  /** 候选人总体总结（AI 对简历的整体印象） */
  summary: string;
  /** 简历与 JD 的匹配分数（0~100） */
  matchScore: number;
  /** 各维度的评分与说明 */
  criteria: EvaluationCriterion[];
  /** 候选人主要优势 */
  strengths?: string[];
  /** 候选人可改进的地方 */
  weaknesses?: string[];
  /** AI 给出的推荐结论 */
  recommendation: EvaluationRecommendation;
  /** 针对候选人的改进建议 */
  improvementSuggestions?: ImprovementSuggestion[];
  /** 关键词匹配分析结果（从 JD 中提取） */
  keywords?: KeywordAnalysis;
  /** 潜在风险或不匹配点（例如经验不足、技能缺失） */
  risks?: string[];
}

/** 单个评估维度的评分与描述 */
export interface EvaluationCriterion {
  /** 维度名称，例如 "Technical Skills"、"Communication" */
  name: string;
  /** 评分（0~100） */
  score: number;
  /** 对该维度的具体评语 */
  comment?: string;
}

/** AI 对候选人的推荐决策 */
export interface EvaluationRecommendation {
  /** 决策结果 */
  decision: "strong_hire" | "hire" | "neutral" | "no_hire";
  /** 决策信心值（0~1） */
  confidence?: number;
  /** 决策理由说明 */
  rationale?: string;
}

/** 改进建议 */
export interface ImprovementSuggestion {
  /** 改进的领域，例如 "Communication"、"Leadership" */
  area: string;
  /** 建议的具体内容 */
  suggestion: string;
  /** 优先级 */
  priority?: "low" | "medium" | "high";
}

/** 关键词匹配结果（简历 vs JD） */
export interface KeywordAnalysis {
  /** 匹配到的关键词 */
  matched: string[];
  /** JD 中未匹配的关键词 */
  missing: string[];
}
