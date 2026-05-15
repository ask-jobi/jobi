"use client"

import { useCallback } from "react"
import { editModalOpenAtom } from "@/lib/store/resume"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import type { SectionId } from "@/types/resume"
import { useSetAtom } from "jotai"

export function useSectionClickHandler() {
  const setEditModalOpen = useSetAtom(editModalOpenAtom)
  const { selectTarget } = useResumeEditorState()

  return useCallback(
    (id: SectionId, index?: number) => {
      selectTarget(id, index)
      setEditModalOpen(true)
    },
    [selectTarget, setEditModalOpen]
  )
}
