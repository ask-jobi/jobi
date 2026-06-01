import { wrapLanguageModel } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { gateway } from "@ai-sdk/gateway"
import { devToolsMiddleware } from "@ai-sdk/devtools"

// Gateway-first is the canonical production path.
// The direct deepseek provider is a fallback for local development
// when AI_GATEWAY_API_KEY is not configured.
const baseModel = process.env.AI_GATEWAY_API_KEY
  ? gateway("deepseek/deepseek-v4-flash")
  : (() => {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "AI_GATEWAY_API_KEY not set, falling back to direct deepseek provider."
        )
      }
      return deepseek("deepseek-v4-flash")
    })()

// npx @ai-sdk/devtools 可查看 LLM 调用情况
export const model =
  process.env.NODE_ENV === "production"
    ? baseModel
    : wrapLanguageModel({
        model: baseModel,
        middleware: devToolsMiddleware()
      })
