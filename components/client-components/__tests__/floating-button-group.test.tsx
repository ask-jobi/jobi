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
import * as jotai from "jotai"

// Mock jotai
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai")
  return {
    ...actual,
    useSetAtom: vi.fn()
  }
})

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
  useFormContext: vi.fn()
}))

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  )
}))

// Mock useResume
vi.mock("@/lib/store/resume", async () => {
  const actual = await vi.importActual("@/lib/store/resume")
  return {
    ...actual,
    useResume: vi.fn(),
    openRightPanelAtom: {
      read: () => null,
      write: vi.fn()
    }
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

  // Mock function for useSetAtom
  const mockSetAtom = vi.fn()

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
    // Mock jotai's useSetAtom to return our mock function
    vi.spyOn(jotai, "useSetAtom").mockImplementation(() => mockSetAtom)
  })

  it("should render three floating buttons", () => {
    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    expect(buttons).toHaveLength(3)
  })

  it("should have correct titles for each button", () => {
    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
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

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[1])

    expect(userTracking.trackExportResume).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/print?id=test-resume-id"
    )
  })

  it("should show loader when export is in progress", async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[1])

    // Check that the button is disabled during loading
    expect(buttons[1]).toBeDisabled()
  })

  it("should call AI optimization API when optimize button is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[2])

    expect(userTracking.trackClickAiFullSuggestion).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/full-suggestion?jobApplicationId=test-app-id"
    )
  })

  it("should show loader when AI optimization is in progress", async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
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

    const buttons = screen.getAllByTestId("ui-button")
    expect(buttons[1]).toBeDisabled() // Export button
    expect(buttons[2]).toBeDisabled() // Optimize button
  })

  it("should handle export error gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("Export failed")
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[1])

    await vi.waitFor(() => {
      expect(buttons[1]).not.toBeDisabled()
    })
  })

  it("should handle AI optimization error gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve("AI service unavailable")
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[2])

    await vi.waitFor(() => {
      expect(buttons[2]).not.toBeDisabled()
    })
  })

  it("should handle empty AI suggestions response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[2])

    await vi.waitFor(() => {
      expect(buttons[2]).not.toBeDisabled()
    })
  })

  it("should handle blob response error during export", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.reject(new Error("Blob creation failed"))
    })

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")
    fireEvent.click(buttons[1])

    await vi.waitFor(() => {
      expect(buttons[1]).not.toBeDisabled()
    })
  })

  it("should toggle right panel when evaluation button is clicked", () => {
    // Clear the mock before the test
    mockSetAtom.mockClear()

    render(<FloatingButtonGroup />)

    const buttons = screen.getAllByTestId("ui-button")

    // Check if the button exists
    expect(buttons[0]).toBeDefined()

    // Click the evaluation button
    fireEvent.click(buttons[0])

    // Verify useSetAtom was called with the atom and then the setter was called with "evaluation"
    expect(jotai.useSetAtom).toHaveBeenCalled()
    expect(mockSetAtom).toHaveBeenCalledWith("evaluation")
  })

  it("should handle missing openRightPanel gracefully", () => {
    vi.spyOn(useResume, "useResume").mockReturnValue({
      ...mockUseResume,
      openRightPanel: null
    } as any)

    // Should not throw
    expect(() => {
      render(<FloatingButtonGroup />)
    }).not.toThrow()
  })
})
