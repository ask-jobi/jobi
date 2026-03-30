import "server-only"
import { getResumeForPrint } from "@/server/resume"
import { notFound } from "next/navigation"
import ResumeViewer from "@/components/resumes/resume-viewer"
import type { Locale } from "@/lib/i18n/config"

export default async function PrintResumePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let resumeData = null
  let language: Locale = "en"

  try {
    const result = await getResumeForPrint(id)
    resumeData = result.resumeData
    language = result.language
  } catch (e) {
    console.error(e)
  }

  if (!resumeData) {
    return notFound()
  }

  return (
    <div className="w-full h-full p-8 print:p-0">
      <ResumeViewer data={resumeData} language={language} />
    </div>
  )
}
