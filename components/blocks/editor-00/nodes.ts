import { HeadingNode } from "@lexical/rich-text"
import {
  $createParagraphNode,
  $getEditor,
  $getRoot, $isElementNode, $isParagraphNode, $isTextNode,
  EditorConfig, ElementNode,
  Klass,
  LexicalNode,
  LexicalNodeReplacement, NodeKey,
  ParagraphNode,
  TextNode,
} from "lexical"
import {HorizontalRuleNode} from "@lexical/react/LexicalHorizontalRuleNode";
import {AutoLinkNode, LinkNode} from "@lexical/link";
import {$isListItemNode, $isListNode, ListItemNode, ListNode} from "@lexical/list";
import {$convertFromMarkdownString} from "@lexical/markdown";
import {SUPPORT_TRANSFORMER} from "@/components/blocks/editor-00/plugins";
import {diffWords} from "diff";


export type DiffStates = 'added' | 'removed' | 'unchanged'

class DiffTextNode extends TextNode {
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

}

export function $createDiffTextNode(
  text: string,
  diffState: DiffStates
): DiffTextNode {
  return new DiffTextNode(text, diffState);
}

function $wrapTextNodeAsDiffTextNode(
  originalTextNode: TextNode,
  diffType: DiffStates,
): DiffTextNode {
  const text = originalTextNode.getTextContent();
  const format = originalTextNode.getFormat();
  const detail = originalTextNode.getDetail();
  const mode = originalTextNode.getMode();
  const style = originalTextNode.getStyle();

  const diffTextNode = $createDiffTextNode(text, diffType);

  diffTextNode.setFormat(format)
  diffTextNode.setDetail(detail);
  diffTextNode.setMode(mode);
  diffTextNode.setStyle(style);

  return diffTextNode;
}

const replaceDiffNode = (node: LexicalNode, diffState: DiffStates) => {
  if ($isElementNode(node)) {
    node.getAllTextNodes().forEach(textNode => {
      textNode.replace($wrapTextNodeAsDiffTextNode(textNode, diffState))
    })
  } else if ($isTextNode(node)) {
    node.replace($wrapTextNodeAsDiffTextNode(node, diffState))
  }
}

