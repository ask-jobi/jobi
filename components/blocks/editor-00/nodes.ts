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
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode
} from "@lexical/list";
import {$convertFromMarkdownString, $convertToMarkdownString} from "@lexical/markdown";
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

function processElementNode(
  oldNode: ElementNode,
  newNode: ElementNode
): ElementNode[] {
  const resultNodes: ElementNode[] = []
  const oldChildNodes = oldNode.getChildren()
  const newChildNodes = newNode.getChildren()

  let oldIdx = 0;
  let newIdx = 0;
  while (oldIdx < oldChildNodes.length || newIdx < newChildNodes.length) {
    const oldChildNode = oldChildNodes[oldIdx];
    const newChildNode = newChildNodes[newIdx];

    if (oldChildNode && newChildNode && oldChildNode.getType() === newChildNode.getType()) {
      // 代表类型一致的节点
      if ($isListNode(oldChildNode) && $isListNode(newChildNode)) {
        // list节点的子节点只可能时listItem，因此这里直接递归交给下一个分支处理
        const recursionResult = processElementNode(oldChildNode, newChildNode)
        const listNode = $createListNode(oldChildNode.getListType())
        listNode.append(...recursionResult)
        resultNodes.push(listNode)
      } else if ($isListItemNode(oldChildNode) && $isListItemNode(newChildNode)) {
        // listItem节点的子节点只能是叶子节点
        const diffTextNodes = processTextNodes(oldChildNode.getAllTextNodes(), newChildNode.getAllTextNodes())
        const listItemNode = $createListItemNode()
        listItemNode.append(...diffTextNodes)
        resultNodes.push(listItemNode)
      } else if ($isParagraphNode(oldChildNode) && $isParagraphNode(newChildNode)) {
        // paragraph的子节点也只能是叶子节点
        const diffTextNodes = processTextNodes(oldChildNode.getAllTextNodes(), newChildNode.getAllTextNodes())
        const paragraphNode = $createParagraphNode()
        paragraphNode.append(...diffTextNodes)
        resultNodes.push(paragraphNode)
      } else {
        //不满足以上条件的是暂不支持的节点，那么diff时简单判断其content是否相同即可
        const oldContent = oldChildNode.getTextContent()
        const newContent = newChildNode.getTextContent()
        if (oldContent !== newContent) {
          const removedPara = $createParagraphNode();
          removedPara.append($createDiffTextNode(oldContent, 'removed'));
          resultNodes.push(removedPara);

          const addedPara = $createParagraphNode();
          addedPara.append($createDiffTextNode(newContent, 'added'));
          resultNodes.push(addedPara);
        } else {
          resultNodes.push(newChildNode as ElementNode);
        }
      }

      oldIdx ++
      newIdx ++
    } else if (oldChildNode && (!newChildNode || oldChildNode.getType() !== newChildNode.getType())) {
      // 2. 旧节点存在，但新节点不存在 或 类型不同 -> 标记为“removed”
      replaceDiffNode(oldChildNode, "removed")
      resultNodes.push(oldChildNode as ElementNode);
      oldIdx++;
    } else if (newChildNode && (!oldChildNode || oldChildNode.getType() !== newChildNode.getType())) {
      // 3. 新节点存在，但旧节点不存在 或 类型不同 -> 标记为“added”
      replaceDiffNode(newChildNode, "added")
      resultNodes.push(newChildNode as ElementNode);
      newIdx++;
    }
  }

  return resultNodes
}

function processTextNodes(
  oldTextNodes: TextNode[],
  newTextNodes: TextNode[]
): TextNode[] {
  // 这个方法的目的是逐个对比所有的TextNode?
  // 考虑合并对比。
  const result: TextNode[] = []
  const oldParagraph = $createParagraphNode()
  const newParagraph = $createParagraphNode()
  oldParagraph.append(...oldTextNodes)
  newParagraph.append(...newTextNodes)

  const tempParagraph1 = $createParagraphNode()
  const tempParagraph2 = $createParagraphNode()
  tempParagraph1.append(oldParagraph)
  tempParagraph2.append(newParagraph)

  const oldContent = $convertToMarkdownString(SUPPORT_TRANSFORMER, tempParagraph1)
  const newContent = $convertToMarkdownString(SUPPORT_TRANSFORMER, tempParagraph2)

  const diffContents = diffWords(oldContent, newContent)
  diffContents.forEach(item => {
    const tempNode = $createParagraphNode()
    $convertFromMarkdownString(item.value, SUPPORT_TRANSFORMER, tempNode)
    replaceDiffNode(tempNode, item.added ? 'added' : item.removed ? 'removed' : 'unchanged')
    const innerParagraphNode = tempNode.getFirstChild()
    if (innerParagraphNode && $isParagraphNode(innerParagraphNode)) {
      result.push(...(innerParagraphNode.getChildren() as TextNode[]));
    }
  })

  return result
}

export function $calculateDiffWords(newMarkdown: string, node: ElementNode = $getRoot()) {
  const editor = $getEditor()

  editor.update(() => {
    const tempRoot = $createParagraphNode()
    $convertFromMarkdownString(newMarkdown, SUPPORT_TRANSFORMER, tempRoot)

    // 从根节点开始处理差异
    const finalDiffedNodes = processElementNode(node, tempRoot);

    node.clear();

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
  ]
