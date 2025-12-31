import {Extension, isNodeSelection} from "@tiptap/react";
import {DiffStorage} from "@/types/tiptap";
import {JSONContent} from "@tiptap/core";
import {Selection} from "@tiptap/extensions";
import {Plugin, PluginKey} from "@tiptap/pm/state";
import {Decoration, DecorationSet} from "@tiptap/pm/view";

// 移除所有 diff 标记，只保留实际内容
function removeDiffMarks(content: JSONContent): JSONContent | null {
  if (content.type === "text") {
    // 如果是删除的文本，直接忽略
    if (content.marks?.some(m => m.type === "deleted")) {
      return null // 返回 null 表示需要过滤掉
    }
    // 如果是插入的文本，移除 inserted 标记
    if (content.marks?.some(m => m.type === "inserted")) {
      return {
        ...content,
        marks: content.marks.filter(m => m.type !== "inserted")
      }
    }
    return content
  }

  if (content.content) {
    const cleanedContent = content.content
      .map(removeDiffMarks)
      .filter((node): node is JSONContent => {
        // 过滤掉 null 和空的文本节点
        if (!node) return false
        if (node.type === "text" && (!node.text || node.text === "")) {
          return false
        }
        return true
      })

    // 如果清理后内容为空，返回空数组的节点
    if (cleanedContent.length === 0) {
      return null
    }

    return {
      ...content,
      content: cleanedContent
    }
  }

  return content
}

export const Diff = Extension.create<object, DiffStorage>({
  name: 'diff',

  addStorage() {
    return {
      originalSelection: null,
      originalContent: null,
      diffContent: null,
    }
  },

  addCommands() {
    return {
      setDiffContent: ({ originalSelection, originalContent, diffContent }) =>
        ({ chain }) => {
          this.storage.originalSelection = originalSelection
          this.storage.originalContent = originalContent
          this.storage.diffContent = diffContent

          if (!diffContent.content) {
            return true
          }

          // 将差异内容应用到编辑器（显示带标记的差异）
          const { from, to } = originalSelection
          const nodeBefore = this.editor.$pos(from).node
          const nodeAfter = this.editor.$pos(to).node
          const [firstNewDiffNode, ...remainingNodes] = diffContent.content

          const [lastNewDiffNode] = remainingNodes.slice(-1)
          const middleNodes = remainingNodes.slice(0, -1)

          console.log("firstNewDiffNode", JSON.stringify(firstNewDiffNode))
          console.log("nodeBefore.toJSON()", JSON.stringify(nodeBefore.toJSON()))
          console.log("middleNodes", JSON.stringify(middleNodes))
          console.log("lastNewDiffNode", JSON.stringify(lastNewDiffNode))
          console.log("nodeAfter.toJSON()", JSON.stringify(nodeAfter.toJSON()))

          // first new node有三种情况
          // 1.没有改动 -> 移除这个首次修改的节点
          // 2.有新增节点 ->
          // 3.作为删除节点 ->
          // 如果前节点的内容和新插入的diff的前节点类型保持一致
          // if(nodeBefore.toJSON().type === firstNewDiffNode.type) {
          //
          //
          // }
          //
          // if (nodeAfter.toJSON().type === lastNewDiffNode.type) {
          //
          // }

          chain()
            .deleteRange({ from, to })
            .insertContentAt(from, diffContent.content || [])
            .clearSelection()
            .run()

          return true
        },
      applyDiff: () =>
        ({ chain, editor }) => {
          const { originalSelection, diffContent } = this.storage

          if (!originalSelection || !diffContent) {
            return false
          }

          // 移除所有标记（deleted 和 inserted），只保留实际内容
          const cleanContent = removeDiffMarks(diffContent)
          if (!cleanContent) {
            return false
          }

          const { from, to } = originalSelection

          // 获取当前选择范围，可能需要调整因为内容已经改变
          const currentFrom = Math.min(from, editor.state.doc.content.size)
          const currentTo = Math.min(to, editor.state.doc.content.size)

          // 如果 cleanContent 有 content 属性，使用它；否则直接使用 cleanContent
          const contentToInsert = cleanContent.content || cleanContent

          chain()
            .deleteRange({ from: currentFrom, to: currentTo })
            .insertContentAt(currentFrom, contentToInsert)
            .clearDiff()
            .run()

          return true
        },
      rejectDiff: () =>
        ({ chain, editor }) => {
          const { originalSelection, originalContent } = this.storage

          if (!originalSelection || !originalContent) {
            return false
          }

          // 恢复原始内容
          const { from, to } = originalSelection

          // 获取当前选择范围，可能需要调整因为内容已经改变
          const currentFrom = Math.min(from, editor.state.doc.content.size)
          const currentTo = Math.min(to, editor.state.doc.content.size)

          chain()
            .deleteRange({ from: currentFrom, to: currentTo })
            .insertContentAt(currentFrom, originalContent)
            .clearDiff()
            .run()

          return true
        },
      clearDiff: () =>
        () => {
          this.storage.originalSelection = null
          this.storage.originalContent = null
          this.storage.diffContent = null
          return true
        },
    }
  },
})


export const SelectionCustom = Selection.extend({
  addStorage() {
    return {
      from: null,
      to: null,
    }
  },
  addCommands() {
    return {
      clearSelection: () =>
        () => {
          this.storage.from = null
          this.storage.to = null
          return true
        },
      expandSelectionToNodeEdge: () =>
        ({editor}) => {
          const { $from, $to } = editor.state.selection
          const range = $from.blockRange($to)
          if (range) {
            this.storage.from = range.start
            this.storage.to = range.end
          }
          return true
        }
    }
  },
  addProseMirrorPlugins() {
    const { editor, options, storage } = this

    return [
      new Plugin({
        key: new PluginKey('selection'),
        props: {
          handleDOMEvents: {
            mousedown: (view) => {
              // 当用户开始新的点击行为时，清空存储的范围，回归原生 selection
              if (this.storage.from !== null) {
                this.storage.from = null
                this.storage.to = null
                // 异步触发一次更新，确保不干扰当前的点击事件处理
                setTimeout(() => view.dispatch(view.state.tr), 0)
              }
              return false
            }
          },
          decorations(state) {
            // 2. 逻辑判断优先级：Storage > state.selection
            const hasStorageRange = storage.from !== null && storage.to !== null

            // 如果 Storage 为空，且满足以下任一条件，则不渲染高亮
            if (!hasStorageRange) {
              if (
                state.selection.empty ||
                editor.isFocused ||
                !editor.isEditable ||
                isNodeSelection(state.selection) ||
                editor.view.dragging
              ) {
                return null
              }
            }

            // 3. 确定最终的 from 和 to
            const from = hasStorageRange ? (storage.from as number) : state.selection.from
            const to = hasStorageRange ? (storage.to as number) : state.selection.to

            // 确保坐标在当前文档范围内，防止报错
            const docSize = state.doc.content.size
            const finalFrom = Math.max(0, Math.min(from, docSize))
            const finalTo = Math.max(0, Math.min(to, docSize))

            if (finalFrom === finalTo) {
              return null
            }

            return DecorationSet.create(state.doc, [
              Decoration.inline(finalFrom, finalTo, {
                class: options.className,
              }),
            ])
          },
        },
      }),
    ]
  },
})
