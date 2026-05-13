"use client"

import { useCallback } from "react"
import { editModalOpenAtom, focusSectionAtom } from "@/lib/store/resume"
import { store } from "@/components/resumes/resume-context"
import type { SectionId } from "@/types/resume"
import { useSetAtom } from "jotai"

export function useSectionClickHandler() {
  const setEditModalOpen = useSetAtom(editModalOpenAtom)

  return useCallback(
    (id: SectionId, index?: number) => {
      store.set(focusSectionAtom, id, index)
      setEditModalOpen(true)
    },
    [setEditModalOpen]
  )
}
