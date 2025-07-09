import {
  $createNodeSelection,
  $createParagraphNode,
  $getEditor,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $setSelection,
  ElementNode,
  LexicalNode,
  NodeSelection
} from "lexical";
import {$exportMarkdown, $importMarkdown} from "@/components/blocks/editor-00/plugins/markdown-plugin";
import {diffMarkdown} from "@/components/blocks/editor-00/diff";

function $replaceNodes(selectionNodes: Array<LexicalNode>, childrenNodes: Array<LexicalNode>) {
  const firstSelectionNode = selectionNodes[0]
  const previousNode = firstSelectionNode.getPreviousSibling()
  if (previousNode) {
    childrenNodes.reverse().forEach(it => {
      previousNode.insertAfter(it)
    })
  } else {
    const firstChildNode = $getRoot().getFirstChild()
    if (firstChildNode) {
      childrenNodes.forEach(it => {
        firstChildNode.insertBefore(it)
      })
    } else {
      $getRoot().append(...childrenNodes)
    }
  }
}

export function $calculateDiffWords(selection: NodeSelection, originalMarkdown: string, newMarkdown: string) {
  const editor = $getEditor()

  editor.update(() => {
    const tempRoot1 = $createParagraphNode()
    $importMarkdown(newMarkdown, tempRoot1)
    const diffedMarkdown = diffMarkdown(originalMarkdown, newMarkdown)
    const tempRoot = $createParagraphNode()
    $importMarkdown(diffedMarkdown, tempRoot)

    // // 从用户所选节点处理差异，注意：确保选中的片段至少是一个ElementNode(容器Node)
    // 优先获取lastChild的引用, 因为临时节点中的子节点会被转移到root下
    const lastChild = tempRoot.getLastChild()
    const selectionNodes = selection.getNodes()
    const diffedNodes = tempRoot.getChildren()
    const newNodes = tempRoot1.getChildren()

    // cache nodes

    $replaceNodes(selectionNodes, diffedNodes)
    selection.deleteNodes()
    if (lastChild) {
      const range = lastChild.selectEnd()
      $setSelection(range)
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

export function $getMarkdownFromSelection(nodeSelection: NodeSelection): string {
  const result: string[] = []
  const editor = $getEditor()

  editor.read(() => {
    nodeSelection.getNodes().forEach(it => {
      const markdown = $exportMarkdown(it as ElementNode)
      result.push(markdown)
    })
  })
  return result.join("\n")
}
