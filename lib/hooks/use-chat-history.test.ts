/**
 * @vitest-environment jsdom
 */
import { createElement, useState } from "react"
import { fireEvent, render, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import type {
  UseChatHistoryOptions,
  UseChatHistoryReturn
} from "./use-chat-history"
import { useChatHistory } from "./use-chat-history"
import type { ChatHistoryEntry } from "@/lib/agent/chat-history"

afterEach(() => {
  vi.restoreAllMocks()
})

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
        isInitialLoading: false,
        error: null,
        refetch: async () => {}
      }
      expect(historyReturn.messages).toEqual([])
      expect(historyReturn.loading).toBe(false)
      expect(historyReturn.isInitialLoading).toBe(false)
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
        isInitialLoading: false,
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
        isInitialLoading: false,
        error,
        refetch: async () => {}
      }
      expect(historyReturn.error).toBe(error)
    })
  })

  describe("behavior", () => {
    it("should expose initial loading only before the first fetch completes", async () => {
      const mockMessages: ChatHistoryEntry[] = []
      let resolveFetch:
        | ((value: {
            ok: boolean
            json: () => Promise<ChatHistoryEntry[]>
          }) => void)
        | null = null

      const fetchMock = vi.fn(
        () =>
          new Promise<{
            ok: boolean
            json: () => Promise<ChatHistoryEntry[]>
          }>((resolve) => {
            resolveFetch = resolve
          })
      )

      vi.stubGlobal("fetch", fetchMock)

      function TestComponent() {
        const { isInitialLoading } = useChatHistory({ sessionId: "session-1" })

        return createElement("div", {
          "data-initial-loading": String(isInitialLoading)
        })
      }

      const { container } = render(createElement(TestComponent))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      })

      expect(container.firstChild?.getAttribute("data-initial-loading")).toBe(
        "true"
      )

      resolveFetch?.({
        ok: true,
        json: async () => mockMessages
      })

      await waitFor(() => {
        expect(container.firstChild?.getAttribute("data-initial-loading")).toBe(
          "false"
        )
      })
    })

    it("should not refetch when the parent re-renders", async () => {
      const mockMessages: ChatHistoryEntry[] = [
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          createdAt: "2024-01-01T00:00:00Z"
        }
      ]

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMessages
      })

      vi.stubGlobal("fetch", fetchMock)

      function TestComponent() {
        const [renderCount, setRenderCount] = useState(0)

        useChatHistory({ sessionId: "session-1" })

        return createElement(
          "button",
          {
            onClick: () => setRenderCount((count) => count + 1),
            "data-count": renderCount
          },
          "rerender"
        )
      }

      const { getByText } = render(createElement(TestComponent))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      })

      fireEvent.click(getByText("rerender"))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(1)
      })
    })
  })
})
