import { motion } from 'motion/react';
import React, {useEffect, useRef, useState} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {SparklesIcon} from "lucide-react";
import {Button} from "@/components/ui/button";

function FloatingToolbarAi({
                             setMode
                           }: {
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editor] = useLexicalComposerContext();
  const [instruction, setInstruction] = useState<string>('')

  useEffect(() => {
    if (inputRef.current) {
      console.log("focus")
      inputRef.current.focus()
    }
  }, []);

  return (
    <motion.div
      className="flex relative"
      style={{ zIndex: 9999 }}
    >
      <motion.form
        layout="position"
        transition={{duration: 0}}
        onSubmit={async (e) => {
          // Submit a custom prompt typed into the input
          e.preventDefault();
          setInstruction("");

          // Restore text editor selection when prompt submitted
          // editor.dispatchCommand(RESTORE_SELECTION_COMMAND, null);
        }}
        className="w-full relative"
      >
        <input
          ref={inputRef}
          className="block w-full shadow-xl border p-2 pl-3 rounded-lg outline-none disabled:transition-colors bg-white"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button
          onClick={() => {
            console.log("focus")
          }}
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
