import {
  MessagePrimitive,
  ActionBarPrimitive,
  useAuiState
} from "@assistant-ui/react"
import { Button } from "@/components/ui/button"
import { AlertCircleIcon, CopyIcon } from "lucide-react"
import { MarkdownText } from "@/components/assistant-ui/markdown-text"
import { ToolFallback } from "@/components/assistant-ui/tool-fallback"
import { Reasoning, ReasoningGroup } from "@/components/assistant-ui/reasoning"
import { ResumeEditorToolUI } from "./resume-editor-tool"

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-[44rem] animate-in py-3 duration-150"
      data-role="assistant"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              Reasoning: Reasoning,
              ReasoningGroup: ReasoningGroup,
              tools: {
                Fallback: ToolFallback,
                by_name: {
                  resumeEditorModify: ResumeEditorToolUI,
                  resumeEditorReorder: ResumeEditorToolUI
                }
              }
            }}
          />
          <AssistantErrorMessage />
        </div>
        <div className="mt-1 flex items-center gap-1">
          <AssistantActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}

function AssistantErrorMessage() {
  const status = useAuiState((state) => state.message.status)
  const isError =
    status?.type === "incomplete" && status.reason === "error" && status.error

  if (!isError) {
    return null
  }

  const errorText =
    typeof status.error === "string"
      ? status.error
      : JSON.stringify(status.error)

  return (
    <MessagePrimitive.Error>
      <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{errorText}</p>
      </div>
    </MessagePrimitive.Error>
  )
}

export function AssistantActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      autohideFloat="single-branch"
      className="aui-assistant-action-bar-root flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <CopyIcon className="h-3.5 w-3.5" />
        </Button>
      </ActionBarPrimitive.Copy>
    </ActionBarPrimitive.Root>
  )
}
