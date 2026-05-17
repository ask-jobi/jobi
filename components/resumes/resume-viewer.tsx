"use client"

import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeData } from "@/types/resume"
import ResumeSkeleton from "@/components/skeletons/resume-skeleton"

interface ViewerProps {
  data: ResumeData | null | undefined
  language?: Locale
}

export function ResumeViewer({ data, language = "en" }: ViewerProps) {
  const { Template } = useResumeTemplate()

  if (!data) {
    return (
      <div className="w-full flex justify-center items-start py-4">
        <ResumeSkeleton />
      </div>
    )
  }

  return <Template data={data} language={language} />
}

export default ResumeViewer
