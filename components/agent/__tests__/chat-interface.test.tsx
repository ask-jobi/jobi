/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { Provider, createStore } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatInterface } from "../chat-interface"
import { applicationAtom, editModalOpenAtom } from "@/lib/store/resume"
import { chatSessionIdAtom } from "@/lib/store/chat"
import type { ResumeData } from "@/types/resume"

const mockExecuteResumeEditorModifyTool = vi.fn()
const mockExecuteResumeEditorReorderTool = vi.fn()
const mockAddToolOutput = vi.fn()
const saveApplicationResumeChangeMock = vi.fn()

let capturedOnToolCall:
  | ((args: {
      toolCall: {
        toolName: string
        toolCallId: string
        input: unknown
      }
    }) => Promise<void>)
  | null = null

const persistedResume: ResumeData = {
  sectionOrder: ["education", "skills"],
  personalInfo: {
    blockId: "pi-1",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  },
  education: {
    entries: [
      {
        entryId: "edu-1",
        school: "Draft School",
        degree: "Draft Degree",
        start: "2020-01",
        end: "2021-01",
        content: ""
      }
    ]
  },
  skills: {
    entries: []
  }
}

vi.mock("@/server/resume", () => ({
  saveApplicationResumeChange: (...args: unknown[]) =>
    saveApplicationResumeChangeMock(...args)
}))

vi.mock("@/lib/hooks/use-chat-history", () => ({
  useChatHistory: () => ({
    messages: [],
    hasLoadedInitialHistory: false
  })
}))

vi.mock("@/lib/hooks/use-chat-thread-lifecycle", () => ({
  useChatThreadLifecycle: () => ({
    lifecycle: "ready",
    markThreadSynced: vi.fn(),
    markRunStarted: vi.fn(),
    markRunFinished: vi.fn(),
    markFailed: vi.fn()
  })
}))

vi.mock("@assistant-ui/react-ai-sdk", () => ({
  useAISDKRuntime: () => ({})
}))

vi.mock("@assistant-ui/react", () => ({
  AssistantRuntimeProvider: ({ children }: { children: ReactNode }) => children,
  ThreadPrimitive: {
    Root: ({ children }: { children: ReactNode }) => children
  },
  useAui: () => ({
    thread: () => ({
      append: vi.fn()
    }),
    composer: () => ({
      getState: () => ({
        runConfig: { model: "test" }
      })
    })
  })
}))

vi.mock("@ai-sdk/react", () => ({
  useChat: (config: unknown) => {
    capturedOnToolCall = (config as { onToolCall: typeof capturedOnToolCall })
      .onToolCall

    return {
      addToolOutput: mockAddToolOutput,
      setMessages: vi.fn(),
      status: "ready"
    }
  }
}))

vi.mock("../chat", () => ({
  ThreadViewport: () => <div>thread-viewport</div>,
  executeResumeEditorModifyTool: (...args: unknown[]) =>
    mockExecuteResumeEditorModifyTool(...args),
  executeResumeEditorReorderTool: (...args: unknown[]) =>
    mockExecuteResumeEditorReorderTool(...args),
  toUIMessage: vi.fn()
}))

vi.mock("@/lib/token-balance-events", () => ({
  notifyTokenBalanceUpdated: vi.fn()
}))

function renderChatInterface({
  modalOpen = false
}: { modalOpen?: boolean } = {}) {
  const store = createStore()

  store.set(chatSessionIdAtom, "session-1")
  store.set(editModalOpenAtom, modalOpen)
  store.set(applicationAtom, {
    id: "app-1",
    resume: {
      id: "resume-1",
      language: "en",
      evaluation_report: null,
      evaluation_report_refresh_flag: false,
      resume_json: persistedResume
    },
    job: {
      id: "job-1",
      name: "",
      company: "",
      description: ""
    }
  })

  return {
    store,
    ...render(
      <Provider store={store}>
        <ChatInterface />
      </Provider>
    )
  }
}

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnToolCall = null
    saveApplicationResumeChangeMock.mockResolvedValue(undefined)
    mockExecuteResumeEditorModifyTool.mockResolvedValue({
      operation: "rewrite",
      entity: "education",
      id: "edu-1",
      field: "school",
      originalValue: "Draft School",
      value: "Edited School"
    })
    mockExecuteResumeEditorReorderTool.mockResolvedValue({
      operation: "reorderEntries",
      entity: "education",
      orderedEntryIds: ["edu-1"]
    })
  })

  it("runs resume editor tools against the persisted resume and saves the resulting resume", async () => {
    renderChatInterface()

    expect(capturedOnToolCall).not.toBeNull()

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "resumeEditorModify",
        toolCallId: "tool-1",
        input: {
          operation: "rewrite",
          entity: "education",
          id: "edu-1",
          field: "school",
          value: "Edited School"
        }
      }
    })

    const expectedResume: ResumeData = {
      ...persistedResume,
      education: {
        ...persistedResume.education,
        entries: [
          {
            ...persistedResume.education.entries[0],
            school: "Edited School"
          }
        ]
      }
    }

    expect(mockExecuteResumeEditorModifyTool).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "education",
        id: "edu-1"
      }),
      persistedResume
    )
    expect(mockAddToolOutput).toHaveBeenCalledWith({
      tool: "resumeEditorModify",
      toolCallId: "tool-1",
      output: expect.objectContaining({
        operation: "rewrite",
        id: "edu-1"
      })
    })
    expect(saveApplicationResumeChangeMock).toHaveBeenCalledWith(
      "resume-1",
      expectedResume
    )
  })

  it("keeps the persisted resume unchanged when an AI edit save fails", async () => {
    saveApplicationResumeChangeMock.mockRejectedValueOnce(new Error("boom"))
    const { store } = renderChatInterface()

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "resumeEditorModify",
        toolCallId: "tool-2",
        input: {
          operation: "rewrite",
          entity: "education",
          id: "edu-1",
          field: "school",
          value: "Edited School"
        }
      }
    })

    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      persistedResume
    )
  })

  it("does not render the chat thread while the resume edit modal is open", () => {
    renderChatInterface({ modalOpen: true })

    expect(screen.queryByText("thread-viewport")).not.toBeInTheDocument()
  })
})
