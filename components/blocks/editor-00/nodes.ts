import {EditorConfig, Klass, LexicalNode, LexicalNodeReplacement, NodeKey, ParagraphNode, TextNode,} from "lexical"
import {HorizontalRuleNode} from "@lexical/react/LexicalHorizontalRuleNode";
import {AutoLinkNode, LinkNode} from "@lexical/link";
import {ListItemNode, ListNode} from "@lexical/list";

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

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> =
  [
    DiffTextNode,
    ParagraphNode,
    TextNode,
    LinkNode,
    AutoLinkNode,
    ListNode,
    ListItemNode,
    HorizontalRuleNode,
  ]
