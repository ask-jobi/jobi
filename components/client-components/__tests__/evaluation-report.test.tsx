/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { EvaluationReport } from "../evaluation-report"
import * as useResume from "@/lib/store/resume"
import * as reactHookForm from "react-hook-form"
import * as tour from "../tour"
import * as userTracking from "@/lib/user-tracking/user-tracking"

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
  useFormContext: vi.fn()
}))

// Mock jotai
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai")
  return {
    ...actual,
    useSetAtom: vi.fn()
  }
})

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  )
}))

vi.mock("../skeletons/skeleton-card", () => ({
  default: () => <div data-testid="skeleton-card" />
}))

vi.mock("../tour", () => ({
  useTour: vi.fn(),
  TourStep: vi.fn()
}))

describe("EvaluationReport", () => {
  const mockEvaluation: import("@/types/evaluation").ResumeEvaluationOutput = {
    gates: {
      ats: "pass",
      hr: "borderline",
      hiringManager: "fail"
    },
    gaps: [
      {
        dimension: "experience",
        severity: "critical",
        description: "Lack of relevant experience",
        evidence: "No experience in required technologies"
      }
    ],
    actions: [
      {
        targetSection: "work_experience",
        priority: "1",
        instruction: "Rewrite summary to highlight relevant experience"
      }
    ]
  }

  const mockUseResume = {
    refreshEvaluationReport: vi.fn(),
    application: { id: "test-app-id" },
    resumeData: {},
    isLoading: false,
    setLoading: vi.fn(),
    updateResumeData: vi.fn(),
    refreshResumeData: vi.fn(),
    job: null,
    updateJob: vi.fn(),
    resumeEvaluation: null,
    updateResumeEvaluation: vi.fn(),
    refreshJob: vi.fn(),
    refreshApplication: vi.fn()
  } as any

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
      defaultValues: {}
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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(useResume, "useResume").mockImplementation(() => mockUseResume)
    vi.spyOn(reactHookForm, "useFormContext").mockImplementation(
      () => mockUseFormContext
    )
    vi.spyOn(tour, "useTour").mockImplementation(() => mockUseTour)
    vi.spyOn(userTracking, "trackClickAiFullSuggestion").mockImplementation(
      () => {}
    )
  })

  it("should render evaluation report with gates, gaps, and actions", () => {
    render(<EvaluationReport evaluation={mockEvaluation} />)

    // Check gates section
    expect(screen.getByText("screeningReadiness")).toBeInTheDocument()
    expect(screen.getByText("gates.atsScreening")).toBeInTheDocument()
    expect(screen.getByText("gates.hrScan")).toBeInTheDocument()
    expect(screen.getByText("gates.hiringManagerFit")).toBeInTheDocument()

    // Check gaps section
    expect(screen.getByText("gaps")).toBeInTheDocument()
    expect(screen.getByText("Lack of relevant experience")).toBeInTheDocument()
    expect(
      screen.getByText("No experience in required technologies")
    ).toBeInTheDocument()

    // Check actions section
    expect(screen.getByText("actions")).toBeInTheDocument()
    expect(
      screen.getByText("Rewrite summary to highlight relevant experience")
    ).toBeInTheDocument()
  })

  it("should call refreshEvaluationReport when refresh button is clicked", () => {
    render(<EvaluationReport evaluation={mockEvaluation} />)

    const refreshButton = screen.getByRole("button", {
      name: "refreshEvaluation"
    })
    fireEvent.click(refreshButton)

    expect(mockUseResume.refreshEvaluationReport).toHaveBeenCalled()
  })

  it("should call full resume optimization when optimize button is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    render(<EvaluationReport evaluation={mockEvaluation} />)

    const optimizeButton = screen.getByRole("button", {
      name: "oneClickOptimize"
    })
    await fireEvent.click(optimizeButton)

    expect(userTracking.trackClickAiFullSuggestion).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/resume/full-suggestion?jobApplicationId=test-app-id"
    )
  })

  it("should show skeleton cards when loading", () => {
    render(<EvaluationReport evaluation={mockEvaluation} />)

    const refreshButton = screen.getByRole("button", {
      name: "refreshEvaluation"
    })
    fireEvent.click(refreshButton)

    expect(screen.getAllByTestId("card")).toHaveLength(4)
  })
})
