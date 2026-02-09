/** @jest-environment jsdom */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { jest } from "@jest/globals"
import type { ResumeData } from "@/types/resume"

let EvaluationReport: typeof import("@/components/client-components/evaluation-report").EvaluationReport

const mockRefreshEvaluationReport = jest.fn()
const mockSetValue = jest.fn()
const mockGetValues = jest.fn()
const mockApplyResumeEditOps = jest.fn()
const mockToastError = jest.fn()

jest.unstable_mockModule("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) =>
    namespace ? `${namespace}.${key}` : key
}))

jest.unstable_mockModule("@/lib/store/resume", () => ({
  useResume: () => ({
    refreshEvaluationReport: mockRefreshEvaluationReport,
    application: { id: "job-app-123" }
  })
}))

jest.unstable_mockModule("react-hook-form", () => ({
  useFormContext: () => ({
    getValues: mockGetValues,
    setValue: mockSetValue
  })
}))

jest.unstable_mockModule("@/lib/resume/agent-ops", () => ({
  applyResumeEditOps: (...args: any[]) => mockApplyResumeEditOps(...args)
}))

jest.unstable_mockModule("@/lib/user-tracking/user-tracking", () => ({
  trackClickAiFullSuggestion: jest.fn()
}))

jest.unstable_mockModule("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockToastError(...args)
  }
}))

const baseResume: ResumeData = {
  personalInfo: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "123"
  },
  education: { title: "Education", order: 0, blocks: [] },
  employment: { title: "Employment", order: 1, blocks: [] },
  skills: { title: "Skills", order: 2, blocks: [] }
}

const evaluation = {
  gates: { ats: "pass", hr: "pass", hiringManager: "pass" },
  gaps: [],
  actions: []
}

const mockFetchResponse = (data: any) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  })

beforeEach(() => {
  jest.clearAllMocks()
  mockGetValues.mockReturnValue(baseResume)
  mockApplyResumeEditOps.mockReturnValue({ updatedResumeData: baseResume })
  ;(global as any).fetch = jest.fn()
})

beforeAll(async () => {
  const module =
    await import("@/components/client-components/evaluation-report")
  EvaluationReport = module.EvaluationReport
})

