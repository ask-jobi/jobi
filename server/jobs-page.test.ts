import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRedirect = vi.fn()

vi.mock("next/navigation", () => ({
  redirect: mockRedirect
}))

describe("JobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should redirect to dashboard", async () => {
    const { default: JobsPage } =
      await import("@/app/(protected)/(main)/jobs/page")

    await JobsPage()

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard")
  })
})
