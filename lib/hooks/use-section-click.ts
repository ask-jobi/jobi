"use client"

import { useCallback } from "react"
import { focusSectionAtom, rightPanelViewAtom } from "@/lib/store/resume"
import { store } from "@/components/resumes/resume-context"
import type { ResumeData } from "@/types/resume"
import { useSetAtom } from "jotai"

export function useSectionClickHandler() {
  const setRightPanelView = useSetAtom(rightPanelViewAtom)

  return useCallback(
    (id: keyof ResumeData, index?: number) => {
      store.set(focusSectionAtom, id, index)
      setRightPanelView("form")
    },
    [setRightPanelView]
  )
}
