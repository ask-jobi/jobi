import {
  $copyNode,
  $createNodeSelection,
  $createParagraphNode,
  $getEditor,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode, $setSelection,
  ElementNode,
  Klass,
  LexicalNode,
  LexicalNodeReplacement,
  NodeSelection,
  ParagraphNode,
  TextNode,
} from "lexical"
import {HorizontalRuleNode} from "@lexical/react/LexicalHorizontalRuleNode";
import {AutoLinkNode, LinkNode} from "@lexical/link";
import {ListItemNode, ListNode} from "@lexical/list";
import {$exportMarkdown, $importMarkdown, DiffTextNode} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {diffMarkdown} from "@/components/blocks/editor-00/diff";

export function $calculateDiffWords(selection: NodeSelection, originalMarkdown: string, newMarkdown: string) {
  const editor = $getEditor()

  editor.update(() => {
    const diffedMarkdown = diffMarkdown(originalMarkdown, newMarkdown)
    const tempRoot = $createParagraphNode()
    $importMarkdown(diffedMarkdown, tempRoot)

    // // 从用户所选节点处理差异，注意：确保选中的片段至少是一个ElementNode(容器Node)
    const selectionNodes = selection.extract() as ElementNode[]

    const firstSelectionNode = selectionNodes[0]
    const previousNode = firstSelectionNode.getPreviousSibling()
    if (previousNode) {
      tempRoot.getChildren().reverse().forEach(it => {
        previousNode.insertAfter(it)
      })
    } else {
      const firstChildNode = $getRoot().getFirstChild()
      if (firstChildNode) {
        tempRoot.getChildren().forEach(it => {
          firstChildNode.insertBefore(it)
        })
      } else {
        $getRoot().append(...tempRoot.getChildren())
      }
    }

    selection.deleteNodes()
    $setSelection(null)
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
