"use client"

import { useCallback } from "react"
import { editModalOpenAtom } from "@/lib/store/resume"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import type { ResumeSectionKey } from "@/types/resume"
import { useSetAtom } from "jotai"

export function useSectionClickHandler() {
  const setEditModalOpen = useSetAtom(editModalOpenAtom)
  const { selectTarget } = useResumeEditorState()

  return useCallback(
    (id: ResumeSectionKey, index?: number) => {
      selectTarget(id, index)
      setEditModalOpen(true)
    },
    [selectTarget, setEditModalOpen]
  )
}
