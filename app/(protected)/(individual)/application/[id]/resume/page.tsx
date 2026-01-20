import { TourProvider } from "@/components/client-components/tour"
import "server-only"
import ResumePage from "@/components/resumes/resume-page"

export default function Page() {
  return (
    <TourProvider>
      <ResumePage />
    </TourProvider>
  )
}
