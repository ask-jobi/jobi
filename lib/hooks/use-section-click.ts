"use client"

import { useCallback } from "react"
import { useEntryEditWorkflow } from "@/lib/hooks/use-entry-edit-workflow"
import type { ResumeSectionKey } from "@/types/resume"

/**
 * Hook for template section click handlers.
 *
 * Delegates to {@link useEntryEditWorkflow.startExistingEntryEdit}
 * so section clicks open the local modal form without mutating the resume first.
 */
export function useSectionClickHandler() {
  const { startExistingEntryEdit } = useEntryEditWorkflow()

  return useCallback(
    (id: ResumeSectionKey, index?: number) => {
      startExistingEntryEdit(id, index)
    },
    [startExistingEntryEdit]
  )
}
