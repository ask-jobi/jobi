import { wrapLanguageModel } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { devToolsMiddleware } from "@ai-sdk/devtools"

// const baseModel = gateway("deepseek/deepseek-v4-flash")
const baseModel = deepseek("deepseek-v4-flash")

// npx @ai-sdk/devtools 可以查看llm调用情况
// 这里使用Minimax用于本地开发，如需要可以替换成openai/gemini
export const model =
  process.env.NODE_ENV === "production"
    ? baseModel
    : wrapLanguageModel({
        model: baseModel,
        middleware: devToolsMiddleware()
      })
