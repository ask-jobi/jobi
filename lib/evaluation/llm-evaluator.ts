import { EvaluationResult, LLMEvaluatorConfig } from './types';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// Evaluation result schema for structured output
const evaluationSchema = z.object({
  passed: z.boolean().describe("Whether the content passes the evaluation criteria"),
  score: z.number().min(0).max(100).describe("Evaluation score from 0 to 100"),
  message: z.string().describe("Brief evaluation message"),
  suggestion: z.string().describe("Specific suggestions for improvement")
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
   * Evaluate text content using LLM
   * @param content Content to evaluate
   * @param evaluationPrompt Evaluation prompt
   * @param ruleName Rule name
   * @returns Promise<EvaluationResult>
   */
  async evaluateContent(
    content: string,
    evaluationPrompt: string,
    ruleName: string
  ): Promise<EvaluationResult> {
    try {
      const chain = RunnableSequence.from([
        ChatPromptTemplate.fromTemplate(`
You are a professional resume evaluation expert. Please evaluate resume content according to the given criteria.

{evaluationPrompt}

Content to evaluate: {content}

{format_instructions}
`),
        this.model,
        this.parser,
      ]);

      const result = await chain.invoke({
        evaluationPrompt,
        content,
        format_instructions: this.parser.getFormatInstructions(),
      }) as EvaluationSchemaType;

      return {
        passed: result.passed,
        ruleName,
        message: result.message,
        suggestion: result.suggestion,
        score: result.score,
        type: 'subjective'
      };
    } catch (error) {
      return {
        passed: false,
        ruleName,
        message: `LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'subjective'
      };
    }
  }
}

// Predefined evaluation prompts
export const EVALUATION_PROMPTS = {
  // Employment content clarity evaluation
  EMPLOYMENT_CLARITY: `
Please evaluate the clarity and professionalism of the following employment description:

Evaluation criteria:
1. Whether the content is clearly expressed and logically coherent
2. Whether appropriate professional terminology is used
3. Whether descriptions are specific rather than vague
4. Whether key achievements and skills are highlighted

Please provide a score (0-100) and suggestions.
`,

  // Skill description evaluation
  SKILL_DESCRIPTION: `
Please evaluate the quality of the following skill description:

Evaluation criteria:
1. Whether skills match common industry classifications
2. Whether descriptions are specific rather than overly vague
3. Whether actual application of skills is demonstrated
4. Whether skill combinations are reasonable

Please provide a score (0-100) and suggestions.
`,

  // Project experience evaluation
  PROJECT_DESCRIPTION: `
Please evaluate the quality of the following project experience description:

Evaluation criteria:
1. Whether project description is clear and understandable
2. Whether personal contributions and achievements are highlighted
3. Whether technical stack description is accurate
4. Whether results are quantifiable

Please provide a score (0-100) and suggestions.
`
};

// Create default LLM evaluator instance
export const defaultLLMEvaluator = new LLMEvaluator();
