import { motion } from 'motion/react';
import React, {useState} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {SparklesIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useAtom} from "jotai";
import {selectedSectionIdAtom} from "@/lib/store/resume";
import {
  $calculateDiffWords,
  $getMarkdownFromSelection,
  $getSelectionElementNodes
} from "@/components/blocks/editor-00/nodes";
import {$getRoot, NodeSelection} from "lexical";
import {RewriteBlockRequest} from "@/types/api/requests";
import {$exportMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";

function FloatingToolbarAi({
                             setMode
                           }: {
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {
  const [selectedSectionId] = useAtom(selectedSectionIdAtom);
  const [editor] = useLexicalComposerContext();
  const [loading, setLoading] = useState<boolean>(false)
  const [instruction, setInstruction] = useState<string>('')

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let selection: NodeSelection
    let originalContent = ""
    let root
    let resumeSection = ""

    editor.read(() => {
      setLoading(true)

      selection = $getSelectionElementNodes()
      originalContent = $getMarkdownFromSelection(selection)
      root = $getRoot()
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
      className="flex relative"
      style={{ zIndex: 9999 }}
    >
      <motion.form
        layout="position"
        transition={{duration: 0}}
        onSubmit={handleSubmit}
        className="w-full relative"
      >
        <Input
          className="block w-full shadow-xl border p-2 pl-3 rounded-lg outline-none disabled:transition-colors bg-white"
          placeholder="Ask AI anything..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute h-full cursor-pointer right-0 px-2 top-0 disabled:opacity-50 hover:enabled:bg-gray-100 disabled:transition-opacity"
        >
          <SparklesIcon
            className="text-indigo-500 disabled:transition-opacity"
          />
        </Button>
      </motion.form>
    </motion.div>
  );
}

export default FloatingToolbarAi;
