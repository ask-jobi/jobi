"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  clearEditorSelectionAtom,
  draftRollbackResumeAtom,
  focusSectionAtom,
  resumeAutosaveSuspendedAtom,
  selectedBlockIdAtom,
  selectedBlockIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume"
import type { ResumeData, SectionId } from "@/types/resume"

export function useResumeEditorState() {
  const selectedSectionId = useAtomValue(selectedSectionIdAtom)
  const selectedBlockId = useAtomValue(selectedBlockIdAtom)
  const selectedBlockIndex = useAtomValue(selectedBlockIndexAtom)
  const rollbackResume = useAtomValue(draftRollbackResumeAtom)
  const isAutosaveSuspended = useAtomValue(resumeAutosaveSuspendedAtom)

  const selectTarget = useSetAtom(focusSectionAtom)
  const clearSelection = useSetAtom(clearEditorSelectionAtom)
  const setRollbackResume = useSetAtom(draftRollbackResumeAtom)

  return {
    selectedSectionId,
    selectedBlockId,
    selectedBlockIndex,
    rollbackResume,
    isAutosaveSuspended,
    selectTarget: (
      sectionId: SectionId,
      blockIndex?: number,
      blockId?: string | null
    ) => selectTarget(sectionId, blockIndex, blockId),
    clearSelection: () => clearSelection(),
    setRollbackResume: (nextRollbackResume: ResumeData | null) =>
      setRollbackResume(nextRollbackResume),
    clearRollbackResume: () => setRollbackResume(null)
  }
}
