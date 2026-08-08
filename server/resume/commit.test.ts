/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest"

import type { AppDatabase } from "@/lib/db/client"
import type { ResumeData } from "@/types/resume"
import {
  commitResumeChange,
  commitResumeOperation,
  ResumeCommitError
} from "./commit"

function resume(firstName: string): ResumeData {
  return {
    sectionOrder: ["education", "skills"],
    personalInfo: {
      entryId: "personal-info",
      firstName,
      lastName: "Doe",
      email: "jane@example.com",
      phone: "123"
    },
    education: { entries: [] },
    skills: { entries: [] }
  }
}

function createDb(options?: {
  rows?: Array<{ resumeJson: ResumeData; currentRevision: number }>
  updateResults?: boolean[]
  snapshotError?: Error
}) {
  const rows = options?.rows ?? [
    { resumeJson: resume("Jane"), currentRevision: 1 }
  ]
  const updateResults = [...(options?.updateResults ?? [true])]
  const updates: Array<Record<string, unknown>> = []
  let readIndex = 0

  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => {
            const row = rows[Math.min(readIndex, rows.length - 1)]
            readIndex += 1
            return [
              {
                id: "resume-1",
                userId: "workspace-1",
                resumeJson: row.resumeJson,
                currentRevision: row.currentRevision
              }
            ]
          })
        }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        updates.push(values)
        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () =>
              (updateResults.shift() ?? true) ? [{ id: "resume-1" }] : []
            )
          }))
        }
      })
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async () => {
        if (options?.snapshotError) {
          throw options.snapshotError
        }
      })
    }))
  } as unknown as AppDatabase

  return { db, updates }
}

describe("resume commit with D1 optimistic concurrency", () => {
  it("returns the next authoritative revision after a changed save", async () => {
    const { db, updates } = createDb()
    const nextResume = resume("Janet")

    await expect(
      commitResumeChange({
        db,
        actorId: "workspace-1",
        resumeId: "resume-1",
        nextResume,
        baseRevision: 1
      })
    ).resolves.toEqual({ resume: nextResume, currentRevision: 2 })

    expect(updates[0]).toEqual(
      expect.objectContaining({ currentRevision: 2, resumeJson: nextResume })
    )
  })

  it("does not write an unchanged resume", async () => {
    const currentResume = resume("Jane")
    const { db, updates } = createDb({
      rows: [{ resumeJson: currentResume, currentRevision: 2 }]
    })

    await expect(
      commitResumeChange({
        db,
        actorId: "workspace-1",
        resumeId: "resume-1",
        nextResume: structuredClone(currentResume)
      })
    ).resolves.toEqual({ resume: currentResume, currentRevision: 2 })
    expect(updates).toHaveLength(0)
  })

  it("rejects a stale full JSON save", async () => {
    const { db } = createDb({
      rows: [{ resumeJson: resume("Jane"), currentRevision: 3 }]
    })

    await expect(
      commitResumeChange({
        db,
        actorId: "workspace-1",
        resumeId: "resume-1",
        nextResume: resume("Janet"),
        baseRevision: 2
      })
    ).rejects.toMatchObject({ code: "stale-json-conflict" })
  })

  it("rebases an operation after a revision race", async () => {
    const { db } = createDb({
      rows: [
        { resumeJson: resume("Jane"), currentRevision: 1 },
        { resumeJson: resume("Concurrent"), currentRevision: 2 }
      ],
      updateResults: [false, true]
    })

    const result = await commitResumeOperation({
      db,
      actorId: "workspace-1",
      resumeId: "resume-1",
      operation: ({ resume: current }) => ({
        nextResume: {
          ...current,
          personalInfo: { ...current.personalInfo, firstName: "Final" }
        },
        metadata: "done"
      })
    })

    expect(result.currentRevision).toBe(3)
    expect(result.baseRevision).toBe(2)
    expect(result.resume.personalInfo.firstName).toBe("Final")
  })

  it("compensates and reports a failed snapshot insert", async () => {
    const { db, updates } = createDb({
      snapshotError: new Error("snapshot failed")
    })

    await expect(
      commitResumeChange({
        db,
        actorId: "workspace-1",
        resumeId: "resume-1",
        nextResume: resume("Janet")
      })
    ).rejects.toBeInstanceOf(ResumeCommitError)
    expect(updates).toHaveLength(2)
  })
})
