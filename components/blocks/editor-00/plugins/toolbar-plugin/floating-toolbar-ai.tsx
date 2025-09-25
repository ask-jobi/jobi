import { motion } from 'motion/react';
import React, {ReactNode, useEffect, useRef, useState} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {CheckIcon, ListMinus, ListPlus, Loader, SparklesIcon, TrashIcon, WandIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useAtom} from "jotai";
import {selectedSectionIdAtom, useResumeLanguage} from "@/lib/store/resume";
import {NodeSelection} from "lexical";
import {RewriteBlockRequest} from "@/types/api/requests";
import {$exportMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {useClickOutside} from "@mantine/hooks";
import {
  $calculateDiffWords,
  $getMarkdownFromSelection,
  $getSelectionElementNodes
} from "@/components/blocks/editor-00/utils";
import {APPLY_DIFF_COMMAND, REJECT_DIFF_COMMAND} from "@/components/blocks/editor-00/plugins/diff-md-plugin";
import {Command, CommandItem, CommandList} from '@/components/ui/command';
import {toast} from "sonner";

function FloatingToolbarAi({
                             setMode
                           }: {
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {
  const [selectedSectionId] = useAtom(selectedSectionIdAtom);
  const resumeLanguage = useResumeLanguage()
  const [editor] = useLexicalComposerContext();
  const [loading, setLoading] = useState<boolean>(false)
  const [instruction, setInstruction] = useState<string>('')
  const [AIState, setAIState] = useState<"asking" | "confirm">("asking")
  const commandRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (commandRef.current) {
      commandRef.current.focus()
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

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

  const handleSubmitAi = async (e: any) => {
    e.preventDefault();

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
        jd: 'Empty JD'
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
    })

    setInstruction("")

    // Restore text editor selection when prompt submitted
    // editor.dispatchCommand(RESTORE_SELECTION_COMMAND, null);
    setLoading(false)
    setAIState("confirm")
  }

  return (
    <>
      <motion.div
        ref={ref}
        className="flex relative"
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
          className="origin-top-left"
          initial={{opacity: 0, scale: 0.93}}
          animate={{
            opacity: 1,
            scale: 1,
            width: "initial",
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
            className="z-10 relative mt-1 rounded-lg border shadow-2xl border-gray-300/75 bg-card max-w-[210px] max-h-[360px] overflow-y-auto pointer-events-auto"
          >
            <CommandList className="rounded-lg">
              {
                AIState === 'asking' &&
                <>
                  <CommandItemWithIcon
                    icon={<WandIcon className="h-full text-indigo-500" />}
                    onSelect={() => {
                    }}
                  >
                    Improve writing
                  </CommandItemWithIcon>
                  <CommandItemWithIcon
                    icon={<ListMinus className="h-full text-indigo-500" />}
                    onSelect={() => {
                    }}
                  >
                    Simplify
                  </CommandItemWithIcon>
                  <CommandItemWithIcon
                    icon={<ListPlus className="h-full text-indigo-500" />}
                    onSelect={() => {

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
