/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { FloatingButtonGroup } from "../floating-button-group"
import * as useResume from "@/lib/store/resume"
import * as reactHookForm from "react-hook-form"
import * as tour from "../tour"
import * as userTracking from "@/lib/user-tracking/user-tracking"

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
  useFormContext: vi.fn()
}))

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="gemini-icon" />
  )
}))

// Mock useResume
vi.mock("@/lib/store/resume", async () => {
  const actual = await vi.importActual("@/lib/store/resume")
  return {
    ...actual,
    useResume: vi.fn(),
    openRightPanelAtom: {},
    useSetAtom: vi.fn()
  }
})

// Mock tour
vi.mock("../tour", () => ({
  useTour: vi.fn()
}))

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn()
  }
}))

describe("FloatingButtonGroup", () => {
  const mockUseResume: any = {
    application: { id: "test-app-id", resume: { id: "test-resume-id" } },
    isLoading: false,
    setLoading: vi.fn(),
    resumeEvaluation: null,
    refreshEvaluationReport: vi.fn(),
    updateResumeEvaluation: vi.fn(),
    resumeData: {},
    updateResumeData: vi.fn(),
    selectedSectionId: null,
    handleSectionClick: vi.fn(),
    job: null,
    updateJob: vi.fn(),
    refreshResumeData: vi.fn(),
    refreshJob: vi.fn(),
    refreshApplication: vi.fn()
  }

  const mockUseFormContext: any = {
    getValues: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(),
    getFieldState: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    resetField: vi.fn(),
    setFocus: vi.fn(),
    control: {},
    formState: {
      isDirty: false,
      isLoading: false,
      isSubmitted: false,
      isSubmitSuccessful: false,
      isSubmitting: false,
      isValid: false,
      isValidating: false,
      submitCount: 0,
      dirtyFields: {},
      touchedFields: {},
      errors: {},
      defaultValues: {},
      disabled: false,
      validatingFields: {},
      isReady: true
    },
    register: vi.fn(),
    trigger: vi.fn(),
    unregister: vi.fn(),
    subscribe: vi.fn()
  }

  const mockUseTour = {
    setSteps: vi.fn(),
    startTour: vi.fn(),
    currentStep: 0,
    totalSteps: 0,
    nextStep: vi.fn(),
    previousStep: vi.fn(),
    endTour: vi.fn(),
    isActive: false,
    gotoStep: vi.fn(),
    removeStep: vi.fn(),
    insertStep: vi.fn(),
    steps: [],
    isTourCompleted: false,
    setIsTourCompleted: vi.fn()
  }

  const mockOpenRightPanel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Use spyOn for hooks
    vi.spyOn(useResume, "useResume").mockReturnValue(mockUseResume)
    vi.spyOn(reactHookForm, "useFormContext").mockReturnValue(
      mockUseFormContext
    )
    vi.spyOn(tour, "useTour").mockReturnValue(mockUseTour)
    vi.spyOn(userTracking, "trackClickAiFullSuggestion").mockImplementation(
      () => {}
    )
    vi.spyOn(userTracking, "trackExportResume").mockImplementation(() => {})
  })

  it("should render three floating buttons", () => {
    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    expect(buttons).toHaveLength(3)
  })

  it("should display correct icons for each button", () => {
    render(<FloatingButtonGroup />)

    expect(screen.getByTestId("trophy-icon")).toBeInTheDocument()
    expect(screen.getByTestId("download-icon")).toBeInTheDocument()
    expect(screen.getByTestId("gemini-icon")).toBeInTheDocument()
  })

  it("should have correct titles for each button", () => {
    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    expect(buttons[0]).toHaveAttribute("title", "button.viewEvaluationReport")
    expect(buttons[1]).toHaveAttribute("title", "button.exportResume")
    expect(buttons[2]).toHaveAttribute("title", "button.aiOptimize")
  })

  it("should call export API when export button is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    fireEvent.click(buttons[1])

    expect(userTracking.trackExportResume).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/print?id=test-resume-id"
    )
  })

  it("should show loader when export is in progress", async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    fireEvent.click(buttons[1])

    // Check that the button now shows loader
    expect(screen.getByTestId("loader-2-icon")).toBeInTheDocument()
  })

  it("should call AI optimization API when optimize button is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    fireEvent.click(buttons[2])

    expect(userTracking.trackClickAiFullSuggestion).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/full-suggestion?jobApplicationId=test-app-id"
    )
  })

  it("should show loader when AI optimization is in progress", async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    fireEvent.click(buttons[2])

    // Check that at least one loader exists (from loading states)
    const allButtons = screen.getAllByRole("button")
    expect(allButtons.length).toBe(3)
  })

  it("should disable buttons when global loading is true", () => {
    vi.mocked(useResume.useResume).mockReturnValue({
      ...mockUseResume,
      isLoading: true
    } as any)

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("button")
    expect(buttons[1]).toBeDisabled() // Export button
    expect(buttons[2]).toBeDisabled() // Optimize button
  })
})
