import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { REWRITE_PROMPT } from "./prompts";
import {locales} from "@/lib/i18n/config";

const rewriteResponseSchema = z.object({
  optimizedContent: z.string().describe("改写后的内容"),
  highlight: z.array(z.string()).describe("AI 认为的重点高亮"),
  aiReason: z.string().describe("AI 优化理由说明"),
});

const LanguageEnum = z.enum(locales);
type Language = z.infer<typeof LanguageEnum>;

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash-lite",
  temperature: 0.7,
  streaming: false,
  maxRetries: 3,
  json: true,
})

const parser = StructuredOutputParser.fromZodSchema(rewriteResponseSchema)
const chain = RunnableSequence.from([
  ChatPromptTemplate.fromTemplate(REWRITE_PROMPT),
  model,
  parser,
])

export const rewriteBlock = async (params: {
  resumeSection: string
  originalContent: string;
  section: string;
  jd: string;
  instruction: string;
  language: Language;
}) => {
  const validatedLanguage = LanguageEnum.parse(params.language);

  const result = await chain.invoke({
    resumeSection: params.resumeSection,
    originalContent: params.originalContent,
    section: params.section,
    jd: params.jd,
    instruction: params.instruction,
    language: validatedLanguage === "zh" ? "中文" : "英文",
    format_instructions: parser.getFormatInstructions(),
  });

  return rewriteResponseSchema.parse(result);
}
