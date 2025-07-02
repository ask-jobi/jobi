import {useState} from "react"
import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary"
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin"
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HEADING, INLINE_CODE, ITALIC_STAR,
  ITALIC_UNDERSCORE, LINK, ORDERED_LIST,
  STRIKETHROUGH,
  UNORDERED_LIST
} from "@lexical/markdown"
import {ContentEditable} from "@/components/editor/editor-ui/content-editable"
import {MarkdownShortcutPlugin} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {TabIndentationPlugin} from "@lexical/react/LexicalTabIndentationPlugin";
import {ListPlugin} from "@lexical/react/LexicalListPlugin";
import ToolbarPlugin from "@/components/blocks/editor-00/plugins/toolbar-plugin";
import DraggableBlockPlugin from "@/components/blocks/editor-00/plugins/draggable-block-plugin";
import {PreserveSelectionPlugin} from "@/components/blocks/editor-00/plugins/PreserveSelectionPlugin";

export const SUPPORT_TRANSFORMER = [
  HEADING,
  UNORDERED_LIST,
  ORDERED_LIST,
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  LINK
]

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  // TODO 添加history插件
  return (
    <div className="relative h-full">
      <ToolbarPlugin/>
      <div className="relative h-full">
        <RichTextPlugin
          contentEditable={
            <div className="h-full" ref={onRef}>
              <ContentEditable placeholder={"Start typing ..."}/>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MarkdownShortcutPlugin
          transformers={SUPPORT_TRANSFORMER}
        />
        <TabIndentationPlugin/>
        <ListPlugin/>
        {
          floatingAnchorElem && <DraggableBlockPlugin anchorElem={floatingAnchorElem}/>
        }
        {/* editor plugins */}
      </div>
      <PreserveSelectionPlugin/>
      {/* actions plugins */}
    </div>
  )
}
