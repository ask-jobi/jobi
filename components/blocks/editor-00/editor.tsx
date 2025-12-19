"use client"

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import {Plugins} from "./plugins"
import {$exportMarkdown, $importMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";

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
          editorState: () => $importMarkdown(markdown),
        }}
      >
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              editorState.read(() => {
                const md = $exportMarkdown()
                onChange?.(md)
              })
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
