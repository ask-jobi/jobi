import {FC, useLayoutEffect, useState} from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {useRange} from "@/components/blocks/editor-00/hooks/use-range";
import {useMouseListener} from "@/components/blocks/editor-00/hooks/use-mouse-listener";
import {autoUpdate, useFloating, hide, limitShift, offset, shift, size} from "@floating-ui/react-dom";
import Toolbar from "@/components/blocks/editor-00/plugins/toolbar-plugin/toolbar";
import {Portal} from "@radix-ui/react-portal"
import {FocusScope} from "@radix-ui/react-focus-scope";

const ToolbarPlugin: FC = () => {
  const padding = 20
  const [editor] = useLexicalComposerContext();
  const [mode, setMode] = useState<"default" | "ai" | "closed">("default");
  const {range, rangeRef} = useRange()
  const [mouseSelection, setMouseSelection] = useState<boolean>(false)

  const {
    refs: { setReference, setFloating },
    strategy,
    x,
    y,
  } = useFloating({
    strategy: "fixed",
    placement: "bottom",
    middleware: [
      offset(10),
      hide({ padding }),
      shift({ padding, limiter: limitShift() }),
      size({ padding })
    ],
    whileElementsMounted: (...args) => {
      return autoUpdate(...args, {
        animationFrame: true,
      });
    },
  });

  useLayoutEffect(() => {
    setMode("default")
    setReference({
      getBoundingClientRect: () =>
        range?.getBoundingClientRect() || new DOMRect(),
    });
  }, [setReference, range]);

  useMouseListener((mouse) => {
    setTimeout(() => {
      setTimeout(() => {
        setMouseSelection(rangeRef.current === null && mouse === "down")
      })
    })
  })

  if (mode === 'closed' || range === null|| mouseSelection) {
    return null;
  }


  return (
    <Portal>
      <FocusScope>
        <div
          ref={setFloating}
          tabIndex={0}
          className="pointer-events-auto"
          style={mode === 'ai' && editor._rootElement ?
          {
            position: strategy,
            top: 0,
            left: editor._rootElement.getBoundingClientRect().left + 40,
            zIndex: 100,
            transform: `translate3d(0, ${Math.round(y)}px, 0)`,
            width:
              editor._rootElement.getBoundingClientRect().width - 52,
          } :
          {
            position: strategy,
            top: 0,
            left: 0,
            zIndex: 100,
            transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`,
          }}
        >
          <Toolbar mode={mode} setMode={setMode}/>
        </div>
      </FocusScope>
    </Portal>
  );
};

export default ToolbarPlugin;
