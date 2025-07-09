import {useState} from "react"
import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary"
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin"
import {ContentEditable} from "@/components/editor/editor-ui/content-editable"
import {MarkdownShortcutPlugin} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {TabIndentationPlugin} from "@lexical/react/LexicalTabIndentationPlugin";
import {ListPlugin} from "@lexical/react/LexicalListPlugin";
import ToolbarPlugin from "@/components/blocks/editor-00/plugins/toolbar-plugin";
import DraggableBlockPlugin from "@/components/blocks/editor-00/plugins/draggable-block-plugin";
import {PreserveSelectionPlugin} from "@/components/blocks/editor-00/plugins/preserve-selection-plugin";
import {EXPORT_TRANSFORMER} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

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
          transformers={EXPORT_TRANSFORMER}
        />
        <TabIndentationPlugin/>
        <ListPlugin/>
        {
          floatingAnchorElem && <DraggableBlockPlugin anchorElem={floatingAnchorElem}/>
        }
        {/* editor plugins */}
      </div>
      <PreserveSelectionPlugin/>
      <HistoryPlugin/>
      {/* actions plugins */}
    </div>
  )
}
