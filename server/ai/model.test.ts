/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockDeepseek = vi.fn((modelId: string) => ({
  provider: "deepseek",
  modelId
}))
const mockWrapLanguageModel = vi.fn(({ model }) => ({
  provider: "wrapped",
  model
}))
const mockDevToolsMiddleware = vi.fn(() => ({ name: "devtools" }))

vi.mock("@ai-sdk/deepseek", () => ({
  deepseek: mockDeepseek
}))

vi.mock("ai", () => ({
  wrapLanguageModel: mockWrapLanguageModel
}))

vi.mock("@ai-sdk/devtools", () => ({
  devToolsMiddleware: mockDevToolsMiddleware
}))

describe("server AI model", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.DEEPSEEK_API_KEY
    process.env.NODE_ENV = "test"
  })

  it("uses the direct DeepSeek provider model", async () => {
    const { model } = await import("./model")

    expect(mockDeepseek).toHaveBeenCalledWith("deepseek-v4-flash")
    expect(model).toEqual({
      provider: "wrapped",
      model: { provider: "deepseek", modelId: "deepseek-v4-flash" }
    })
  })

  it("allows the direct DeepSeek model id to be configured", async () => {
    process.env.DEEPSEEK_MODEL_ID = "deepseek-chat"

    await import("./model")

    expect(mockDeepseek).toHaveBeenCalledWith("deepseek-chat")
  })
})
