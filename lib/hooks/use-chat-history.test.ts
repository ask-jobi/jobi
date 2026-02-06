/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest"
import type {
  UseChatHistoryOptions,
  UseChatHistoryReturn
} from "./use-chat-history"
import type { ChatHistoryEntry } from "@/lib/agent/chat-history"

describe("use-chat-history types", () => {
  describe("UseChatHistoryOptions", () => {
    it("should accept sessionId parameter", () => {
      const options: UseChatHistoryOptions = {
        sessionId: "test-session-id"
      }
      expect(options.sessionId).toBe("test-session-id")
    })

    it("should accept optional limit parameter", () => {
      const options: UseChatHistoryOptions = {
        sessionId: "test-session-id",
        limit: 50
      }
      expect(options.limit).toBe(50)
    })

    it("should accept optional onLoad callback", () => {
      const onLoad = (_messages: ChatHistoryEntry[]) => {
        console.log(_messages)
      }
      const options: UseChatHistoryOptions = {
        sessionId: "test-session-id",
        onLoad
      }
      expect(options.onLoad).toBe(onLoad)
    })

    it("should allow null sessionId", () => {
      const options: UseChatHistoryOptions = {
        sessionId: null
      }
      expect(options.sessionId).toBeNull()
    })

    it("should have default limit of 100", () => {
      const options: UseChatHistoryOptions = {
        sessionId: "test-session-id"
      }
      expect(options.limit).toBeUndefined()
    })
  })

  describe("UseChatHistoryReturn", () => {
    it("should have required properties", () => {
      const historyReturn: UseChatHistoryReturn = {
        messages: [],
        loading: false,
        error: null,
        refetch: async () => {}
      }
      expect(historyReturn.messages).toEqual([])
      expect(historyReturn.loading).toBe(false)
      expect(historyReturn.error).toBeNull()
      expect(typeof historyReturn.refetch).toBe("function")
    })

    it("should accept messages array", () => {
      const mockMessages: ChatHistoryEntry[] = [
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          createdAt: "2024-01-01T00:00:00Z"
        }
      ]
      const historyReturn: UseChatHistoryReturn = {
        messages: mockMessages,
        loading: false,
        error: null,
        refetch: async () => {}
      }
      expect(historyReturn.messages).toHaveLength(1)
    })

    it("should accept Error type for error", () => {
      const error = new Error("Failed to fetch")
      const historyReturn: UseChatHistoryReturn = {
        messages: [],
        loading: false,
        error,
        refetch: async () => {}
      }
      expect(historyReturn.error).toBe(error)
    })
  })
})
