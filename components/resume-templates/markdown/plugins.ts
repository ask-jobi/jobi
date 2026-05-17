import { visit } from "unist-util-visit"
import { u } from "unist-builder"
import { Blockquote, Root } from "mdast"
import { VFile } from "vfile"

export default function remarkPreserveBlockquote() {
  return (tree: Root, file: VFile) => {
    const originalMarkdown = String(file.value)

    visit(tree, "blockquote", (node: Blockquote, index, parent) => {
      if (!parent || index === null || node.position === undefined) {
        return
      }

      // 提取 blockquote 在原始 Markdown 字符串中的完整内容
      // node.position 提供了节点的起始和结束偏移量
      const rawBlockquoteText = originalMarkdown.substring(
        node.position.start.offset!!,
        node.position.end.offset
      )

      // 创建一个新的 'paragraph' 节点
      // 其子节点是一个 'text' 节点，包含我们提取到的原始 blockquote 字符串
      const newParagraph = u("paragraph", [u("text", rawBlockquoteText)])

      // 将原始的 'blockquote' 节点替换为新的 'paragraph' 节点
      // parent.children.splice(index, 1, newParagraph) 表示：
      // 在 parent.children 数组的 index 位置，删除 1 个元素，然后插入 newParagraph
      parent.children.splice(index!!, 1, newParagraph)
    })
  }
}
