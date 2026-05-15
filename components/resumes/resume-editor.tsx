"use client"

import { useCallback } from "react"
import { useSetAtom } from "jotai"
import { useFormContext } from "react-hook-form"
import { useResume } from "@/lib/store/resume"
import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import { useSectionClickHandler } from "@/lib/hooks/use-section-click"
import {
  editModalOpenAtom,
  editModalRollbackResumeAtom,
  focusSectionAtom,
  useResumeLanguage
} from "@/lib/store/resume"
import {
  isResumeCanvasEmpty,
  ResumeCanvasSectionEntry
} from "@/components/resumes/resume-canvas-section-entry"
import type { ResumeData, SortableSectionId } from "@/types/resume"
import { insertDraftBlockBelow } from "@/lib/templates/section-helpers"

export function ResumeEditor() {
  const { getValues, reset } = useFormContext<ResumeData>()
  const { resumeData, updateResumeData, updateResumeDataWithSave } = useResume()
  const resumeLanguage = useResumeLanguage()
  const { Template } = useResumeTemplate()
  const handleSectionClick = useSectionClickHandler()
  const openSectionEditor = useSetAtom(focusSectionAtom)
  const setEditModalOpen = useSetAtom(editModalOpenAtom)
  const setEditModalRollbackResume = useSetAtom(editModalRollbackResumeAtom)
  const isEmptyCanvas = isResumeCanvasEmpty(resumeData)
  const handleBlockAdd = useCallback(
    (sectionId: SortableSectionId, index: number) => {
      const previousResume = getValues()
      const { resume, blockIndex } = insertDraftBlockBelow(
        previousResume,
        sectionId,
        index
      )

      setEditModalRollbackResume(previousResume)
      reset(resume)
      updateResumeData(resume)
      openSectionEditor(sectionId, blockIndex)
      setEditModalOpen(true)
    },
    [
      getValues,
      openSectionEditor,
      reset,
      setEditModalOpen,
      setEditModalRollbackResume,
      updateResumeData
    ]
  )
  const handleBlockDelete = useCallback(
    (sectionId: SortableSectionId, index: number) => {
      const nextResume = structuredClone(getValues()) as ResumeData
      const section = nextResume[sectionId]

      if (!section || !("blocks" in section) || !section.blocks[index]) {
        return
      }

      section.blocks = section.blocks.filter((_, blockIndex) => {
        return blockIndex !== index
      }) as typeof section.blocks

      reset(nextResume)
      void updateResumeDataWithSave(nextResume)
    },
    [getValues, reset, updateResumeDataWithSave]
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
            data={resumeData}
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
