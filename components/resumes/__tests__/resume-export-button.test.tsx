/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResumeExportButton } from "../resume-export-button"

const mockUseResume = vi.fn()
const mockTrackExportResume = vi.fn()
const mockToastError = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("@/lib/store/resume", () => ({
  useResume: () => mockUseResume()
}))

vi.mock("@/lib/user-tracking/user-tracking", () => ({
  trackExportResume: () => mockTrackExportResume()
}))

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args)
  }
}))

describe("ResumeExportButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseResume.mockReturnValue({
      application: { resume: { id: "resume-123" } },
      isLoading: false
    })

    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["resume"]))
    } as Response)

    window.URL.createObjectURL = vi.fn(() => "blob:resume")
    window.URL.revokeObjectURL = vi.fn()
    HTMLAnchorElement.prototype.click = vi.fn()
  })

  it("renders the export button label", () => {
    render(<ResumeExportButton />)

    expect(
      screen.getByRole("button", { name: "button.exportResume" })
    ).toBeInTheDocument()
  })

  it("calls the export endpoint when clicked", async () => {
    render(<ResumeExportButton />)

    fireEvent.click(screen.getByRole("button", { name: "button.exportResume" }))

    await waitFor(() => {
      expect(mockTrackExportResume).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/resume/print?id=resume-123"
      )
    })
  })

  it("is disabled while the resume is loading", () => {
    mockUseResume.mockReturnValue({
      application: { resume: { id: "resume-123" } },
      isLoading: true
    })

    render(<ResumeExportButton />)

    expect(
      screen.getByRole("button", { name: "button.exportResume" })
    ).toBeDisabled()
  })

  it("shows an error when the resume id is missing", async () => {
    mockUseResume.mockReturnValue({
      application: null,
      isLoading: false
    })

    render(<ResumeExportButton />)

    fireEvent.click(screen.getByRole("button", { name: "button.exportResume" }))

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("exportResumeError")
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
