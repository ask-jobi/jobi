import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary"
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin"
import {ContentEditable} from "@/components/editor/editor-ui/content-editable"
import {MarkdownShortcutPlugin} from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {TabIndentationPlugin} from "@lexical/react/LexicalTabIndentationPlugin";
import {ListPlugin} from "@lexical/react/LexicalListPlugin";
import ToolbarPlugin from "@/components/blocks/editor-00/plugins/toolbar-plugin";
import {PreserveSelectionPlugin} from "@/components/blocks/editor-00/plugins/preserve-selection-plugin";
import {EXPORT_TRANSFORMER} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {HistoryPlugin} from "@lexical/react/LexicalHistoryPlugin";
import DiffMdPlugin from "@/components/blocks/editor-00/plugins/diff-md-plugin";

export function Plugins() {

  return (
    <div className="relative h-full">
      <ToolbarPlugin/>
      <div className="relative h-full">
        <RichTextPlugin
          contentEditable={
            <div className="h-full">
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
        {/* editor plugins */}
      </div>
      <PreserveSelectionPlugin/>
      <DiffMdPlugin/>
      <HistoryPlugin/>
      {/* actions plugins */}
    </div>
  )
}
