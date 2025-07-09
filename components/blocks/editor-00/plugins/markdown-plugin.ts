import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  STRIKETHROUGH,
  TextMatchTransformer,
  UNORDERED_LIST
} from "@lexical/markdown";
import {ElementNode} from "lexical";
import {DiffStates, DiffTextNode} from "@/components/blocks/editor-00/nodes";

export const DIFF_TEXT: TextMatchTransformer = {
  dependencies: [DiffTextNode],
  export: (node, exportChildren) => {
    if (!(node instanceof DiffTextNode)) return null;
    if (node.getDiffState() === "added") {
      return `[+${node.getTextContent()}+]`;
    } else if (node.__diffState === "removed") {
      return `[-${node.getTextContent()}-]`;
    }
    return null;
  },
  importRegExp: /(\[\+([^\[\]]+)\+\]|\[\-([^\[\]]+)\-\])/,
  regExp: /(\[\+([^\[\]]+)\+\]|\[\-([^\[\]]+)\-\])$/,
  replace: (textNode, match) => {
    const [, , addedContent, removedContent] = match
    const diffType: DiffStates = addedContent ? "added" : "removed"
    const content = addedContent ?? removedContent
    if (!content) return

    const node = new DiffTextNode(content, diffType)
    node.setFormat(textNode.getFormat())
    textNode.replace(node)
    return node
  },
  trigger: ']',
  type: 'text-match'
};


const IMPORT_TRANSFORM = [
  DIFF_TEXT,
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

export const EXPORT_TRANSFORMER = [
  ...IMPORT_TRANSFORM
]

export const $exportMarkdown = (node?: ElementNode): string => {
  return $convertToMarkdownString(EXPORT_TRANSFORMER, node)
}

export const $importMarkdown = (markdown: string, node?: ElementNode) => {
  $convertFromMarkdownString(markdown, IMPORT_TRANSFORM, node)
}
