"use client"

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import {Plugins, SUPPORT_TRANSFORMER} from "./plugins"
import {$convertFromMarkdownString, $convertToMarkdownString} from "@lexical/markdown";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

export function Editor({
  markdown,
  onChange,
}: {
  markdown: string
  onChange?: (md: string) => void
}) {
  return (
    <div className="h-full bg-background overflow-y-scroll rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: () => $convertFromMarkdownString(markdown, SUPPORT_TRANSFORMER),
        }}
      >
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState, editor) => {
              editorState.read(() => {
                const md = $convertToMarkdownString(SUPPORT_TRANSFORMER)
                onChange?.(md)
              })
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
