import {EditorConfig, TextNode} from "lexical";

export class SelectionHighlightNode extends TextNode {
  static getType(): string {
    return "selection-highlight";
  }

  static clone(node: SelectionHighlightNode): SelectionHighlightNode {
    return new SelectionHighlightNode(node.__text, node.__key);
  }

  constructor(text: string, key?: string) {
    super(text, key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.backgroundColor = "#B2D7FD";
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    super.updateDOM(prevNode, dom, config);
    return false;
  }
}

export function $createSelectionHighlightNode(text: string): SelectionHighlightNode {
  return new SelectionHighlightNode(text);
}

export function $isSelectionHighlightNode(node: unknown): node is SelectionHighlightNode {
  return node instanceof SelectionHighlightNode;
}
