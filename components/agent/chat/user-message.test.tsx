/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { UserActionBar } from "./user-message"

const replacePersistedResumeMock = vi.fn()
const replaceAuthoritativeResumeMock = vi.fn()
const exportThreadMock = vi.fn()
const importThreadMock = vi.fn()
const setComposerTextMock = vi.fn()
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key
}))

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args)
  }
}))

vi.mock("@/lib/store/resume", () => ({
  useApplicationResume: () => ({
    replacePersistedResume: replacePersistedResumeMock,
    replaceAuthoritativeResume: replaceAuthoritativeResumeMock
  })
}))

vi.mock("./utils", () => ({
  extractTextFromParts: () => "Rewrite this"
}))

vi.mock("@assistant-ui/react", () => ({
  ActionBarPrimitive: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  },
  MessagePrimitive: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Parts: () => null
  },
  useAui: () => ({
    thread: () => ({
      export: exportThreadMock,
      import: importThreadMock,
      composer: () => ({ setText: setComposerTextMock })
    })
  }),
  useAuiState: (selector: (state: any) => unknown) =>
    selector({
      message: {
        id: "message-1",
        parts: [{ type: "text", text: "Rewrite this" }]
      }
    })
}))

describe("UserActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    exportThreadMock.mockReturnValue({
      messages: [
        { message: { id: "message-1" } },
        { message: { id: "assistant-1" } }
      ],
      headId: "assistant-1"
    })
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resume: {
            personalInfo: {
              entryId: "pi-1",
              firstName: "Authoritative"
            }
          },
          currentRevision: 6
        })
      })
    )
  })

  it("applies the authoritative rollback payload to local resume state", async () => {
    render(<UserActionBar />)

    fireEvent.click(screen.getByRole("button", { name: /truncate/i }))

    await waitFor(() => {
      expect(replaceAuthoritativeResumeMock).toHaveBeenCalledWith({
        resume: {
          personalInfo: {
            entryId: "pi-1",
            firstName: "Authoritative"
          }
        },
        currentRevision: 6
      })
      expect(replacePersistedResumeMock).not.toHaveBeenCalled()
    })
  })
})
