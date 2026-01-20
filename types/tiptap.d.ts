import {JSONContent} from "@tiptap/core";

export interface DiffStorage {
  originalSelection: { from: number; to: number } | null
  originalContent: JSONContent | null
  diffContent: JSONContent | null
}

export interface SelectionStorage {
  from: number
  to: number
}

export type ToolbarMode = 'default' | 'ai' | 'confirm'

export interface ToolbarStorage {
  mode: ToolbarMode
}

declare module '@tiptap/core' {
  interface Storage {
    diff: DiffStorage,
    selection: SelectionStorage,
    floatingToolbar: ToolbarStorage
  }

  interface Commands<ReturnType> {
    diff: {
      setDiffContent: (params: {
        originalSelection: { from: number; to: number }
        originalContent: JSONContent
        diffContent: JSONContent
      }) => ReturnType
      applyDiff: () => ReturnType
      rejectDiff: () => ReturnType
      clearDiff: () => ReturnType
    },
    selection: {
      expandSelectionToNodeEdge: () => ReturnType
      clearSelection: () => ReturnType
    },
    floatingToolbar: {
      setMode: (mode: ToolbarMode) => ReturnType
    }
  }
}
