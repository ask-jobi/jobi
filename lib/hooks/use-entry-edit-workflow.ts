"use client"

import { useCallback } from "react"
import { useSetAtom } from "jotai"
import { editModalOpenAtom, useApplicationResume } from "@/lib/store/resume"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import { useIsResumeAiActionActive } from "@/lib/store/chat"
import { deleteSectionEntryInResume } from "@/lib/resume/mutations"
import type { ResumeSectionKey, SortableSectionKey } from "@/types/resume"

// ─── Entry Edit Workflow Hook ─────────────────────────────────────────────────
//
// Explicitly composes three layers for starting an entry edit session:
//
//   1. Persisted Resume Mutation
//   2. Editor State    (useResumeEditorState)
//   3. UI Adapter      (editModalOpenAtom)
//
// Callers use these named workflows instead of manually orchestrating
// mutation target selection + persistence + modal state.
// ──────────────────────────────────────────────────────────────────────────────

export function useEntryEditWorkflow() {
  const { applicationResumeData, saveApplicationResume } =
    useApplicationResume()
  const { selectTarget } = useResumeEditorState()
  const isResumeAiActionActive = useIsResumeAiActionActive()
  const setEditModalOpen = useSetAtom(editModalOpenAtom)

  // ── Workflow: insert new entry below an existing one ──────────────────────

  /** Open the edit modal for creating a new entry below the given index. */
  const startNewEntryEdit = useCallback(
    (sectionId: SortableSectionKey, index: number) => {
      if (isResumeAiActionActive) {
        return
      }

      selectTarget(sectionId, index + 1, null)
      setEditModalOpen(true)
    },
    [isResumeAiActionActive, selectTarget, setEditModalOpen]
  )

  // ── Workflow: ensure a section exists and open its first entry ────────────

  /** Open the edit modal for an existing section or for creating its first entry. */
  const startSectionEdit = useCallback(
    (sectionId: ResumeSectionKey) => {
      if (isResumeAiActionActive) {
        return
      }

      if (sectionId === "personalInfo") {
        selectTarget(sectionId)
        setEditModalOpen(true)
        return
      }

      const section = applicationResumeData?.[sectionId]
      const firstEntryId = section?.entries[0]?.entryId ?? null

      selectTarget(sectionId, 0, firstEntryId)
      setEditModalOpen(true)
    },
    [
      applicationResumeData,
      isResumeAiActionActive,
      selectTarget,
      setEditModalOpen
    ]
  )

  // ── Workflow: open an existing entry for editing ─────────────────────────

  /** Select an existing entry and open the edit modal without mutating the resume. */
  const startExistingEntryEdit = useCallback(
    (sectionId: ResumeSectionKey, entryIndex?: number) => {
      if (isResumeAiActionActive) {
        return
      }

      selectTarget(sectionId, entryIndex)
      setEditModalOpen(true)
    },
    [isResumeAiActionActive, selectTarget, setEditModalOpen]
  )

  // ── Workflow: delete entry and persist ───────────────────────────────────

  const deleteAndPersistEntry = useCallback(
    (sectionId: SortableSectionKey, index: number) => {
      if (!applicationResumeData) {
        return
      }

      const nextResume = deleteSectionEntryInResume(
        applicationResumeData,
        sectionId,
        index
      )

      void saveApplicationResume(nextResume)
    },
    [applicationResumeData, saveApplicationResume]
  )

  return {
    /** Insert a new entry after the given index → opens a local modal form */
    startNewEntryEdit,
    /** Open an existing section or create its first entry in a local modal form */
    startSectionEdit,
    /** Select an existing entry → opens a local modal form */
    startExistingEntryEdit,
    /** Delete entry at index and persist immediately */
    deleteAndPersistEntry
  }
}
