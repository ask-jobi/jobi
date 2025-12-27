import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { resumeRewritePrompt } from "./prompts/resume-rewrite.prompt";
import { locales } from "@/lib/i18n/config";

const rewriteResponseSchema = z.object({
  optimizedContent: z.string().describe("改写后的内容"),
  highlight: z.array(z.string()).describe("AI 认为的重点高亮"),
  aiReason: z.string().describe("AI 优化理由说明"),
});

const LanguageEnum = z.enum(locales);
type Language = z.infer<typeof LanguageEnum>;


export const rewriteBlock = async (params: {
  resumeSection: string
  originalContent: string;
  section: string;
  jd: string;
  instruction: string;
  language: Language;
}) => {
  const validatedLanguage = LanguageEnum.parse(params.language);
  const languageText = validatedLanguage === "zh" ? "中文" : "英文";

  const prompt = resumeRewritePrompt.format({
    section: params.section,
    resumeSection: params.resumeSection,
    originalContent: params.originalContent,
    jd: params.jd,
    instruction: params.instruction,
    language: languageText,
  });

  const { output: result } = await generateText({
    model: google("gemini-2.0-flash-lite"),
    output: Output.object({
      schema: rewriteResponseSchema
    }),
    prompt,
    temperature: 0.7,
    maxRetries: 3,
  });

  return result;
}
