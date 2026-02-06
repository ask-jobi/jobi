"use client"

import { useResumeTemplate } from "@/lib/hooks/use-resume-template"
import type { ResumeData } from "@/types/resume"
import ResumeSkeleton from "@/components/skeletons/resume-skeleton"

interface ViewerProps {
  data: ResumeData | null | undefined
}

export function ResumeViewer({ data }: ViewerProps) {
  const { Template } = useResumeTemplate()

  if (!data) {
    return (
      <div className="w-full flex justify-center items-start py-4">
        <ResumeSkeleton />
      </div>
    )
  }

  return <Template data={data} />
}

export default ResumeViewer
