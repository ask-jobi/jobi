"use client"

import { useResume } from "@/lib/store/resume"
import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import { useSectionClickHandler } from "@/lib/hooks/use-section-click"
import { FloatingButtonGroup } from "@/components/client-components/floating-button-group"
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
    <div className="w-full flex justify-center items-start relative py-4">
      <div
        data-testid="resume-canvas"
        className="w-[210mm] bg-white shadow-lg border border-gray-200 overflow-y-auto overflow-x-hidden relative"
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
      <div className="sticky left-[calc(50%+205mm/2)] top-[20%] -translate-y-1/2">
        <FloatingButtonGroup />
      </div>
    </div>
  )
}

export default ResumeEditor
