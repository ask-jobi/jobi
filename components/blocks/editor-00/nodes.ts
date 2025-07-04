import {
  $copyNode,
  $createNodeSelection,
  $createParagraphNode,
  $getEditor,
  $getNodeByKey, $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  EditorConfig,
  ElementNode,
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  NodeKey, NodeSelection,
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
import {diffWords} from "diff";
import {$exportMarkdown, $importMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";


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
  const clonedNode = node
  // 替换该Element节点
  if ($isElementNode(clonedNode)) {
    clonedNode.getAllTextNodes().forEach(textNode => {
      textNode.replace($wrapTextNodeAsDiffTextNode(textNode, diffState))
    })
  } else if ($isTextNode(clonedNode)) {
    clonedNode.replace($wrapTextNodeAsDiffTextNode(clonedNode, diffState))
  }
}

function processElementNode(
  oldChildNodes: ElementNode[],
  newChildNodes: ElementNode[]
): ElementNode[] {
  const resultNodes: ElementNode[] = []

  let oldIdx = 0;
  let newIdx = 0;
  while (oldIdx < oldChildNodes.length || newIdx < newChildNodes.length) {
    const oldChildNode = oldChildNodes[oldIdx];
    const newChildNode = newChildNodes[newIdx];

    if (oldChildNode && newChildNode && oldChildNode.getType() === newChildNode.getType()) {
      // 代表类型一致的节点
      if ($isListNode(oldChildNode) && $isListNode(newChildNode)) {
        // list节点的子节点只可能时listItem，因此这里直接递归交给下一个分支处理
        const recursionResult = processElementNode(oldChildNode.getChildren(), newChildNode.getChildren())
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

  const oldContent = $exportMarkdown(tempParagraph1)
  const newContent = $exportMarkdown(tempParagraph2)

  const diffContents = diffWords(oldContent, newContent)
  diffContents.forEach(item => {
    const tempNode = $createParagraphNode()
    $importMarkdown(item.value, tempNode)
    replaceDiffNode(tempNode, item.added ? 'added' : item.removed ? 'removed' : 'unchanged')
    const innerParagraphNode = tempNode.getFirstChild()
    if (innerParagraphNode && $isParagraphNode(innerParagraphNode)) {
      result.push(...(innerParagraphNode.getChildren() as TextNode[]));
    }
  })

  return result
}

export function $calculateDiffWords(newMarkdown: string, selection: NodeSelection) {
  const editor = $getEditor()

  editor.update(() => {
    const tempRoot = $createParagraphNode()
    $importMarkdown(newMarkdown, tempRoot)

    // 从用户所选节点处理差异，注意：确保选中的片段至少是一个ElementNode(容器Node)
    const selectionNodes = selection.extract() as ElementNode[]
    const finalDiffedNodes = processElementNode(selectionNodes, tempRoot.getChildren());

    const firstSelectionNode = selectionNodes[0]
    const previousNode = firstSelectionNode.getPreviousSibling()
    if (previousNode) {
      finalDiffedNodes.reverse().forEach(it => {
        previousNode.insertAfter(it)
      })
    } else {
      $getRoot().append(...finalDiffedNodes)
    }

  })
}

export function $getSelectionElementNodes(): NodeSelection {
  const nodeSelection = $createNodeSelection()
  const range = $getSelection()
  if (!range) {
    return nodeSelection
  }

  const nodes = range.getNodes()

  // 先获取所有key，然后去重
  const keySet = new Set<string>()
  nodes.forEach(it => {
    const key = it.getTopLevelElement()?.getKey()
    if (key) {
      keySet.add(key)
    }
  })

  Array.from(keySet)
    .map(it => $getNodeByKey(it))
    .filter(it => $isElementNode(it))
    .forEach(it => nodeSelection.add(it.getKey()))

  return nodeSelection
}

function $deepCloneNode(node: LexicalNode): LexicalNode {
  const clone = $copyNode(node);
  if ($isElementNode(node)) {
    node.getChildren().forEach(child => {
      (clone as ElementNode).append($deepCloneNode(child));
    });
  }
  return clone;
}

export function $getMarkdownFromSelection(nodeSelection: NodeSelection): string {
  const result: string[] = []
  const editor = $getEditor()

  editor.update(() => {
    nodeSelection.getNodes().forEach(it => {
      const tempParagraph = $createParagraphNode()
      tempParagraph.append($deepCloneNode(it))
      const markdown = $exportMarkdown(tempParagraph)
      result.push(markdown)
    })
  })
  return result.join("\n")
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
