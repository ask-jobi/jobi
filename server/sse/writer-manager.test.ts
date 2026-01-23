/**
 * @vitest-environment node
 */

import { registerWriter, sendData, closeWriter } from "./writer-manager"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

describe("writer-manager", () => {
  let mockWriter: WritableStreamDefaultWriter

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriter = {
      ready: Promise.resolve(),
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn(),
      closed: Promise.resolve(),
      desiredSize: null
    } as unknown as WritableStreamDefaultWriter
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("registerWriter", () => {
    it("should register a writer for given processId", () => {
      registerWriter("process-123", mockWriter)

      expect(() => sendData("process-123", { test: "data" })).not.toThrow()
    })

    it("should allow overwriting existing writer", async () => {
      const newWriter = {
        ready: Promise.resolve(),
        write: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        releaseLock: vi.fn(),
        closed: Promise.resolve(),
        desiredSize: null
      } as unknown as WritableStreamDefaultWriter

      registerWriter("process-123", mockWriter)
      registerWriter("process-123", newWriter)

      await sendData("process-123", { test: "data" })

      expect(newWriter.write).toHaveBeenCalled()
      expect(mockWriter.write).not.toHaveBeenCalled()
    })
  })

  describe("sendData", () => {
    it("should send data with SSE format", async () => {
      registerWriter("process-123", mockWriter)

      await sendData("process-123", { message: "hello" })

      expect(mockWriter.ready).toBeDefined()
      expect(mockWriter.write).toHaveBeenCalledWith(expect.any(Uint8Array))
      const writtenData = (mockWriter.write as ReturnType<typeof vi.fn>).mock
        .calls[0][0]
      const decoded = new TextDecoder().decode(writtenData)
      expect(decoded).toBe('data: {"message":"hello"}\n\n')
    })

    it("should do nothing when writer does not exist", async () => {
      await sendData("non-existent", { test: "data" })

      expect(mockWriter.write).not.toHaveBeenCalled()
    })

    it("should handle complex data objects", async () => {
      registerWriter("process-123", mockWriter)

      await sendData("process-123", {
        type: "update",
        data: {
          progress: 50,
          status: "processing"
        }
      })

      const writtenData = (mockWriter.write as ReturnType<typeof vi.fn>).mock
        .calls[0][0]
      const decoded = new TextDecoder().decode(writtenData)
      expect(decoded).toContain('"type":"update"')
      expect(decoded).toContain('"progress":50')
    })
  })

  describe("closeWriter", () => {
    it("should close writer and remove from storage", async () => {
      registerWriter("process-123", mockWriter)

      closeWriter("process-123")

      expect(mockWriter.close).toHaveBeenCalled()

      await sendData("process-123", { test: "data" })
      expect(mockWriter.write).not.toHaveBeenCalled()
    })

    it("should do nothing when writer does not exist", () => {
      expect(() => closeWriter("non-existent")).not.toThrow()
    })
  })
})
