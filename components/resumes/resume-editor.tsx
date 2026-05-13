"use client"

import { useResume } from "@/lib/store/resume"
import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import { useSectionClickHandler } from "@/lib/hooks/use-section-click"
import { useResumeLanguage } from "@/lib/store/resume"
import {
  isResumeCanvasEmpty,
  ResumeCanvasSectionEntry
} from "@/components/resumes/resume-canvas-section-entry"

export function ResumeEditor() {
  const { resumeData } = useResume()
  const resumeLanguage = useResumeLanguage()
  const { Template } = useResumeTemplate()
  const handleSectionClick = useSectionClickHandler()
  const isEmptyCanvas = isResumeCanvasEmpty(resumeData)

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
              onSectionClick: handleSectionClick
            }}
          />
        )}
      </div>
    </div>
  )
}

export default ResumeEditor
