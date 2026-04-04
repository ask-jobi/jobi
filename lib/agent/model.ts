import { google } from "@ai-sdk/google"
import { wrapLanguageModel } from "ai"
import { devToolsMiddleware } from "@ai-sdk/devtools"

// npx @ai-sdk/devtools 可以查看llm调用情况
// 这里使用Minimax用于本地开发，如需要可以替换成openai/gemini
export const model = wrapLanguageModel({
  model: google("gemini-2.5-pro"),
  middleware: devToolsMiddleware()
})
