import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { REWRITE_PROMPT } from "./prompts";

const rewriteResponseSchema = z.object({
  optimizedContent: z.string().describe("改写后的内容"),
  highlight: z.array(z.string()).describe("AI 认为的重点高亮"),
  aiReason: z.string().describe("AI 优化理由说明"),
});

const LanguageEnum = z.enum(["zh", "en"]);
type Language = z.infer<typeof LanguageEnum>;

export class ResumeRewriter {
  private static instance: ResumeRewriter;
  private readonly model: ChatGoogleGenerativeAI;
  private readonly parser: StructuredOutputParser<typeof rewriteResponseSchema>;
  private chain: RunnableSequence;

  private constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-lite",
      temperature: 0.7,
      streaming: false,
      maxRetries: 3,
      json: true,
    });

    this.parser = StructuredOutputParser.fromZodSchema(rewriteResponseSchema);

    this.chain = RunnableSequence.from([
      ChatPromptTemplate.fromTemplate(REWRITE_PROMPT),
      this.model,
      this.parser,
    ]);
  }

  static getInstance(): ResumeRewriter {
    if (!ResumeRewriter.instance) {
      ResumeRewriter.instance = new ResumeRewriter();
    }
    return ResumeRewriter.instance;
  }

  async rewriteBlock(params: {
    originalContent: string;
    resumeSummary?: string;
    resumeGoal?: string;
    jd: string;
    relatedSkills?: string[];
    instruction: string;
    language: Language;
  }) {
    const validatedLanguage = LanguageEnum.parse(params.language);

    const result = await this.chain.invoke({
      originalContent: params.originalContent,
      resumeSummary: params.resumeSummary || "",
      resumeGoal: params.resumeGoal || "",
      jd: params.jd,
      relatedSkills: params.relatedSkills?.join(", ") || "",
      instruction: params.instruction,
      language: validatedLanguage === "zh" ? "中文" : "英文",
      format_instructions: this.parser.getFormatInstructions(),
    });

    return rewriteResponseSchema.parse(result);
  }
} 