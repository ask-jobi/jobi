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

declare module '@tiptap/core' {
  interface Storage {
    diff: DiffStorage,
    selection: SelectionStorage
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
    }
  }
}
