import {FC, useEffect, useLayoutEffect, useState} from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {useRange} from "@/components/blocks/editor-00/hooks/use-range";
import {useMouseListener} from "@/components/blocks/editor-00/hooks/use-mouse-listener";
import {autoUpdate, useFloating, hide, limitShift, offset, shift, size} from "@floating-ui/react-dom";
import Toolbar from "@/components/blocks/editor-00/plugins/toolbar-plugin/toolbar";
import {Portal} from "@radix-ui/react-portal"
import {FocusScope} from "@radix-ui/react-focus-scope";
import {usePrevious} from "@mantine/hooks";

const ToolbarPlugin: FC = () => {
  const padding = 20
  const [editor] = useLexicalComposerContext();
  const [mode, setMode] = useState<"default" | "ai" | "closed">("closed");
  const {range} = useRange()
  const [mouseSelection, setMouseSelection] = useState<boolean>(false)
  const prevMode = usePrevious(mode)

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

  useEffect(() => {
    if (prevMode === "ai") return;
    // 什么情况下打开floating toolbar (default模式), 同时满足以下条件
    // 1. 实际选择了一个段落(range !== null) 并且排除了折叠的情况(!range.collapsed)
    // 2. 鼠标抬起时(防止拖动时出现floating toolbar, !mouseSelection)
    // 3. 当前floating toolbar处于关闭状态(mode === 'closed')

    // 什么情况下关闭floating toolbar (default模式)
    // 1. 没有选择任何一个段落(range === null || range.collapsed)

    // 什么情况下关闭floating toolbar (ai模式)
    // 1. click outside
    // 2. 手动关闭
    if (range && !range.collapsed && !mouseSelection) {
      if (prevMode === 'closed') {
        setMode("default");
      }
    } else {
      if (prevMode !== 'closed') {
        setMode("closed")
      }
    }
  }, [range, mouseSelection, prevMode]);

  useLayoutEffect(() => {
    setReference({
      getBoundingClientRect: () =>
        range?.getBoundingClientRect() || new DOMRect(),
    });
  }, [setReference, range]);

  useMouseListener((mouse) => {
    setTimeout(() => {
      setMouseSelection(mouse === "down")
    })
  })

  if (mode === 'closed') {
    return null;
  }

  return (
    <Portal>
      <FocusScope>
        <div
          ref={setFloating}
          tabIndex={0}
          className="pointer-events-auto"
          onMouseDown={e => e.stopPropagation()}
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
