"use client"

import {useEditor, EditorContent, Mark, mergeAttributes} from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Link from '@tiptap/extension-link'
import Bold from '@tiptap/extension-bold'
import { UndoRedo, Placeholder, TrailingNode } from '@tiptap/extensions'
import { ListKit } from '@tiptap/extension-list'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Markdown } from "@tiptap/markdown";
import Heading from "@tiptap/extension-heading";
import {BubbleMenu} from "@tiptap/react/menus";
import React, {useCallback, useEffect, useState} from "react";
import FloatingToolbarAi from './floating-toolbar-ai'
import FloatingToolbarOptions from './floating-toolbar-options'
import {Diff, SelectionCustom} from "@/components/editor/extensions"

export const Inserted = Mark.create({
  name: "inserted",

  addAttributes() {
    return {
      source: { default: "ai" },
    }
  },

  parseHTML() {
    return [{ tag: "ins" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["ins", mergeAttributes(HTMLAttributes), 0]
  },
})

export const Deleted = Mark.create({
  name: "deleted",

  parseHTML() {
    return [{ tag: "del" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["del", HTMLAttributes, 0]
  },
})

export function Editor({
  markdown,
  onChange
}: {
  markdown: string
  onChange?: (md: string) => void
}) {
  const [mode, setMode] = useState<"default" | "ai" | "confirm">("default");
  const editor = useEditor({
    contentType: "markdown",
    immediatelyRender: false,
    extensions: [
      Markdown.configure({
        markedOptions: {
          silent: true
        }
      }),
      SelectionCustom,
      Diff,
      Heading,
      Document,
      Paragraph,
      Text,
      Bold,
      Inserted,
      Deleted,
      ListKit,
      UndoRedo,
      Placeholder.configure({
        placeholder: 'Start typing ...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      TrailingNode
    ],
    content: markdown,
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown()
      console.log(markdown)
      onChange?.(markdown)
    },
    editorProps: {
      attributes: {
        class: 'mx-auto focus:outline-none min-h-full px-3 py-2',
      },
    },
  })

  const menuRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    // 需要忽略BubbleMenu的最外层容器点击事件，防止无法点击空白处失去焦点
    node.className = 'pointer-events-none'
  }, [])

  useEffect(() => {
    editor?.on("focus", () => {
      setMode("default")
      editor?.commands.setTextSelection(0)
    })

    return () => {
      editor?.off("focus")
    }
  }, [editor]);

  if (!editor) {
    return null
  }

  return (
    <div className="h-full bg-background overflow-y-scroll rounded-lg border shadow">
      <TooltipProvider>
        <EditorContent editor={editor} />
        <BubbleMenu
          ref={menuRef}
          editor={editor}
          shouldShow={({ editor }) => {
            const { selection } = editor.state
            return (!selection.empty && editor.isFocused) || editor.isActive("inserted") || editor.isActive("deleted")
          }}
          options={{
            placement: 'bottom',
            offset: 8,
            flip: true,
          }}
          className="pointer-events-none"
          pluginKey={"toolbar"}
        >

          {
            mode === 'default' &&
            <FloatingToolbarOptions setMode={setMode} editor={editor}/>
          }
          {
            (mode === 'ai' || mode === 'confirm') &&
            <FloatingToolbarAi mode={mode} setMode={setMode} editor={editor}/>
          }
        </BubbleMenu>


      </TooltipProvider>
    </div>
  )
}
