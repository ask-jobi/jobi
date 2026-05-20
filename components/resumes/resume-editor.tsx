"use client"

import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import { useSectionClickHandler } from "@/lib/hooks/use-section-click"
import { useApplicationResume, useResumeLanguage } from "@/lib/store/resume"
import { useEntryEditWorkflow } from "@/lib/hooks/use-entry-edit-workflow"
import {
  isResumeCanvasEmpty,
  ResumeCanvasSectionEntry
} from "@/components/resumes/resume-canvas-section-entry"
export function ResumeEditor() {
  const resumeLanguage = useResumeLanguage()
  const { applicationResumeData } = useApplicationResume()
  const { Template } = useResumeTemplate()
  const handleSectionClick = useSectionClickHandler()
  const {
    startNewEntryEdit,
    deleteAndPersistEntry,
    reorderAndPersistEntry,
    moveSectionAndPersist,
    isEntryReorderPending,
    isSectionReorderPending
  } = useEntryEditWorkflow()
  const isEmptyCanvas = isResumeCanvasEmpty(applicationResumeData)

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
            data={applicationResumeData}
            language={resumeLanguage}
            options={{
              isInteractive: true,
              onEntryAdd: startNewEntryEdit,
              onEntryDelete: deleteAndPersistEntry,
              onEntryReorder: reorderAndPersistEntry,
              onSectionMoveUp: (sectionId) =>
                moveSectionAndPersist(sectionId, "up"),
              onSectionMoveDown: (sectionId) =>
                moveSectionAndPersist(sectionId, "down"),
              onSectionClick: handleSectionClick,
              entryDragDisabled: isEntryReorderPending,
              sectionMoveDisabled: isSectionReorderPending
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ResumeEditor
