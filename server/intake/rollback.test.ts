/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest"
import { RollbackRegistryImpl } from "./rollback"
import type { IntakeEvent } from "./types"

describe("RollbackRegistryImpl", () => {
  it("emits rollback lifecycle events even when there are no actions", async () => {
    const rollback = new RollbackRegistryImpl({
      maxRetries: 0,
      retryDelayMs: 0
    })
    const events: IntakeEvent[] = []

    const result = await rollback.executeAll(async (event) => {
      events.push(event)
    })

    expect(result).toEqual({ allSucceeded: true, failures: [] })
    expect(events).toEqual([
      { type: "rollback.start", intakeId: "" },
      {
        type: "rollback.done",
        intakeId: "",
        allSucceeded: true,
        failureCount: 0
      }
    ])
  })

  it("reports partial rollback failure in rollback.done", async () => {
    const rollback = new RollbackRegistryImpl({
      maxRetries: 0,
      retryDelayMs: 0
    })
    const events: IntakeEvent[] = []

    rollback.register("db", "delete-job", async () => {})
    rollback.register("storage", "delete-upload", async () => {
      throw new Error("boom")
    })

    const result = await rollback.executeAll(async (event) => {
      events.push(event)
    })

    expect(result.allSucceeded).toBe(false)
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]?.label).toBe("delete-upload")
    expect(events[1]).toEqual({
      type: "rollback.done",
      intakeId: "",
      allSucceeded: false,
      failureCount: 1
    })
  })
})
