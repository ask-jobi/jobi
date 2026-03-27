/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EvaluationReport } from "../evaluation-report"

const mockOpenRightPanel = vi.fn()
const mockSetPendingChatHandoff = vi.fn()
const mockTrackClickAiFullSuggestion = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    if (namespace === "chat" && key === "askToOptimizeResume") {
      return "让我帮您优化简历..."
    }

    return key
  }
}))

vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai")
  return {
    ...actual,
    useSetAtom: vi.fn(() => mockOpenRightPanel)
  }
})

vi.mock("@/lib/store/resume", async () => {
  const actual = await vi.importActual("@/lib/store/resume")
  return {
    ...actual,
    useResume: () => ({
      application: {
        resume: {
          id: "resume-123"
        }
      },
      refreshEvaluationReport: vi.fn()
    }),
    openRightPanelAtom: {}
  }
})

vi.mock("@/lib/store/chat", () => ({
  useSetPendingChatHandoff: () => mockSetPendingChatHandoff
}))

vi.mock("@/lib/user-tracking/user-tracking", () => ({
  trackClickAiFullSuggestion: () => mockTrackClickAiFullSuggestion()
}))

describe("EvaluationReport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should hand off one-click optimize to chat", () => {
    render(
      <EvaluationReport
        evaluation={{
          gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
          gaps: [],
          actions: []
        }}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "oneClickOptimize" }))

    expect(mockTrackClickAiFullSuggestion).toHaveBeenCalled()
    expect(mockOpenRightPanel).toHaveBeenCalledWith("chat")
    expect(mockSetPendingChatHandoff).toHaveBeenCalledTimes(1)
    expect(mockSetPendingChatHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeId: "resume-123",
        message: "让我帮您优化简历..."
      })
    )
  })
})
