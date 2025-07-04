import {
  $convertFromMarkdownString, $convertToMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE, BOLD_STAR, BOLD_UNDERSCORE,
  ElementTransformer,
  INLINE_CODE, ITALIC_STAR, ITALIC_UNDERSCORE, LINK,
  ORDERED_LIST, STRIKETHROUGH,
  UNORDERED_LIST
} from "@lexical/markdown";
import {$isParagraphNode, ElementNode, ParagraphNode} from "lexical";

const PARAGRAPH: ElementTransformer = {
  dependencies: [ParagraphNode],
  export: (node, exportChildren) => {
    if (!$isParagraphNode(node)) return null;
    return exportChildren(node);
  },
  regExp: /^/, // 不需要
  replace: () => {},
  type: 'element'
};


const IMPORT_TRANSFORM = [
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
  PARAGRAPH,
  ...IMPORT_TRANSFORM
]

export const $exportMarkdown = (node?: ElementNode): string => {
  return $convertToMarkdownString(EXPORT_TRANSFORMER, node)
}

export const $importMarkdown = (markdown: string, node?: ElementNode) => {
  $convertFromMarkdownString(markdown, IMPORT_TRANSFORM, node)
}
