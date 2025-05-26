import {createClient} from "@/lib/supabase/server";
import {notFound} from "next/navigation";
import ResumeEditor from "@/components/client-components/resume-editor";
import {ResumeData} from "@/types/resume";

export default async function ResumePage({params}: { params: { id: string } }) {
  const supabase = await createClient()

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
    .eq('id', params.id)
    .single()

  if (error || !jobApplication) {
    notFound()
  }

  const resumeData: ResumeData = jobApplication.resume?.resume_json as unknown as ResumeData || {
    personalInfo: {
      name: "",
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
      order: 0,
      blocks: []
    },
    skills: []
  };

  console.log(resumeData);

  const handleSave = async (data: ResumeData) => {
    // "use server"
    // const supabase = await createClient()
    // await supabase
    //   .from('resumes')
    //   .update({ resume_json: data })
    //   .eq('id', jobApplication.resume.id)
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 p-6 border-r overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">
          {jobApplication.job?.name} - {jobApplication.job?.company}
        </h1>
        <ResumeEditor initialData={resumeData} />
      </div>
      <div className="w-1/2 p-6">
        {/* 这里后续会添加PDF预览 */}
      </div>
    </div>
  )
} 