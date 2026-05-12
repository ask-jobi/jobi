"use client"

import { useCallback } from "react"
import { focusSectionAtom, showRightPanelAtom } from "@/lib/store/resume"
import { store } from "@/components/resumes/resume-context"
import type { ResumeData } from "@/types/resume"
import { useSetAtom } from "jotai"

export function useSectionClickHandler() {
  const showRightPanel = useSetAtom(showRightPanelAtom)

  return useCallback(
    (id: keyof ResumeData, index?: number) => {
      store.set(focusSectionAtom, id, index)
      showRightPanel("form")
    },
    [showRightPanel]
  )
}
