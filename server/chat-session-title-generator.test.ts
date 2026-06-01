/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { generateChatSessionTitle } from "@/server/ai/chat/session-title-generator"

vi.mock("ai", () => ({
  generateText: vi.fn()
}))

vi.mock("@/server/ai/model", () => ({
  model: {}
}))

describe("generateChatSessionTitle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return null when the user message has no text", async () => {
    const result = await generateChatSessionTitle([
      { type: "tool-resumeEditorModify", state: "output-available" }
    ] as never)

    expect(result).toBeNull()
  })

  it("should generate a normalized title with llm output", async () => {
    const aiModule = await import("ai")

    vi.mocked(aiModule.generateText).mockResolvedValue({
      output: '  "Tailor resume for product manager role"  '
    } as never)

    const result = await generateChatSessionTitle([
      {
        type: "text",
        text: "Please tailor my resume for a product manager role"
      }
    ] as never)

    expect(aiModule.generateText).toHaveBeenCalledOnce()
    expect(result).toBe("Tailor resume for product manager role")
  })
})
