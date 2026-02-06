import { MessagePrimitive, ActionBarPrimitive } from "@assistant-ui/react"
import { Button } from "@/components/ui/button"
import { CopyIcon } from "lucide-react"
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
        </div>
        <div className="mt-1 flex items-center gap-1">
          <AssistantActionBar />
        </div>
      </div>
    </MessagePrimitive.Root>
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
