import "server-only"
import {createClient} from "@/lib/supabase/server";
import {notFound} from "next/navigation";
import ResumeEditor from "@/components/client-components/resume-editor";
import {ResumeData} from "@/types/resume";
import ResumePreview from "@/components/client-components/resume-preview";
import ClientOnly from "@/components/client-components/client-only";
import {ResumeProvider} from "@/components/client-components/resume-context";

export default async function ResumePage({params}: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {data: jobApplication, error} = await supabase
    .from('job_applications')
    .select(`
      id,
      resume:resume_id (
        id,
        resume_json
      ),
      job:job_id (
        id,
        name,
        company
      )
    `)
    .eq('id', id)
    .single()

  if (error || !jobApplication) {
    notFound()
  }

  const resumeData: ResumeData = jobApplication.resume.resume_json || {
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
    },
    educationHistory: {
      title: "",
      order: 0,
      blocks: []
    },
    employmentHistory: {
      title: "",
      order: 1,
      blocks: []
    },
    skills: {
      title: "",
      order: 2,
      blocks: []
    }
  };

  return (
    <ResumeProvider initialData={resumeData}>
      <div className="flex h-[calc(100vh-3rem)]">
        <div className="w-1/2 p-6 border-r overflow-y-auto">
          <ResumeEditor resumeId={jobApplication.resume.id} />
        </div>
        <div className="w-1/2 p-6 overflow-y-auto">
          <ClientOnly>
            <ResumePreview />
          </ClientOnly>
        </div>
      </div>
    </ResumeProvider>
  )
}