export function $calculateDiffWords(newMarkdown: string, node: ElementNode = $getRoot()) {
  const editor = $getEditor()

  editor.update(() => {
    const tempRoot = $createParagraphNode()
    $convertFromMarkdownString(newMarkdown, SUPPORT_TRANSFORMER, tempRoot)

    const oldNodes = node.getChildren()
    const newNodes = tempRoot.getChildren()

    node.clear();

    function processElementNodes(
      oldChildNodes: Array<LexicalNode>,
      newChildNodes: Array<LexicalNode>
    ): Array<LexicalNode> {
      const resultNodes: Array<LexicalNode> = [];
      let oldIdx = 0;
      let newIdx = 0;

      while (oldIdx < oldChildNodes.length || newIdx < newChildNodes.length) {
        const oldChildNode = oldChildNodes[oldIdx];
        const newChildNode = newChildNodes[newIdx];

        if (oldChildNode && newChildNode && oldChildNode.getType() === newChildNode.getType()) {
          // 1. 节点类型相同
          if ($isListNode(oldChildNode) && $isListNode(newChildNode)) {
            // 如果是 ListNode，递归处理其子 ListItemNode
            const newListNode = new ListNode(newChildNode.getListType(), newChildNode.getStart());
            const diffedListItems = processElementNodes(
              oldChildNode.getChildren(),
              newChildNode.getChildren()
            );
            diffedListItems.forEach(item => newListNode.append(item as ListItemNode));
            resultNodes.push(newListNode);
          } else if ($isListItemNode(oldChildNode) && $isListItemNode(newChildNode)) {
            // 如果是 ListItemNode，比较其内部的文本内容
            // ListItemNode 的子节点通常是 ParagraphNode 或其他 inline 节点
            const oldItemContent = oldChildNode.getTextContent();
            const newItemContent = newChildNode.getTextContent();

            const newListItem = new ListItemNode(newChildNode.getValue()); // 保留原有的 value

            if (oldItemContent === newItemContent) {
              // 内容相同，直接使用新节点（保持其原有结构）
              newListItem.append(...newChildNode.getChildren());
              resultNodes.push(newListItem);
            } else {
              // 内容不同，进行词级别 diff TODO 这里存在一个问题，因为直接对比的listitem的content，所以创建出来的节点会有格式丢失的问题
              const diffResult = diffWords(oldItemContent, newItemContent);
              diffResult.forEach(item => {
                const diffText = $createDiffTextNode(item.value,
                  item.added ? 'added' : item.removed ? 'removed' : 'unchanged'
                );
                // 这里需要将 DiffTextNode 包裹在 ParagraphNode 中，因为 ListItemNode 通常包含 ParagraphNode
                // 如果 ListItemNode 的子节点不是 ParagraphNode，则需要更复杂的逻辑来重建结构
                const lastNode = newListItem.getLastChild()
                if ($isParagraphNode(lastNode)) {
                  lastNode?.append(diffText);
                } else {
                  const newPara = $createParagraphNode();
                  newPara.append(diffText);
                  newListItem.append(newPara);
                }
              });
              resultNodes.push(newListItem);
            }
          } else if ($isParagraphNode(oldChildNode) && $isParagraphNode(newChildNode)) {
            // 已经是段落节点，进行词级别 diff
            const oldText = oldChildNode.getTextContent();
            const newText = newChildNode.getTextContent();

            if (oldText === newText) {
              // 内容相同，直接使用新节点
              resultNodes.push(newChildNode);
            } else {
              const newParagraph = $createParagraphNode();
              const diffResult = diffWords(oldText, newText);
              diffResult.forEach(item => {
                // TODO 如上TODO
                newParagraph.append($createDiffTextNode(item.value,
                  item.added ? 'added' : item.removed ? 'removed' : 'unchanged'
                ));
              });
              resultNodes.push(newParagraph);
            }
          } else {
            // 其他未知或不支持详细diff的相同类型 ElementNode
            // 简单处理：如果文本内容不同，则视为整个节点被替换
            if (oldChildNode.getTextContent() !== newChildNode.getTextContent()) {
              const removedPara = $createParagraphNode();
              removedPara.append($createDiffTextNode(oldChildNode.getTextContent(), 'removed'));
              resultNodes.push(removedPara);

              const addedPara = $createParagraphNode();
              addedPara.append($createDiffTextNode(newChildNode.getTextContent(), 'added'));
              resultNodes.push(addedPara);
            } else {
              resultNodes.push(newChildNode); // 内容相同，直接保留
            }
          }
          oldIdx++;
          newIdx++;
        } else if (oldChildNode && (!newChildNode || oldChildNode.getType() !== newChildNode.getType())) {
          // 2. 旧节点存在，但新节点不存在 或 类型不同 -> 标记为“removed”
          replaceDiffNode(oldChildNode, "removed")
          resultNodes.push(oldChildNode);
          oldIdx++;
        } else if (newChildNode && (!oldChildNode || oldChildNode.getType() !== newChildNode.getType())) {
          // 3. 新节点存在，但旧节点不存在 或 类型不同 -> 标记为“added”
          replaceDiffNode(newChildNode, "added")
          resultNodes.push(newChildNode);
          newIdx++;
        }
      }
      return resultNodes;
    }

    // 从根节点开始处理差异
    const finalDiffedNodes = processElementNodes(oldNodes, newNodes);

    // 将所有差异化处理后的节点添加到编辑器中
    finalDiffedNodes.forEach(p => {
      node.append(p);
    });
  })
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
    HeadingNode,
  ]
