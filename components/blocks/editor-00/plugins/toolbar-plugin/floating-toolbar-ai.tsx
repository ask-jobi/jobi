import { motion } from 'motion/react';
import React, {useState} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {SparklesIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useAtom} from "jotai";
import {selectedSectionIdAtom} from "@/lib/store/resume";
import {$calculateDiffWords} from "@/components/blocks/editor-00/nodes";

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

    editor.read(() => {
      setLoading(true)

      // const root = $getRoot()
      // const originalContent = $convertToMarkdownString(SUPPORT_TRANSFORMER, root)
      // const body: RewriteBlockRequest = {
      //   originalContent: originalContent,
      //   context: {
      //     sectionType: selectedSectionId!!,
      //     jd: 'Empty JD'
      //   },
      //   instruction: instruction
      // }
      // const resp = await fetch(`/api/resume/rewrite-block`, {
      //   method: "POST",
      //   body: JSON.stringify(body)
      // })
      // const result = await resp.json()
      const result = "- Implemented AWS ElastiCache with Redis caching, improving system performance by 10x and accelerating response times for hot data.\n" +
        "- Reduced mean time to detection (MTTD) from 3 hours to under 15 minutes by implementing DataDog monitoring and dashboards, enhancing system reliability.\n" +
        "- Migrated legacy systems to services using Kotlin, Spring Webflux, and hexagonal architecture, improving scalability.\n" +
        "- Led technical excellence initiatives, streamlining technical strategies through technical evolution meetings.\n" +
        "hello **World**"
      $calculateDiffWords(result)
      setInstruction("")

      // Restore text editor selection when prompt submitted
      // editor.dispatchCommand(RESTORE_SELECTION_COMMAND, null);
      setLoading(false)
    })
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
