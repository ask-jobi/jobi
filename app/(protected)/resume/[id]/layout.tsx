import React from 'react';
import {ResumeInitializer, store} from "@/components/client-components/resume-context";
import {notFound} from "next/navigation";
import {ResumeData} from "@/types/resume";
import {createClient} from "@/lib/supabase/server";
import {Provider} from "jotai";

async function Layout(props: {
  children: React.ReactNode,
  params: Promise<{ id: string }>
}) {
  const {children, params} = props;
  const supabase = await createClient()
  const { id } = await params

  const { data: jobApplication, error } = await supabase
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
    education: {
      title: "Education History",
      order: 0,
      blocks: []
    },
    employment: {
      title: "Employment History",
      order: 1,
      blocks: []
    },
    skills: {
      title: "Skills",
      order: 2,
      blocks: []
    }
  };

  return (
    <Provider store={store}>
      <ResumeInitializer initialData={resumeData} jobApplication={jobApplication}>
        {children}
      </ResumeInitializer>
    </Provider>
  );
}

export default Layout;
