import { motion } from 'motion/react';
import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {CheckIcon, ListMinus, ListPlus, Loader, SparklesIcon, TrashIcon, WandIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useAtom} from "jotai";
import {selectedSectionIdAtom, useResume, useResumeLanguage} from "@/lib/store/resume";
import {NodeSelection} from "lexical";
import {RewriteBlockRequest} from "@/types/api/requests";
import {$exportMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {
  $calculateDiffWords,
  $getMarkdownFromSelection,
  $getSelectionElementNodes
} from "@/components/blocks/editor-00/utils";
import {APPLY_DIFF_COMMAND, REJECT_DIFF_COMMAND} from "@/components/blocks/editor-00/plugins/diff-md-plugin";
import {
  SHOW_SELECTION_HIGHLIGHT_COMMAND,
  HIDE_SELECTION_HIGHLIGHT_COMMAND,
} from "@/components/blocks/editor-00/plugins/preserve-selection-plugin";
import {Command, CommandItem, CommandList} from '@/components/ui/command';
import {toast} from "sonner";
import {useClickOutside} from "@mantine/hooks";

function FloatingToolbarAi({
                             setMode
                           }: {
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {
  const [selectedSectionId] = useAtom(selectedSectionIdAtom);
  const {jobDescription} = useResume()
  const resumeLanguage = useResumeLanguage()
  const [editor] = useLexicalComposerContext();
  const [loading, setLoading] = useState<boolean>(false)
  const [instruction, setInstruction] = useState<string>('')
  const [AIState, setAIState] = useState<"asking" | "confirm">("asking")
  const commandRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      // 这里必须延迟调用，似乎是SHOW_SELECTION_HIGHLIGHT_COMMAND的会打断input focus
      setTimeout(() => {
        inputRef.current!!.focus()
      })
    }
    // Show selection highlight when AI toolbar appears
    // TODO 处理回滚时，toolbar和highlight段落的展示方式
    editor.dispatchCommand(SHOW_SELECTION_HIGHLIGHT_COMMAND, null);

    return () => {
      // Hide selection highlight when AI toolbar closes
      editor.dispatchCommand(HIDE_SELECTION_HIGHLIGHT_COMMAND, null);
    };
  }, [editor])

  const handleRejectAI = () => {
    setTimeout(() => {
      setMode("closed")
      if (AIState === "confirm") {
        editor.dispatchCommand(REJECT_DIFF_COMMAND, null)
      }
    }, 0)
  }

  const handleApplyAI = () => {
    setTimeout(() => {
      setMode("closed")
      if (AIState === "confirm") {
        editor.dispatchCommand(APPLY_DIFF_COMMAND, null)
      }
    }, 0)
  }

  const ref = useClickOutside(() => {
    handleRejectAI()
  })

  const submitAi = async (instruction: string) => {
    let selection: NodeSelection
    let originalContent = ""
    let resumeSection = ""

    editor.read(() => {
      setLoading(true)

      selection = $getSelectionElementNodes()
      originalContent = $getMarkdownFromSelection(selection)
      resumeSection = $exportMarkdown()
    })

    const body: RewriteBlockRequest = {
      resumeSection: resumeSection,
      originalContent: originalContent,
      context: {
        sectionType: selectedSectionId!!,
        jd: jobDescription?.description ?? 'Empty JD'
      },
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

    editor.update(() => {
      $calculateDiffWords(selection, originalContent, result.optimizedContent)
    }, {tag: 'historic'})

    setInstruction("")

    // Restore text editor selection when prompt submitted
    // editor.dispatchCommand(RESTORE_SELECTION_COMMAND, null);
    setLoading(false)
    setAIState("confirm")
  }

  const handleSubmitAi = async (e: any) => {
    e.preventDefault();

    await submitAi(instruction)
  }

  return (
    <>
      <motion.div
        ref={ref}
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
        style={{zIndex: 9999}}
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
            onMouseDown={(e) => {
              // Prevent clicks outside of items from removing selection
              e.preventDefault();
            }}
            className="z-10 relative mt-1 rounded-lg border shadow-2xl border-gray-300/75 bg-card w-[210px] max-h-[360px] overflow-y-auto pointer-events-auto"
          >
            <CommandList className="rounded-lg">
              {
                AIState === 'asking' &&
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
                AIState === 'confirm' &&
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
