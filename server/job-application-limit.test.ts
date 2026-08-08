/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { countApplications } from "@/server/data/applications"
import { verifyJobApplicationLimit } from "./job-application-limit"

vi.mock("@/server/data/applications", () => ({ countApplications: vi.fn() }))

describe("verifyJobApplicationLimit", () => {
  beforeEach(() => vi.clearAllMocks())

  it("passes below the workspace limit", async () => {
    vi.mocked(countApplications).mockResolvedValue(19)
    await expect(
      verifyJobApplicationLimit("workspace-1")
    ).resolves.toBeUndefined()
  })

  it("rejects at the workspace limit", async () => {
    vi.mocked(countApplications).mockResolvedValue(20)
    await expect(verifyJobApplicationLimit("workspace-1")).rejects.toThrow(
      "maximum job application limit"
    )
  })
})
