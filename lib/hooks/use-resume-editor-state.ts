"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  clearEditorSelectionAtom,
  draftRollbackResumeAtom,
  focusSectionAtom,
  resumeAutosaveSuspendedAtom,
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import type { ResumeData, ResumeSectionKey } from "@/types/resume"

export function useResumeEditorState() {
  const selectedSectionId = useAtomValue(selectedSectionIdAtom)
  const selectedEntryId = useAtomValue(selectedEntryIdAtom)
  const selectedEntryIndex = useAtomValue(selectedEntryIndexAtom)
  const rollbackResume = useAtomValue(draftRollbackResumeAtom)
  const isAutosaveSuspended = useAtomValue(resumeAutosaveSuspendedAtom)

  const selectTarget = useSetAtom(focusSectionAtom)
  const clearSelection = useSetAtom(clearEditorSelectionAtom)
  const setRollbackResume = useSetAtom(draftRollbackResumeAtom)

  return {
    selectedSectionId,
    selectedEntryId,
    selectedEntryIndex,
    rollbackResume,
    isAutosaveSuspended,
    selectTarget: (
      sectionId: ResumeSectionKey,
      entryIndex?: number,
      entryId?: string | null
    ) => selectTarget(sectionId, entryIndex, entryId),
    clearSelection: () => clearSelection(),
    setRollbackResume: (nextRollbackResume: ResumeData | null) =>
      setRollbackResume(nextRollbackResume),
    clearRollbackResume: () => setRollbackResume(null)
  }
}
