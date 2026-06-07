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

const mockAddToolOutput = vi.fn()
const saveApplicationResumeChangeMock = vi.fn()
const getJobApplicationByResumeIdMock = vi.fn()

let capturedOnData:
  | ((dataPart: {
      type: string
      data: unknown
      id?: string
      transient?: boolean
    }) => void)
  | null = null

const persistedResume: ResumeData = {
  sectionOrder: ["education", "skills"],
  personalInfo: {
    entryId: "pi-1",
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
        date: { start: "2020-01", end: "2021-01", isCurrent: false },
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
    saveApplicationResumeChangeMock(...args),
  getJobApplicationByResumeId: (...args: unknown[]) =>
    getJobApplicationByResumeIdMock(...args)
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
    capturedOnData = (config as { onData: typeof capturedOnData }).onData

    return {
      addToolOutput: mockAddToolOutput,
      setMessages: vi.fn(),
      status: "ready"
    }
  }
}))

vi.mock("../chat", () => ({
  ThreadViewport: () => <div>thread-viewport</div>,
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
      current_revision: 1,
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
    capturedOnData = null
    saveApplicationResumeChangeMock.mockImplementation(
      async (_resumeId: string, nextResume: ResumeData) => ({
        resume: nextResume,
        currentRevision: 2
      })
    )
  })

  it("applies authoritative resume patches from streaming data", () => {
    const { store } = renderChatInterface()

    expect(capturedOnData).not.toBeNull()

    const patchedResume: ResumeData = {
      ...persistedResume,
      education: {
        ...persistedResume.education!,
        entries: [
          {
            ...persistedResume.education!.entries[0],
            school: "Edited School"
          }
        ]
      }
    }

    capturedOnData?.({
      type: "data-resume-patch",
      id: "tool-1",
      transient: true,
      data: {
        snapshotId: "resume-1:2",
        messageId: "message-1",
        baseVersion: 1,
        nextVersion: 2,
        body: {
          output: {
            operation: "rewrite",
            entity: "education",
            id: "edu-1",
            field: "school",
            originalValue: "Draft School",
            value: "Edited School"
          },
          resume: patchedResume
        }
      }
    })

    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      patchedResume
    )
    expect(store.get(applicationAtom)?.resume.current_revision).toBe(2)
    expect(
      store.get(applicationAtom)?.resume.evaluation_report_refresh_flag
    ).toBe(true)
    expect(saveApplicationResumeChangeMock).not.toHaveBeenCalled()
    expect(mockAddToolOutput).not.toHaveBeenCalled()
  })

  it("ignores non-resume patch data parts", () => {
    const { store } = renderChatInterface()

    capturedOnData?.({
      type: "data-sessionTitle",
      data: {
        sessionId: "session-1",
        title: "Updated title"
      }
    })

    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      persistedResume
    )
  })

  it("rejects patch and refetches on version conflict", async () => {
    const { store } = renderChatInterface()

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

    const freshResume: ResumeData = {
      ...persistedResume,
      personalInfo: { ...persistedResume.personalInfo, firstName: "Refetched" }
    }
    getJobApplicationByResumeIdMock.mockResolvedValue({
      resumes: {
        resume_json: freshResume,
        current_revision: 5
      }
    })

    // Patch baseVersion (2) does not match local revision (1)
    capturedOnData?.({
      type: "data-resume-patch",
      id: "tool-1",
      transient: true,
      data: {
        snapshotId: "resume-1:2",
        messageId: "message-1",
        baseVersion: 2,
        nextVersion: 3,
        body: {
          output: {
            operation: "rewrite",
            entity: "education",
            id: "edu-1",
            field: "school",
            originalValue: "Draft School",
            value: "Conflicting Edit"
          },
          resume: persistedResume
        }
      }
    })

    // Patch should not be applied (resume unchanged)
    expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
      persistedResume
    )
    expect(store.get(applicationAtom)?.resume.current_revision).toBe(1)
    expect(warnSpy).toHaveBeenCalledWith(
      "Resume patch version conflict: rejecting patch and refetching authoritative state",
      expect.objectContaining({
        baseVersion: 2,
        localRevision: 1
      })
    )

    // Wait for refetch to resolve
    await vi.waitFor(() => {
      expect(getJobApplicationByResumeIdMock).toHaveBeenCalledWith("resume-1")
      expect(store.get(applicationAtom)?.resume.resume_json).toEqual(
        freshResume
      )
      expect(store.get(applicationAtom)?.resume.current_revision).toBe(5)
    })

    warnSpy.mockRestore()
  })

  it("does not render the chat thread while the resume edit modal is open", () => {
    renderChatInterface({ modalOpen: true })

    expect(screen.queryByText("thread-viewport")).not.toBeInTheDocument()
  })
})
