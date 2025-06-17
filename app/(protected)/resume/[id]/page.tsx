import "server-only"
import ResumePage from "@/components/client-components/resume-page";
import {TourProvider} from "@/components/tour";

export default function Page() {
  return (
    <TourProvider>
      <ResumePage />
    </TourProvider>
  )
}
