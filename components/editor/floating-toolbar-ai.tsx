import { motion } from 'motion/react';
import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {Editor} from "@tiptap/react";
import {CheckIcon, ListMinus, ListPlus, Loader, SparklesIcon, TrashIcon, WandIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useResume, useResumeLanguage} from "@/lib/store/resume";
import {RewriteBlockRequest} from "@/types/api/requests";
import {Command, CommandItem, CommandList} from '@/components/ui/command';
import {toast} from "sonner";
import {calculateDiffJsonContent} from "./diff";
import {JSONContent} from "@tiptap/core";

function FloatingToolbarAi({
                             mode,
                             editor
                           }: {
  mode: 'default' | 'ai' | 'confirm',
  editor: Editor
}) {
  const {jobDescription} = useResume()
  const resumeLanguage = useResumeLanguage()
  const [loading, setLoading] = useState<boolean>(false)
  const [instruction, setInstruction] = useState<string>('')
  const commandRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current!!.focus()
      })
    }
  }, [editor])

  const handleRejectAI = () => {
    if (mode === "confirm") {
      const success = editor.chain().focus().rejectDiff().run()
      if (success) {
        editor.commands.setMode("default")
      }
    }
  }

  const handleApplyAI = () => {
    if (mode === "confirm") {
      const success = editor.chain().focus().applyDiff().run()
      if (success) {
        editor.commands.setMode("default")
        toast.success("Changes applied")
      } else {
        toast.error("No content to apply")
      }
    }
  }

  // const ref = useClickOutside(() => {
  //   handleRejectAI()
  // })

  const submitAi = async (instruction: string) => {
    setLoading(true)

    let {from, to} = editor.extensionStorage.selection
    if (!from && !to) {
      from = editor.state.selection.from
      to = editor.state.selection.to
    }

    const slice = editor.state.doc.slice(from!!, to!!)
    const json = slice.content.toJSON()

    // {type: 'doc', content: json} 必须使用doc包装一层，不然导出的markdown格式有问题
    const originalContent = editor.markdown!!.serialize({type: 'doc', content: json})
    const resumeSection = editor.getMarkdown()

    const body: RewriteBlockRequest = {
      resumeSection: resumeSection,
      originalContent: originalContent,
      jd: jobDescription?.description ?? 'Empty JD',
      instruction: instruction,
      language: resumeLanguage
    }
    const resp = await fetch(`/api/resume/rewrite-block`, {
      method: "POST",
      body: JSON.stringify(body)
    })
    const result = await resp.json()
    if (!resp.ok) {
      setLoading(false)
      toast.error(result.error)
      return
    }

    // 解析原始内容和AI生成的内容
    const beforeJsonContent = editor.markdown!!.parse(originalContent)
    const afterJsonContent = editor.markdown!!.parse(result)

    // 计算差异
    const diffContent = calculateDiffJsonContent(beforeJsonContent, afterJsonContent)

    // 使用插件命令设置差异内容（会自动应用到编辑器）
    editor.chain()
      .setDiffContent({
        originalSelection: { from: from!!, to: to!! },
        originalContent: json as JSONContent,
        diffContent
      })
      .run()

    setInstruction("")
    setLoading(false)
    editor.commands.setMode("confirm")
  }

  const handleSubmitAi = async (e: any) => {
    e.preventDefault();

    await submitAi(instruction)
  }

  return (
    <>
      <motion.div
        className="flex relative pointer-events-auto"
        initial={{opacity: 0, scale: 0.93}}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          type: "spring",
          duration: 0.25,
        }}
        style={{
          zIndex: 9999,
          width: editor.view.dom.clientWidth - 52
        }}
      >
        <motion.div
          transition={{duration: 0}}
          className="w-full relative"
        >
          <Input
            className="block w-full shadow-xl border p-2 pl-3 rounded-lg outline-none disabled:transition-colors bg-white"
            placeholder="Ask AI anything..."
            ref={inputRef}
            value={instruction}
            disabled={loading}
            onMouseDownCapture={e => {
              e.stopPropagation()
              inputRef.current?.focus()
            }}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleSubmitAi}
            disabled={loading || instruction.length === 0}
            className="absolute h-full cursor-pointer right-0 px-2 top-0 disabled:opacity-50 hover:enabled:bg-gray-100 disabled:transition-opacity"
          >
            {
              loading ?
                <Loader className="animate-spin w-12 h-12 text-blue-500"/> :
                <SparklesIcon
                  className="text-indigo-500 disabled:transition-opacity"
                />
            }
          </Button>
        </motion.div>
      </motion.div>
      {
        !loading &&
        <motion.div
          layoutId="floating-toolbar-command-panel"
          layout="size"
          className="origin-top-left pointer-events-auto"
          initial={{opacity: 0, scale: 0.93, width: "fit-content"}}
          animate={{
            opacity: 1,
            scale: 1
          }}
          transition={{
            type: "spring",
            duration: 0.25,
          }}
        >
          <Command
            ref={commandRef}
            tabIndex={0}
            shouldFilter={false}
            className="z-10 relative mt-1 rounded-lg border shadow-2xl border-gray-300/75 bg-card w-[210px] max-h-[360px] overflow-y-auto pointer-events-auto"
          >
            <CommandList className="rounded-lg">
              {
                mode === 'ai' &&
                <>
                  <CommandItemWithIcon
                    icon={<WandIcon className="h-full text-indigo-500" />}
                    onSelect={async () => {
                      await submitAi("Improve the clarity, structure, and readability of the text without changing its original meaning. Use concise and professional language. Do not add new information.")
                    }}
                  >
                    Improve writing
                  </CommandItemWithIcon>
                  <CommandItemWithIcon
                    icon={<ListMinus className="h-full text-indigo-500" />}
                    onSelect={async () => {
                      await submitAi("Simplify the text by making it shorter and easier to understand. Keep the original meaning, but remove unnecessary complexity, jargon, or redundant details.")
                    }}
                  >
                    Simplify
                  </CommandItemWithIcon>
                  <CommandItemWithIcon
                    icon={<ListPlus className="h-full text-indigo-500" />}
                    onSelect={async () => {
                      await submitAi("Expand the text by adding more depth and explanation. Only elaborate on information already present in the text. Do not invent facts or add unverifiable details.")
                    }}
                  >
                    Add more detail
                  </CommandItemWithIcon>
                </>
              }
              {
                mode === 'confirm' &&
                <>
                  <CommandItemWithIcon
                    icon={<CheckIcon className="h-full" />}
                    onSelect={() => {
                      handleApplyAI()
                    }}
                  >
                    Apply
                  </CommandItemWithIcon>
                  <CommandItemWithIcon
                    icon={<TrashIcon className="h-full text-gray-500" />}
                    onSelect={() => {
                      handleRejectAI()
                    }}
                  >
                    Reject
                  </CommandItemWithIcon>
                </>
              }
            </CommandList>
          </Command>
        </motion.div>
      }
    </>
  );
}

function CommandItemWithIcon({
                       children,
                       icon,
                       onSelect,
                     }: {
  children: ReactNode;
  icon?: ReactNode;
  onSelect: ((value: string) => void) | undefined;
}) {
  return (
    <CommandItem
      onSelect={onSelect}
      onMouseDown={(e) => {
        // Preserve text editor selection
        e.preventDefault();
      }}
    >
      <motion.div className="flex justify-between items-center" layout={false}>
        <div className="flex items-center gap-1">
          {icon ? (
            <div className="w-5 h-[16px] text-indigo-500 flex items-center justify-center -ml-1">
              {icon}
            </div>
          ) : null}
          {children}
        </div>
        <div></div>
      </motion.div>
    </CommandItem>
  );
}

export default FloatingToolbarAi;
