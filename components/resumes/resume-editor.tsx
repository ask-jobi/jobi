"use client"

import { useCallback } from "react"
import { useSetAtom } from "jotai"
import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import { useSectionClickHandler } from "@/lib/hooks/use-section-click"
import {
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  focusSectionAtom,
  useResumeLanguage
} from "@/lib/store/resume"
import { useResumeDraft } from "@/lib/hooks/use-resume-draft"
import {
  isResumeCanvasEmpty,
  ResumeCanvasSectionEntry
} from "@/components/resumes/resume-canvas-section-entry"
import type { SortableSectionId } from "@/types/resume"

export function ResumeEditor() {
  const resumeLanguage = useResumeLanguage()
  const { draft, addBlockBelow, deleteBlock, getDraft } = useResumeDraft()
  const { Template } = useResumeTemplate()
  const handleSectionClick = useSectionClickHandler()
  const openSectionEditor = useSetAtom(focusSectionAtom)
  const setEditModalOpen = useSetAtom(editModalOpenAtom)
  const setEditModalRollbackResume = useSetAtom(editModalRollbackResumeAtom)
  const isEmptyCanvas = isResumeCanvasEmpty(draft)
  const handleBlockAdd = useCallback(
    (sectionId: SortableSectionId, index: number) => {
      const previousResume = getDraft()
      const { blockIndex, blockId } = addBlockBelow(sectionId, index)

      setEditModalRollbackResume(previousResume)
      openSectionEditor(sectionId, blockIndex, blockId)
      setEditModalOpen(true)
    },
    [addBlockBelow, getDraft, openSectionEditor, setEditModalOpen, setEditModalRollbackResume]
  )
  const handleBlockDelete = useCallback(
    (sectionId: SortableSectionId, index: number) => {
      deleteBlock(sectionId, index)
    },
    [deleteBlock]
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
              onBlockAdd: handleBlockAdd,
              onBlockDelete: handleBlockDelete,
              onSectionClick: handleSectionClick
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ResumeEditor
