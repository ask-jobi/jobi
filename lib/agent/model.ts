import { gateway, wrapLanguageModel } from "ai"

// npx @ai-sdk/devtools 可以查看llm调用情况
// 这里使用Minimax用于本地开发，如需要可以替换成openai/gemini
const baseModel = gateway("minimax/minimax-m2.7")

export const model =
  process.env.NODE_ENV === "development"
    ? wrapLanguageModel({
        model: baseModel,
        middleware: (await import("@ai-sdk/devtools")).devToolsMiddleware()
      })
    : baseModel
