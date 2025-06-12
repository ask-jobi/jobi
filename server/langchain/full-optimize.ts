import { AISuggestion, AISuggestionQueue, ResumeData } from "@/types/resume";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AI_OPTIMIZE_PROMPT } from "./prompts";
import z from "zod";

const optimizeSuggestionSchema = z.object({
  shouldOptimize: z.boolean(),
  suggestionType: z.string().optional(),
  reason: z.string().optional(),
  optimizedContent: z.string().optional(),
  highlight: z.array(z.string()).optional()
});

// 模拟 AI 分析（LangChain/LLM Prompt 封装后调用）
async function analyzeBlock(
  section: string,
  blockIndex: number,
  content: string
): Promise<AISuggestion | null> {
  // 调用 LLM，生成分析结果
  // 若无需优化，返回 null；若需要，返回建议结构
  const aiResult = await callLangChainLLM(section, content);
  if (!aiResult?.shouldOptimize) return null;
  return {
    section: section as "education" | "employment" | "skill",
    blockIndex,
    suggestionType: aiResult.suggestionType || "",
    reason: aiResult?.reason || "",
    originalContent: content,
    optimizedContent: aiResult?.optimizedContent || "",
    highlight: aiResult?.highlight,
  };
}

const promptTemplate = new PromptTemplate({
  template: AI_OPTIMIZE_PROMPT,
  inputVariables: ["content", "section"],
});
// TODO: 修改控制返回结构化的代码，使用 zod 解析校验
async function callLangChainLLM(section: string, content: string) {
  const prompt = await promptTemplate.format({ content, section });
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.3,
  });
  model.withStructuredOutput(optimizeSuggestionSchema);
  const response = await model.invoke(prompt);
  let parsed;
  try {
    // 确保返回的是有效的 JSON 字符串
    const jsonStr = response.content.toString().trim()
      .replace(/^```json\n/, '')
      .replace(/```$/, '')
      .trim();
    const jsonObj = JSON.parse(jsonStr);
    parsed = optimizeSuggestionSchema.parse(jsonObj);
  } catch (err) {
    console.error("AI 输出解析错误:", err);
    throw new Error("AI 输出格式异常：" + response.content);
  }
  return parsed;
}

export async function generateAISuggestionQueue(
  resume: ResumeData
): Promise<AISuggestionQueue> {
  const tasks: Promise<AISuggestion | null>[] = [];

  // 教育
  resume.educationHistory.blocks.forEach((block, idx) => {
    tasks.push(analyzeBlock("education", idx, block.content));
  });
  // 工作
  resume.employmentHistory.blocks.forEach((block, idx) => {
    tasks.push(analyzeBlock("employment", idx, block.content));
  });
  // 技能（每组技能也可以分块分析）
  resume.skills.blocks.forEach((block, idx) => {
    block.content.forEach((skillContent, subIdx) => {
      tasks.push(analyzeBlock("skill", idx, skillContent));
    });
  });

  // 并行处理，过滤 null（无建议）
  const results = (await Promise.all(tasks)).filter(
    Boolean
  ) as AISuggestionQueue;
  return results;
}

