import NewResumeCard from "@/components/client-components/new-resume-card"
import { fetchJobApplication } from "@/server/resume"
import ResumeThumbnailCard from "@/components/resumes/resume-thumbnail-card"

export default async function Dashboard() {
  const data = await fetchJobApplication()

  return (
    <div className="h-[calc(100vh-3rem)] p-6 overflow-y-auto">
      <div className="grid xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <NewResumeCard />
        {data?.reverse().map((it) => {
          // 生成缩略图 URL
          const thumbnailUrl = it.resumes?.id
            ? `/api/resume/thumbnail?resume_id=${encodeURIComponent(it.resumes.id)}`
            : null

          return (
            <ResumeThumbnailCard
              key={it.id}
              thumbnailUrl={thumbnailUrl}
              applicationId={it.id}
            />
          )
        })}
      </div>
    </div>
  )
}
