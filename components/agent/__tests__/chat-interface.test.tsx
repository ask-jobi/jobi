/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from "react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatInterface } from "../chat-interface"

const mockApplyToolOutput = vi.fn()
const mockCommitDraft = vi.fn()
const mockExecuteResumeEditorModifyTool = vi.fn()
const mockAddToolOutput = vi.fn()

let capturedOnToolCall:
  | ((args: {
      toolCall: {
        toolName: string
        toolCallId: string
        input: unknown
      }
    }) => Promise<void>)
  | null = null

const draftResume = {
  sectionOrder: ["education", "skills"],
  personalInfo: {
    blockId: "pi-1",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  },
  education: {
    title: "Education",
    blocks: [
      {
        blockId: "edu-draft",
        school: "Draft School",
        degree: "Draft Degree",
        start: "2020-01",
        end: "2021-01",
        content: ""
      }
    ]
  },
  skills: {
    title: "Skills",
    blocks: []
  }
}

vi.mock("@/lib/store/chat", () => ({
  useChatSessionIdValue: () => "session-1",
  usePendingChatActionValue: () => null,
  useSetPendingChatAction: () => vi.fn()
}))

vi.mock("@/lib/store/resume", () => ({
  useResume: () => ({
    application: {
      resume: {
        id: "resume-1"
      }
    }
  })
}))

vi.mock("@/lib/hooks/use-resume-draft", () => ({
  useResumeDraft: () => ({
    draft: draftResume,
    applyToolOutput: mockApplyToolOutput,
    commitDraft: mockCommitDraft
  })
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
  executeResumeEditorReorderTool: vi.fn(),
  toUIMessage: vi.fn()
}))

vi.mock("@/lib/token-balance-events", () => ({
  notifyTokenBalanceUpdated: vi.fn()
}))

describe("ChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnToolCall = null
    mockApplyToolOutput.mockReturnValue(draftResume)
    mockCommitDraft.mockResolvedValue(undefined)
    mockExecuteResumeEditorModifyTool.mockResolvedValue({
      operation: "rewrite",
      entity: "education",
      id: "edu-draft",
      field: "school",
      originalValue: "Draft School",
      value: "Edited School"
    })
  })

  it("runs resume editor tools against the current draft and applies the output through the draft seam", async () => {
    render(<ChatInterface />)

    expect(capturedOnToolCall).not.toBeNull()

    await capturedOnToolCall?.({
      toolCall: {
        toolName: "resumeEditorModify",
        toolCallId: "tool-1",
        input: {
          operation: "rewrite",
          entity: "education",
          id: "edu-draft",
          field: "school",
          value: "Edited School"
        }
      }
    })

    expect(mockExecuteResumeEditorModifyTool).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "education",
        id: "edu-draft"
      }),
      draftResume
    )
    expect(mockAddToolOutput).toHaveBeenCalledWith({
      tool: "resumeEditorModify",
      toolCallId: "tool-1",
      output: expect.objectContaining({
        operation: "rewrite",
        id: "edu-draft"
      })
    })
    expect(mockApplyToolOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "rewrite",
        id: "edu-draft"
      })
    )
    expect(mockCommitDraft).toHaveBeenCalledWith(draftResume)
  })
})
