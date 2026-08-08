/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import * as auth from "@/server/auth-helper"
import * as applications from "@/server/data/applications"
import { commitResumeChange } from "@/server/resume/commit"
import {
  deleteJobApplication,
  fetchJobApplication,
  getApplicationResumeData,
  getJobApplication,
  saveApplicationResumeChange,
  updateResumeJobDescription,
  uploadResumeFile
} from "./resume"

vi.mock("@/server/auth-helper")
vi.mock("@/server/data/applications")
vi.mock("@/server/resume/commit")

describe("resume service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.requireVerifiedUserIdentity).mockResolvedValue({
      id: "workspace-1"
    })
    vi.mocked(auth.requireVerifiedAuthContext).mockResolvedValue({
      db: {} as never,
      user: { id: "workspace-1" }
    })
  })

  it("lists only the current workspace applications", async () => {
    vi.mocked(applications.listApplications).mockResolvedValue([])
    await expect(fetchJobApplication()).resolves.toEqual([])
    expect(applications.listApplications).toHaveBeenCalledWith("workspace-1")
  })

  it("returns an owned application or a not-found error", async () => {
    vi.mocked(applications.findApplicationById).mockResolvedValue(null)
    await expect(getJobApplication("missing")).rejects.toThrow(
      "No job application found"
    )
  })

  it("returns the authoritative resume state", async () => {
    const state = { resume: {} as never, currentRevision: 2 }
    vi.mocked(applications.getResumeState).mockResolvedValue(state)
    await expect(getApplicationResumeData("resume-1")).resolves.toBe(state)
  })

  it("does not persist the original uploaded PDF", async () => {
    await expect(
      uploadResumeFile(new File(["pdf"], "resume.pdf"))
    ).resolves.toEqual({
      fileName: null,
      filePath: null,
      userId: "workspace-1"
    })
  })

  it("updates and deletes within the current workspace", async () => {
    const job = {
      id: "job-1",
      name: "Engineer",
      company: "Jobi",
      description: "Build"
    }
    await updateResumeJobDescription(job)
    await deleteJobApplication("application-1")

    expect(applications.updateJobDescription).toHaveBeenCalledWith(
      "workspace-1",
      job
    )
    expect(applications.deleteApplication).toHaveBeenCalledWith(
      "workspace-1",
      "application-1"
    )
  })

  it("commits resume changes through the D1 context", async () => {
    vi.mocked(commitResumeChange).mockResolvedValue({
      resume: {} as never,
      currentRevision: 3
    })

    await saveApplicationResumeChange("resume-1", {} as never, {
      baseRevision: 2
    })

    expect(commitResumeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "workspace-1",
        resumeId: "resume-1",
        baseRevision: 2
      })
    )
  })
})
