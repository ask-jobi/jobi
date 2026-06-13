"use client"

import { useAtomValue, useSetAtom } from "jotai"
import {
  clearEditorSelectionAtom,
  focusSectionAtom,
  selectedEntryIdAtom,
  selectedEntryIndexAtom,
  selectedSectionIdAtom
} from "@/lib/store/resume-editor-state"
import type { ResumeSectionKey } from "@/types/resume"

export function useResumeEditorState() {
  const selectedSectionId = useAtomValue(selectedSectionIdAtom)
  const selectedEntryId = useAtomValue(selectedEntryIdAtom)
  const selectedEntryIndex = useAtomValue(selectedEntryIndexAtom)

  const selectTarget = useSetAtom(focusSectionAtom)
  const clearSelection = useSetAtom(clearEditorSelectionAtom)

  return {
    selectedSectionId,
    selectedEntryId,
    selectedEntryIndex,
    selectTarget: (
      sectionId: ResumeSectionKey,
      entryIndex?: number,
      entryId?: string | null
    ) => selectTarget(sectionId, entryIndex, entryId),
    clearSelection: () => clearSelection()
  }
}
