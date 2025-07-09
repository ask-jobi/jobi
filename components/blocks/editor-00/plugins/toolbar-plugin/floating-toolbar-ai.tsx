import { motion } from 'motion/react';
import React, {useState} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {SparklesIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useAtom} from "jotai";
import {selectedSectionIdAtom} from "@/lib/store/resume";
import {NodeSelection} from "lexical";
import {RewriteBlockRequest} from "@/types/api/requests";
import {$exportMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {useClickOutside} from "@mantine/hooks";
import {
  $calculateDiffWords,
  $getMarkdownFromSelection,
  $getSelectionElementNodes
} from "@/components/blocks/editor-00/utils";

function FloatingToolbarAi({
                             setMode
                           }: {
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {
  const [selectedSectionId] = useAtom(selectedSectionIdAtom);
  const [editor] = useLexicalComposerContext();
  const [loading, setLoading] = useState<boolean>(false)
  const [instruction, setInstruction] = useState<string>('')

  const ref = useClickOutside(() => {
    setMode("closed")
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
      instruction: instruction
    }
    const resp = await fetch(`/api/resume/rewrite-block`, {
      method: "POST",
      body: JSON.stringify(body)
    })
    const result = await resp.json()

    editor.read(() => {
      $calculateDiffWords(selection, originalContent, result.optimizedContent)
    })

    setInstruction("")

    // Restore text editor selection when prompt submitted
    // editor.dispatchCommand(RESTORE_SELECTION_COMMAND, null);
    setLoading(false)

  }

  return (
    <motion.div
      ref={ref}
      className="flex relative"
      style={{ zIndex: 9999 }}
    >
      <motion.div
        transition={{duration: 0}}
        className="w-full relative"
      >
        <Input
          className="block w-full shadow-xl border p-2 pl-3 rounded-lg outline-none disabled:transition-colors bg-white"
          placeholder="Ask AI anything..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleSubmitAi}
          className="absolute h-full cursor-pointer right-0 px-2 top-0 disabled:opacity-50 hover:enabled:bg-gray-100 disabled:transition-opacity"
        >
          <SparklesIcon
            className="text-indigo-500 disabled:transition-opacity"
          />
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default FloatingToolbarAi;
