/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Mock diff words
vi.mock("diff", () => ({
  diffWords: vi.fn(
    (_original: string, _optimized: string | null | undefined) => [
      { value: "Original content here", added: false, removed: false },
      { value: " added text", added: true, removed: false },
      { value: " removed", added: false, removed: true }
    ]
  )
}))

// Mock jotai
const mockAppendPatchHistory = vi.fn()
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai")
  return {
    ...actual,
    useSetAtom: (_atom: { toString(): string }) => mockAppendPatchHistory
  }
})

// Mock useTour
const mockRemoveStep = vi.fn()
vi.mock("@/components/client-components/tour", () => ({
  useTour: () => ({
    currentStep: 0,
    gotoStep: vi.fn(),
    previousStep: vi.fn(),
    nextStep: vi.fn(),
    removeStep: mockRemoveStep,
    insertStep: vi.fn(),
    steps: [{ selectorId: "test", content: () => <div>Test</div> }]
  })
}))

// Mock Button
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, className, "aria-label": ariaLabel }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}))

import SuggestionPatch from "../suggestion-patch"

const mockGetValues = vi.fn()
const mockSetValue = vi.fn()

describe("SuggestionPatch", () => {
  const defaultSuggestion = {
    section: "employment" as const,
    blockIndex: 0,
    originalContent: "Original content here",
    optimizedContent: "Optimized content here",
    reason: "This is a better way to phrase it",
    suggestionType: "rewrite" as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetValues.mockReturnValue({
      employment: {
        blocks: [{ content: "Original content here" }]
      }
    })
  })

  it("should render suggestion patch with reason and diff", () => {
    render(
      <SuggestionPatch
        section={defaultSuggestion}
        getValues={mockGetValues as any}
        setValue={mockSetValue as any}
      />
    )

    expect(
      screen.getByText("This is a better way to phrase it")
    ).toBeInTheDocument()
    expect(screen.getByText("added text")).toBeInTheDocument()
    expect(screen.getByText("removed")).toBeInTheDocument()
  })

  it("should render Apply and Reject buttons", () => {
    render(
      <SuggestionPatch
        section={defaultSuggestion}
        getValues={mockGetValues as any}
        setValue={mockSetValue as any}
      />
    )

    expect(screen.getByText("Apply")).toBeInTheDocument()
    expect(screen.getByText("Reject")).toBeInTheDocument()
  })

  it("should handle Apply click", () => {
    render(
      <SuggestionPatch
        section={defaultSuggestion}
        getValues={mockGetValues as any}
        setValue={mockSetValue as any}
      />
    )

    const applyButton = screen.getByText("Apply")
    fireEvent.click(applyButton)

    expect(mockAppendPatchHistory).toHaveBeenCalled()
    expect(mockSetValue).toHaveBeenCalled()
  })

  it("should handle Reject click", () => {
    render(
      <SuggestionPatch
        section={defaultSuggestion}
        getValues={mockGetValues as any}
        setValue={mockSetValue as any}
      />
    )

    const rejectButton = screen.getByText("Reject")
    fireEvent.click(rejectButton)

    expect(mockAppendPatchHistory).toHaveBeenCalled()
  })

  it("should highlight added text with green background", () => {
    render(
      <SuggestionPatch
        section={defaultSuggestion}
        getValues={mockGetValues as any}
        setValue={mockSetValue as any}
      />
    )

    const addedText = screen.getByText("added text")
    expect(addedText.closest("span")).toHaveClass("bg-green-200")
  })

  it("should highlight removed text with red background", () => {
    render(
      <SuggestionPatch
        section={defaultSuggestion}
        getValues={mockGetValues as any}
        setValue={mockSetValue as any}
      />
    )

    const removedText = screen.getByText("removed")
    expect(removedText.closest("span")).toHaveClass("bg-red-200")
  })
})
