/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDatabase } from "@/lib/db/client"
import { persistApplicationResume } from "./persist"
import type { RollbackRegistry } from "./types"

const batch = vi.fn(async () => [])

vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }))

function createInsert() {
  return { values: vi.fn((value) => ({ kind: "insert", value })) }
}

describe("persistApplicationResume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDatabase).mockResolvedValue({
      batch,
      insert: vi.fn(createInsert),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({ kind: "delete" }))
      }))
    } as never)
  })

  it("writes the application graph in one D1 batch", async () => {
    const register = vi.fn()
    const result = await persistApplicationResume(
      {
        userId: "workspace-1",
        jobInfo: { name: "Engineer", company: "Jobi", description: "Build" },
        resumeData: {} as never,
        resumeLanguage: "en",
        uploadedResumeFilePath: null
      },
      { register } as unknown as RollbackRegistry
    )

    expect(batch).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ kind: "insert" })])
    )
    expect(register).toHaveBeenCalledWith(
      "db",
      "delete-application-data",
      expect.any(Function)
    )
    expect(result.applicationData.id).toEqual(expect.any(String))
  })
})
