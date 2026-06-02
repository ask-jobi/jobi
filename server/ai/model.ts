import { wrapLanguageModel } from "ai"
import { deepseek } from "@ai-sdk/deepseek"
import { devToolsMiddleware } from "@ai-sdk/devtools"

const modelId = process.env.DEEPSEEK_MODEL_ID ?? "deepseek-v4-flash"
const baseModel = deepseek(modelId)

// npx @ai-sdk/devtools 可查看 LLM 调用情况
export const model =
  process.env.NODE_ENV === "production"
    ? baseModel
    : wrapLanguageModel({
        model: baseModel,
        middleware: devToolsMiddleware()
      })
