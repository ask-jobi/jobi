import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {useEffect, useRef} from "react";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  $isTextNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_LOW, createCommand,
  LexicalCommand,
  RangeSelection, ElementNode, DecoratorNode, $isElementNode
} from "lexical";
import {$createSelectionHighlightNode} from "@/components/blocks/editor-00/nodes/selection-highlight-node";

export const SAVE_SELECTION_COMMAND: LexicalCommand<null> = createCommand();
export const RESTORE_SELECTION_COMMAND: LexicalCommand<null> = createCommand();
export const SHOW_SELECTION_HIGHLIGHT_COMMAND: LexicalCommand<null> = createCommand();
export const HIDE_SELECTION_HIGHLIGHT_COMMAND: LexicalCommand<null> = createCommand();

export function PreserveSelectionPlugin() {
  const [editor] = useLexicalComposerContext();
  const savedSelection = useRef<RangeSelection | null>(null);

  useEffect(() => {
    const saveSelection = () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        savedSelection.current = selection;
      }
      return true;
    };

    const restoreSelection = () => {
      if (savedSelection.current) {
        $setSelection(savedSelection.current);
      }
      return true;
    };

    // Show selection highlight
    const showSelectionHighlight = () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          const selectedNodes = selection.getNodes();

          const allChildrenNodes = selectedNodes
            .map(it => it.getTopLevelElement())
            .reduce((prev, cur) => {
              if (cur && !prev.some(it => it?.getKey() === cur?.getKey())) {
                prev.push(cur);
              }
              return prev;
            }, [] as (ElementNode | DecoratorNode<any>)[])
            .flatMap(it => {
              if ($isElementNode(it)) {
                return it.getAllTextNodes()
              }
            })

          allChildrenNodes.forEach((node) => {
            if ($isTextNode(node)) {
              // Wrap the entire TextNode with SelectionHighlightNode
              const textContent = node.getTextContent();
              const highlightNode = $createSelectionHighlightNode(textContent);

              // Replace the original text node with highlighted version
              node.replace(highlightNode);
            }
          });
        }
      }, {tag: 'historic'});
      return true;
    };

    // Hide selection highlight
    const hideSelectionHighlight = () => {
      editor.update(() => {
        const root = $getRoot();
        const allTextNodes = root.getAllTextNodes();
        allTextNodes.forEach((textNode) => {
          if (textNode.getType() === 'selection-highlight') {
            const textContent = textNode.getTextContent();
            const plainTextNode = $createTextNode(textContent);
            textNode.replace(plainTextNode);
          }
        });
      }, {tag: 'historic'});
      return true;
    };

    const unregisterSaveCommand = editor.registerCommand(
      SAVE_SELECTION_COMMAND,
      saveSelection,
      COMMAND_PRIORITY_LOW
    );

    const unregisterRestoreCommand = editor.registerCommand(
      RESTORE_SELECTION_COMMAND,
      restoreSelection,
      COMMAND_PRIORITY_LOW
    );

    const unregisterShowHighlight = editor.registerCommand(
      SHOW_SELECTION_HIGHLIGHT_COMMAND,
      showSelectionHighlight,
      COMMAND_PRIORITY_LOW
    );

    const unregisterHideHighlight = editor.registerCommand(
      HIDE_SELECTION_HIGHLIGHT_COMMAND,
      hideSelectionHighlight,
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterSaveCommand();
      unregisterRestoreCommand();
      unregisterShowHighlight();
      unregisterHideHighlight();
    };
  }, [editor, savedSelection]);

  return null;
}
