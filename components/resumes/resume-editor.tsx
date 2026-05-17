"use client"

import { useCallback } from "react"
import { useSetAtom } from "jotai"
import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import { useSectionClickHandler } from "@/lib/hooks/use-section-click"
import { editModalOpenAtom, useResumeLanguage } from "@/lib/store/resume"
import { useResumeDraft } from "@/lib/hooks/use-resume-draft"
import { useResumeEditorState } from "@/lib/hooks/use-resume-editor-state"
import {
  isResumeCanvasEmpty,
  ResumeCanvasSectionEntry
} from "@/components/resumes/resume-canvas-section-entry"
import type { SortableSectionKey } from "@/types/resume"

export function ResumeEditor() {
  const resumeLanguage = useResumeLanguage()
  const { draft, addEntryBelow, commitDraft, deleteEntry, getDraft } =
    useResumeDraft()
  const { Template } = useResumeTemplate()
  const handleSectionClick = useSectionClickHandler()
  const setEditModalOpen = useSetAtom(editModalOpenAtom)
  const { selectTarget, setRollbackResume } = useResumeEditorState()
  const isEmptyCanvas = isResumeCanvasEmpty(draft)
  const handleEntryAdd = useCallback(
    (sectionId: SortableSectionKey, index: number) => {
      const previousResume = getDraft()
      const { entryIndex, entryId } = addEntryBelow(sectionId, index)

      setRollbackResume(previousResume)
      selectTarget(sectionId, entryIndex ?? undefined, entryId)
      setEditModalOpen(true)
    },
    [addEntryBelow, getDraft, selectTarget, setEditModalOpen, setRollbackResume]
  )
  const handleEntryDelete = useCallback(
    (sectionId: SortableSectionKey, index: number) => {
      const nextResume = deleteEntry(sectionId, index)
      void commitDraft(nextResume)
    },
    [commitDraft, deleteEntry]
  )

  return (
    <div className="relative flex w-full items-start justify-center overflow-x-visible px-4 py-4 xl:pr-28">
      <div
        data-testid="resume-canvas"
        className="relative w-[210mm] overflow-visible border border-gray-200 bg-white shadow-lg"
      >
        <ResumeCanvasSectionEntry />
        {isEmptyCanvas ? (
          <div className="min-h-[297mm] bg-white" />
        ) : (
          <Template
            data={draft}
            language={resumeLanguage}
            options={{
              isInteractive: true,
              onEntryAdd: handleEntryAdd,
              onEntryDelete: handleEntryDelete,
              onSectionClick: handleSectionClick
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ResumeEditor