describe("EvaluationReport AI suggestions stepper", () => {
  it("renders op previews and highlights current item", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Updated" }
            },
            title: "updateBlock employment #0",
            before: "Old",
            after: "Updated"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))

    expect(
      await screen.findByText("evaluation.aiSuggestionsTitle")
    ).toBeTruthy()
    const item = screen.getByRole("button", {
      name: /updateBlock employment #0/
    })
    expect(item.closest("button")?.className).toContain("ring-2")
  })

  it("applies the selected op, not a different one", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Updated 1" }
            },
            title: "updateBlock employment #0",
            before: "Old",
            after: "Updated 1"
          },
          {
            opId: "skills-0-1",
            op: {
              op: "updateBlock",
              section: "skills",
              blockIndex: 0,
              payload: { content: "Updated 2" }
            },
            title: "updateBlock skills #0",
            before: "Old",
            after: "Updated 2"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", {
      name: /updateBlock employment #0/
    })

    fireEvent.click(
      screen.getByRole("button", { name: /updateBlock skills #0/ })
    )
    fireEvent.click(screen.getByText("evaluation.aiSuggestionsApply"))

    expect(mockApplyResumeEditOps).toHaveBeenCalledWith(baseResume, [
      expect.objectContaining({ section: "skills" })
    ])
    expect(
      screen.getByText("evaluation.aiSuggestionsStatus.applied")
    ).toBeTruthy()
    expect(mockSetValue).toHaveBeenCalled()
  })

  it("shows a no-change message when before and after are identical", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Same" }
            },
            title: "updateBlock employment #0",
            before: "Same",
            after: "Same"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))

    expect(
      await screen.findByText("evaluation.aiSuggestionsNoChange")
    ).toBeTruthy()
  })

  it("shows empty state when optimize returns no suggestions", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    expect(
      await screen.findByText("evaluation.aiSuggestionsEmpty")
    ).toBeTruthy()
  })

  it("marks an item as skipped", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Updated" }
            },
            title: "updateBlock employment #0",
            before: "Old",
            after: "Updated"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", {
      name: /updateBlock employment #0/
    })

    fireEvent.click(screen.getByText("evaluation.aiSuggestionsSkip"))
    expect(
      screen.getByText("evaluation.aiSuggestionsStatus.skipped")
    ).toBeTruthy()
  })

  it("moves to the next suggestion after applying", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Updated 1" }
            },
            title: "updateBlock employment #0",
            before: "Old",
            after: "Updated 1"
          },
          {
            opId: "skills-0-1",
            op: {
              op: "updateBlock",
              section: "skills",
              blockIndex: 0,
              payload: { content: "Updated 2" }
            },
            title: "updateBlock skills #0",
            before: "Old",
            after: "Updated 2"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", {
      name: /updateBlock employment #0/
    })

    fireEvent.click(screen.getByText("evaluation.aiSuggestionsApply"))

    const nextItem = screen.getByRole("button", {
      name: /updateBlock skills #0/
    })
    expect(nextItem.className).toContain("ring-2")
  })

  it("turns skip into undo after applying and restores previous data", async () => {
    const updatedResume = {
      ...baseResume,
      skills: {
        ...baseResume.skills,
        blocks: [{ group: "Skills", content: "Updated" }]
      }
    }
    mockApplyResumeEditOps.mockReturnValue({ updatedResumeData: updatedResume })
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "skills-0-0",
            op: {
              op: "updateBlock",
              section: "skills",
              blockIndex: 0,
              payload: { content: "Updated" }
            },
            title: "updateBlock skills #0",
            before: "Old",
            after: "Updated"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", { name: /updateBlock skills #0/ })

    fireEvent.click(screen.getByText("evaluation.aiSuggestionsApply"))

    expect(
      (screen.getByText("evaluation.aiSuggestionsApply") as HTMLButtonElement)
        .disabled
    ).toBe(true)
    expect(screen.getByText("evaluation.aiSuggestionsUndo")).toBeTruthy()

    fireEvent.click(screen.getByText("evaluation.aiSuggestionsUndo"))

    expect(screen.queryByText("evaluation.aiSuggestionsUndo")).toBeNull()
    expect(screen.getByText("evaluation.aiSuggestionsSkip")).toBeTruthy()
    expect(mockSetValue).toHaveBeenCalled()
  })

  it("moves to the next suggestion after skipping", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Updated 1" }
            },
            title: "updateBlock employment #0",
            before: "Old",
            after: "Updated 1"
          },
          {
            opId: "skills-0-1",
            op: {
              op: "updateBlock",
              section: "skills",
              blockIndex: 0,
              payload: { content: "Updated 2" }
            },
            title: "updateBlock skills #0",
            before: "Old",
            after: "Updated 2"
          }
        ],
        errors: []
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", {
      name: /updateBlock employment #0/
    })

    fireEvent.click(screen.getByText("evaluation.aiSuggestionsSkip"))

    const nextItem = screen.getByRole("button", {
      name: /updateBlock skills #0/
    })
    expect(nextItem.className).toContain("ring-2")
  })

  it("resets suggestions when optimizing again", async () => {
    const fetchMock = (global as any).fetch as jest.Mock
    fetchMock
      .mockImplementationOnce(() =>
        mockFetchResponse({
          opPreviews: [
            {
              opId: "employment-0-0",
              op: {
                op: "updateBlock",
                section: "employment",
                blockIndex: 0,
                payload: { content: "Updated 1" }
              },
              title: "updateBlock employment #0",
              before: "Old",
              after: "Updated 1"
            }
          ],
          errors: []
        })
      )
      .mockImplementationOnce(() =>
        mockFetchResponse({
          opPreviews: [
            {
              opId: "skills-0-1",
              op: {
                op: "updateBlock",
                section: "skills",
                blockIndex: 0,
                payload: { content: "Updated 2" }
              },
              title: "updateBlock skills #0",
              before: "Old",
              after: "Updated 2"
            }
          ],
          errors: []
        })
      )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", {
      name: /updateBlock employment #0/
    })

    fireEvent.click(screen.getByText("evaluation.aiSuggestionsApply"))

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))

    expect(
      await screen.findByRole("button", { name: /updateBlock skills #0/ })
    ).toBeTruthy()
    expect(screen.queryByText("updateBlock employment #0")).toBeNull()
    expect(
      screen.getByText("evaluation.aiSuggestionsStatus.pending")
    ).toBeTruthy()
  })

  it("shows an error toast when the API reports errors", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      mockFetchResponse({
        opPreviews: [
          {
            opId: "employment-0-0",
            op: {
              op: "updateBlock",
              section: "employment",
              blockIndex: 0,
              payload: { content: "Updated" }
            },
            title: "updateBlock employment #0",
            before: "Old",
            after: "Updated"
          }
        ],
        errors: ["failed-op"]
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))
    await screen.findByRole("button", {
      name: /updateBlock employment #0/
    })

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("部分操作未应用: 1")
    })
  })

  it("shows an error toast when the API request fails", async () => {
    ;(global as any).fetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve("boom")
      })
    )

    render(<EvaluationReport evaluation={evaluation as any} />)

    fireEvent.click(screen.getByText("evaluation.oneClickOptimize"))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Error: boom")
    })
  })
})
