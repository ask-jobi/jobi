import "server-only"
import { getResumeData } from "@/server/resume"
import { notFound } from "next/navigation"
import ResumeViewer from "@/components/resumes/resume-viewer"

export default async function PrintResumePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let resumeData = null

  try {
    resumeData = await getResumeData(id)
  } catch (e) {
    console.error(e)
  }

  if (!resumeData) {
    return notFound()
  }

  return (
    <div className="w-full h-full p-8">
      <ResumeViewer data={resumeData} />
    </div>
  )
}
