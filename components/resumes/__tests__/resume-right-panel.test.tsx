/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResumeRightPanel } from "../resume-right-panel"

const mockSetRightPanelView = vi.fn()
const mockUseResume = vi.fn()
const mockUseAtom = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("jotai/index", () => ({
  useAtom: () => mockUseAtom()
}))

vi.mock("@/lib/store/resume", () => ({
  rightPanelViewAtom: {},
  useResume: () => mockUseResume()
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

vi.mock("@/components/forms/personal-info-form", () => ({
  PersonalInfoForm: () => <div>personal-info-form</div>
}))

vi.mock("@/components/forms/education-form", () => ({
  EducationForm: () => <div>education-form</div>
}))

vi.mock("@/components/forms/employment-form", () => ({
  EmploymentForm: () => <div>employment-form</div>
}))

vi.mock("@/components/forms/skills-form", () => ({
  SkillsForm: () => <div>skills-form</div>
}))

vi.mock("@/components/forms/projects-form", () => ({
  ProjectsForm: () => <div>projects-form</div>
}))

vi.mock("@/components/forms/research-form", () => ({
  ResearchForm: () => <div>research-form</div>
}))

vi.mock("@/components/forms/publications-form", () => ({
  PublicationsForm: () => <div>publications-form</div>
}))

vi.mock("@/components/forms/awards-form", () => ({
  AwardsForm: () => <div>awards-form</div>
}))

vi.mock("@/components/forms/certifications-form", () => ({
  CertificationsForm: () => <div>certifications-form</div>
}))

describe("ResumeRightPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseResume.mockReturnValue({
      selectedSectionId: "personalInfo",
      resumeEvaluation: null,
      refreshEvaluationReport: vi.fn()
    })
  })

  it("renders the right panel header actions on the form view", () => {
    mockUseAtom.mockReturnValue(["form", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    expect(
      screen.getByRole("button", { name: "button.aiChat" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "evaluationTabLabel" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("personalInfo")).toHaveLength(2)
    expect(screen.getByText("personal-info-form")).toBeInTheDocument()
  })

  it("shows the empty state when no section is selected on the form view", () => {
    mockUseResume.mockReturnValue({
      selectedSectionId: null,
      resumeEvaluation: null,
      refreshEvaluationReport: vi.fn()
    })
    mockUseAtom.mockReturnValue(["form", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    expect(screen.getByText("formEmptyTitle")).toBeInTheDocument()
  })

  it("switches to chat from the header action", () => {
    mockUseAtom.mockReturnValue(["form", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    fireEvent.click(screen.getByRole("button", { name: "button.aiChat" }))

    expect(mockSetRightPanelView).toHaveBeenCalledWith("chat")
  })

  it("shows chat content when the chat view is active", () => {
    mockUseAtom.mockReturnValue(["chat", mockSetRightPanelView])

    render(<ResumeRightPanel />)

    expect(screen.getByText("chat-interface")).toBeInTheDocument()
  })
})
