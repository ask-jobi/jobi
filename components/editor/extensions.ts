import {Extension, isNodeSelection} from "@tiptap/react";
import {DiffStorage} from "@/types/tiptap";
import {Range} from "@tiptap/core";
import {Selection} from "@tiptap/extensions";
import {Plugin, PluginKey, EditorState} from "@tiptap/pm/state";
import {Decoration, DecorationSet} from "@tiptap/pm/view";
import type {Node as ProseMirrorNode} from "@tiptap/pm/model";

const getShouldExpandRange = (state: EditorState, range: Range): Range => {
  // from 和 to 如果是一个节点的开头和结尾，那么递归查找其父节点
  const $from = state.doc.resolve(range.from);

  // 最终确定的最外层范围
  let finalFrom = range.from;
  let finalTo = range.to;

  // 从当前层级向上遍历
  // depth 0 是 doc，通常我们搜寻到 depth 1 即可
  for (let d = $from.depth; d > 0; d--) {
    const parent = $from.node(d);

    // 关键判断：如果该层节点只有一个子节点，说明它的范围与子节点重合
    if (parent.childCount === 1) {
      finalFrom = $from.before(d);
      finalTo = $from.after(d);
    } else {
      // 发现父节点包含多个子节点（比如 listItem 里除了这个 p 还有另一个 p）
      // 停止向上，返回当前已知的最大范围
      break;
    }
  }
  // 返回应该被删除的最大父节点边界
  return { from: finalFrom, to: finalTo };
}

// 处理 diff 操作的辅助函数
function processDiffOperation(
  state: EditorState,
  options: {
    markToRemove: any; // 要移除的 mark
    markToDelete: any; // 要删除的 mark（对应的节点会被删除）
  }
): boolean {
  const { tr, schema, doc } = state
  const { inserted, deleted } = schema.marks

  if (!inserted || !deleted) return false

  const rangeToRemove: Range[] = []

  doc.descendants((node: ProseMirrorNode, pos: number) => {
    if (!node.isText) return

    // 如果节点有要删除的 mark，收集到删除范围
    if (options.markToDelete && options.markToDelete.isInSet(node.marks)) {
      rangeToRemove.push({ from: pos, to: pos + node.nodeSize })
      return false
    }

    // 如果节点有要移除的 mark，移除 mark（保留内容）
    if (options.markToRemove && options.markToRemove.isInSet(node.marks)) {
      tr.removeMark(pos, pos + node.nodeSize, options.markToRemove)
    }

    return true
  })

  // 从后往前删除，避免位置偏移
  rangeToRemove.reverse().forEach((range) => {
    const {from, to} = getShouldExpandRange(state, range)
    tr.deleteRange(from, to)
  })

  return tr.steps.length > 0
}

// 清理 diff 存储
function clearDiffStorage(storage: DiffStorage) {
  storage.originalSelection = null
  storage.originalContent = null
  storage.diffContent = null
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
        ({ chain, editor }) => {
          this.storage.originalSelection = originalSelection
          this.storage.originalContent = originalContent
          this.storage.diffContent = diffContent

          if (!diffContent.content) {
            return true
          }

          // 将差异内容应用到编辑器（显示带标记的差异）
          const { from, to } = originalSelection

          chain()
            .deleteRange({ from, to })
            .insertContentAt(from, diffContent.content || [])
            .clearSelection()
            .run()

          editor.setEditable(false)

          return true
        },
      applyDiff: () =>
        ({ state, dispatch, editor }) => {
          const { schema } = state
          const { inserted, deleted } = schema.marks

          // apply: 接受更改
          // 删除 deleted 节点，移除 inserted mark
          const hasChanges = processDiffOperation(state, {
            markToRemove: inserted, // 移除 inserted mark（保留内容）
            markToDelete: deleted,   // 删除 deleted 节点
          })

          if (hasChanges && dispatch) {
            clearDiffStorage(this.storage)
            editor.setEditable(true)
            state.tr.setMeta('addToHistory', false)
            dispatch(state.tr)
          }
          return hasChanges
        },
      rejectDiff: () =>
        ({ state, dispatch, editor }) => {
          const { schema } = state
          const { inserted, deleted } = schema.marks

          // reject: 拒绝更改
          // 删除 inserted 节点，移除 deleted mark
          const hasChanges = processDiffOperation(state, {
            markToRemove: deleted,   // 移除 deleted mark（保留内容）
            markToDelete: inserted,  // 删除 inserted 节点
          })

          if (hasChanges && dispatch) {
            clearDiffStorage(this.storage)
            editor.setEditable(true)
            state.tr.setMeta('addToHistory', false)
            dispatch(state.tr)
          }
          return hasChanges
        },
      clearDiff: () =>
        () => {
          clearDiffStorage(this.storage)
          return true
        }
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
