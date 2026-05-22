/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResumeRightPanel } from "../resume-right-panel"

const mockSetRightPanelView = vi.fn()
const mockUseApplicationResume = vi.fn()
const mockUseAtom = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("jotai/index", () => ({
  useAtom: () => mockUseAtom()
}))

vi.mock("@/lib/store/resume", () => ({
  rightPanelViewAtom: {},
  useApplicationResume: () => mockUseApplicationResume()
}))

vi.mock("@/lib/hooks/use-chat-session", () => ({
  useChatSession: vi.fn()
}))

vi.mock("@/components/agent/chat-interface", () => ({
  ChatInterface: () => <div>chat-interface</div>
}))

vi.mock("@/components/client-components/evaluation-report", () => ({
  EvaluationReport: () => <div>evaluation-report</div>
}))

describe("ResumeRightPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApplicationResume.mockReturnValue({
      selectedSectionId: "personalInfo",
      resumeEvaluation: null,
      refreshEvaluationReport: vi.fn()
    })
  })

  it("renders the right panel header actions on the evaluation view", () => {
    mockUseAtom.mockReturnValue(["evaluation", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    expect(
      screen.getByRole("button", { name: "button.aiChat" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "evaluationTabLabel" })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "evaluateResume" })
    ).toHaveLength(2)
  })

  it("switches to chat from the header action", () => {
    mockUseAtom.mockReturnValue(["evaluation", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    fireEvent.click(screen.getByRole("button", { name: "button.aiChat" }))

    expect(mockSetRightPanelView).toHaveBeenCalledWith("chat")
  })

  it("shows the current evaluation report on first render when one already exists", () => {
    mockUseAtom.mockReturnValue(["evaluation", mockSetRightPanelView])
    mockUseApplicationResume.mockReturnValue({
      selectedSectionId: "personalInfo",
      resumeEvaluation: {
        gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
        gaps: [],
        actions: []
      },
      refreshEvaluationReport: vi.fn()
    })

    render(<ResumeRightPanel />)

    expect(screen.getByText("evaluation-report")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "refreshEvaluation" })
    ).toBeInTheDocument()
  })

  it("shows chat content when the chat view is active", () => {
    mockUseAtom.mockReturnValue(["chat", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    expect(screen.getByText("chat-interface")).toBeInTheDocument()
  })
})
