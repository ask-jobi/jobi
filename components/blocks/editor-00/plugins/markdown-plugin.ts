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
import {EditorConfig, ElementNode, NodeKey, TextNode} from "lexical";

export type DiffStates = 'added' | 'removed' | 'unchanged'

export class DiffTextNode extends TextNode {
  __diffState: DiffStates = 'unchanged'

  constructor(text: string, diffState?: DiffStates, key?: NodeKey) {
    super(text, key);
    this.__diffState = diffState ?? 'unchanged';
  }

  static getType(): string {
    return 'diff-text';
  }

  static clone(node: DiffTextNode): DiffTextNode {
    return new DiffTextNode(node.__text, node.__diffState, node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    if (this.__diffState === 'removed') {
      element.style.color = "#d8d9d6"
      element.style.textDecoration = "line-through"
    }

    if (this.__diffState === 'added') {
      element.style.color = "#4281db"
      element.style.borderBottomStyle = "solid"
      element.style.borderBottomWidth = "2px"
      element.style.borderBottomColor = "#d8d9d6"
      element.style.paddingBottom = "1px"
    }
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);
    if (prevNode.__diffState !== this.__diffState) {
      if (this.__diffState === 'removed') {
        dom.style.color = "#d8d9d6"
        dom.style.textDecoration = "line-through"
      }

      if (this.__diffState === 'added') {
        dom.style.color = "#4281db"
        dom.style.borderBottomStyle = "solid"
        dom.style.borderBottomWidth = "2px"
        dom.style.borderBottomColor = "#d8d9d6"
        dom.style.paddingBottom = "1px"
      }
    }
    return isUpdated;
  }

  getDiffState() {
    return this.__diffState
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'diff-text',
      version: 1,
      diffState: this.__diffState,
    };
  }

  static importJSON(serializedNode: any): DiffTextNode {
    const node = new DiffTextNode(
      serializedNode.text,
      serializedNode.diffState
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }
}

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
