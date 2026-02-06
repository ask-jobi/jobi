import { createMinimax } from "vercel-minimax-ai-provider"
import { wrapLanguageModel } from "ai"
import { devToolsMiddleware } from "@ai-sdk/devtools"

const minimax = createMinimax({
  baseURL: "https://api.minimaxi.com/anthropic/v1",
  apiKey: process.env.MINIMAX_API_KEY
})

// npx @ai-sdk/devtools 可以查看llm调用情况
// 这里使用Minimax用于本地开发，如需要可以替换成openai/gemini
export const model = wrapLanguageModel({
  model: minimax("MiniMax-M2.5-highspeed"),
  middleware: devToolsMiddleware()
})
