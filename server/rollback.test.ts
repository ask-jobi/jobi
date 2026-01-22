/**
 * @jest-environment node
 */
import { AsyncLocalStorage } from "node:async_hooks"

global.AsyncLocalStorage = AsyncLocalStorage as any

import { RollbackContext, rollbackStorage } from "./rollback"

describe("RollbackContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("constructor", () => {
    it("should initialize with empty rollbackActions array", () => {
      const context = new RollbackContext()
      expect(context.rollbackActions).toEqual([])
      expect(context.retryTimes).toBe(3)
    })
  })

  describe("addRollback", () => {
    it("should add rollback action to the list", () => {
      const context = new RollbackContext()
      const action1 = jest.fn().mockResolvedValue(undefined)
      const action2 = jest.fn().mockResolvedValue(undefined)

      context.addRollback(action1)
      context.addRollback(action2)

      expect(context.rollbackActions).toHaveLength(2)
      expect(context.rollbackActions[0]).toBe(action1)
      expect(context.rollbackActions[1]).toBe(action2)
    })

    it("should handle async rollback actions", async () => {
      const context = new RollbackContext()
      const asyncAction = jest.fn().mockResolvedValue(undefined)

      context.addRollback(asyncAction)
      await context.executeRollback()

      expect(asyncAction).toHaveBeenCalled()
    })
  })

  describe("rollbackRunWithRetry", () => {
    it("should execute action successfully on first attempt", async () => {
      const context = new RollbackContext()
      const action = jest.fn().mockResolvedValue(undefined)

      await context.rollbackRunWithRetry(action, 3)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it("should retry when action fails and eventually succeed", async () => {
      const context = new RollbackContext()
      const action = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockResolvedValueOnce(undefined)

      await context.rollbackRunWithRetry(action, 3)

      expect(action).toHaveBeenCalledTimes(2)
    })

    it("should throw error when all retries are exhausted", async () => {
      const context = new RollbackContext()
      const error = new Error("Permanent failure")
      const action = jest.fn().mockRejectedValue(error)

      await expect(context.rollbackRunWithRetry(action, 3)).rejects.toThrow(
        "Permanent failure"
      )
      expect(action).toHaveBeenCalledTimes(4)
    })

    it("should use default retryTimes when not specified", async () => {
      const context = new RollbackContext()
      const action = jest.fn().mockRejectedValue(new Error("Fail"))

      await expect(context.rollbackRunWithRetry(action)).rejects.toThrow("Fail")
      expect(action).toHaveBeenCalledTimes(4)
    })
  })

  describe("executeRollback", () => {
    it("should execute all rollback actions in reverse order", async () => {
      const context = new RollbackContext()
      const action1 = jest.fn().mockResolvedValue(undefined)
      const action2 = jest.fn().mockResolvedValue(undefined)
      const action3 = jest.fn().mockResolvedValue(undefined)

      context.addRollback(action1)
      context.addRollback(action2)
      context.addRollback(action3)

      await context.executeRollback()

      expect(action3).toHaveBeenCalled()
      expect(action2).toHaveBeenCalled()
      expect(action1).toHaveBeenCalled()
      expect(action1).toHaveBeenCalledTimes(1)
      expect(action2).toHaveBeenCalledTimes(1)
      expect(action3).toHaveBeenCalledTimes(1)
    })

    it("should continue executing other rollbacks when one fails", async () => {
      const context = new RollbackContext()
      const consoleSpy = jest.spyOn(console, "error").mockImplementation()
      const action1 = jest.fn().mockResolvedValue(undefined)
      const action2 = jest.fn().mockRejectedValue(new Error("Rollback failed"))
      const action3 = jest.fn().mockResolvedValue(undefined)

      context.addRollback(action1)
      context.addRollback(action2)
      context.addRollback(action3)

      await context.executeRollback()

      expect(action1).toHaveBeenCalledTimes(1)
      expect(action2).toHaveBeenCalledTimes(4)
      expect(action3).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Rollback Failed: ",
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it("should handle empty rollbackActions", async () => {
      const context = new RollbackContext()

      await context.executeRollback()

      expect(context.rollbackActions).toHaveLength(0)
    })

    it("should handle sync and async actions mixed", async () => {
      const context = new RollbackContext()
      const syncAction = jest.fn()
      const asyncAction = jest.fn().mockResolvedValue(undefined)

      context.addRollback(syncAction)
      context.addRollback(asyncAction)

      await context.executeRollback()

      expect(asyncAction).toHaveBeenCalled()
      expect(syncAction).toHaveBeenCalled()
    })
  })
})

describe("rollbackStorage", () => {
  it("should be an instance of AsyncLocalStorage", () => {
    expect(rollbackStorage).toBeInstanceOf(AsyncLocalStorage)
  })

  it("should run callback with provided context", () => {
    const context = new RollbackContext()
    const callback = jest.fn()

    rollbackStorage.run(context, callback)

    expect(callback).toHaveBeenCalled()
  })

  it("should store context accessible via getStore", () => {
    const context = new RollbackContext()
    const mockStore = context as unknown as RollbackContext

    rollbackStorage.run(context, () => {
      const stored = rollbackStorage.getStore()
      expect(stored).toBe(mockStore)
    })
  })
})
