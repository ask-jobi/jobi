import { LLMEvaluatorConfig } from './types';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import {EducationBlock, EmploymentBlock, ResumeData, SkillBlock} from '@/types/resume';
import {DEFAULT_SUBJECTIVE_RULES, SubjectiveRuleConfig} from "@/lib/evaluation/rules/subjective-rules";

// Evaluation result schema for structured output
const evaluationSchema = z.object({
  personalInfo: z.object({
    passed: z.boolean().describe("Whether personal info passes evaluation"),
    score: z.number().min(0).max(100).describe("Personal info score from 0 to 100"),
    message: z.string().describe("Personal info evaluation message"),
    suggestion: z.string().describe("Personal info improvement suggestions")
  }),
  education: z.array(z.object({
    passed: z.boolean().describe("Whether this education block passes evaluation"),
    score: z.number().min(0).max(100).describe("Education block score from 0 to 100"),
    message: z.string().describe("Education block evaluation message"),
    suggestion: z.string().describe("Education block improvement suggestions")
  })).describe("Array of education block evaluations"),
  employment: z.array(z.object({
    passed: z.boolean().describe("Whether this employment block passes evaluation"),
    score: z.number().min(0).max(100).describe("Employment block score from 0 to 100"),
    message: z.string().describe("Employment block evaluation message"),
    suggestion: z.string().describe("Employment block improvement suggestions")
  })).describe("Array of employment block evaluations"),
  skills: z.array(z.object({
    passed: z.boolean().describe("Whether this skills block passes evaluation"),
    score: z.number().min(0).max(100).describe("Skills block score from 0 to 100"),
    message: z.string().describe("Skills block evaluation message"),
    suggestion: z.string().describe("Skills block improvement suggestions")
  })).describe("Array of skills block evaluations"),
  overall: z.object({
    passed: z.boolean().describe("Whether overall resume passes evaluation"),
    score: z.number().min(0).max(100).describe("Overall resume score from 0 to 100"),
    message: z.string().describe("Overall evaluation message"),
    suggestion: z.string().describe("Overall improvement suggestions")
  })
});

type EvaluationSchemaType = z.infer<typeof evaluationSchema>;

// LLM Evaluator class
export class LLMEvaluator {
  private config: LLMEvaluatorConfig;
  private readonly model: ChatGoogleGenerativeAI;
  private readonly parser: StructuredOutputParser<typeof evaluationSchema>;

  constructor(config: LLMEvaluatorConfig = {}) {
    this.config = {
      model: "gemini-2.0-flash-lite",
      temperature: 0.3,
      ...config
    };

    this.model = new ChatGoogleGenerativeAI({
      model: this.config.model || "gemini-2.0-flash-lite",
      temperature: this.config.temperature,
      streaming: false,
      maxRetries: 0,
      json: true,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    });

    this.parser = StructuredOutputParser.fromZodSchema(evaluationSchema);
  }

  /**
   * Build dynamic prompt based on enabled rules
   */
  private buildPrompt(enabledRules: SubjectiveRuleConfig[]): string {
    const rulesDescription = enabledRules
      .map(rule => `${rule.name}:\n${rule.criteria.map(criterion => `- ${criterion}`).join('\n')}`)
      .join('\n\n');

    return `You are a professional resume evaluation expert. Please evaluate the following resume by analyzing each section individually and then providing an overall assessment.

Evaluation criteria for each section:

${rulesDescription}

IMPORTANT: You must evaluate each section (Personal Information, Education, Employment, Skills) individually and provide specific feedback for each one. Then provide an overall assessment that considers how well all sections work together.
CRITICAL: For Education, Employment, and Skills sections, you must evaluate each individual block/entry separately and return an array of evaluations. Each block should have its own score, message, and suggestions.

Please provide a comprehensive evaluation with scores (0-100) and specific suggestions for each section, plus an overall assessment.

Resume Content:
{resumeContent}

{format_instructions}`;
  }

  /**
   * Evaluate entire resume using LLM with dynamic rules
   * @param resumeData Complete resume data to evaluate
   * @param rules Custom rules configuration (optional)
   * @returns Promise<EvaluationSchemaType>
   */
  async evaluateResume(
    resumeData: ResumeData,
    rules?: Record<string, SubjectiveRuleConfig>
  ): Promise<EvaluationSchemaType> {
    try {
      const ruleConfig = rules || DEFAULT_SUBJECTIVE_RULES;
      const enabledRules = Object.values(ruleConfig).filter(rule => rule.enabled);

      if (enabledRules.length === 0) {
        throw new Error("No subjective rules enabled for evaluation");
      }

      const prompt = this.buildPrompt(enabledRules);

      const chain = RunnableSequence.from([
        ChatPromptTemplate.fromTemplate(prompt),
        this.model,
        this.parser,
      ]);

      // Convert resume data to text format
      const resumeContent = `
Personal Information:
Name: ${resumeData.personalInfo?.firstName || ''} ${resumeData.personalInfo?.lastName || ''}
Email: ${resumeData.personalInfo?.email || ''}
Phone: ${resumeData.personalInfo?.phone || ''}
Website: ${resumeData.personalInfo?.website || 'Not provided'}
LinkedIn: ${resumeData.personalInfo?.linkedin || 'Not provided'}

Education Experience:
${resumeData.education?.blocks?.map((edu: EducationBlock, index: number) => 
  `Education Block ${index + 1}:\n${edu.school} - ${edu.degree}\n${edu.content} [${edu.start} ~ ${edu.end}]`
).join('\n\n') || 'None'}

Employment Experience:
${resumeData.employment?.blocks?.map((emp: EmploymentBlock, index: number) => 
  `Employment Block ${index + 1}:\n${emp.company} - ${emp.jobTitle}\n${emp.content}`
).join('\n\n') || 'None'}

Skills:
${resumeData.skills?.blocks?.map((skill: SkillBlock, index: number) => 
  `Skills Block ${index + 1}:\n${skill.group}: ${skill.content}`
).join('\n\n') || 'None'}
`;

      const result = await chain.invoke({
        resumeContent,
        format_instructions: this.parser.getFormatInstructions(),
      }) as EvaluationSchemaType;

      return result;
    } catch (error) {
      throw new Error(`LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default rules configuration
   */
  getDefaultRules(): Record<string, SubjectiveRuleConfig> {
    return { ...DEFAULT_SUBJECTIVE_RULES };
  }
}

// Create default LLM evaluator instance
export const defaultLLMEvaluator = new LLMEvaluator();
