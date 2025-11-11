import React from 'react';
import {ResumeInitializer, store} from "@/components/client-components/resume-context";
import {notFound} from "next/navigation";
import {ResumeData} from "@/types/resume";
import {createClient} from "@/lib/supabase/server";
import {Provider} from "jotai";
import { Locale } from '@/lib/i18n/config';

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
        language,
        resume_json,
        evaluation_report
      ),
      job:job_id (
        id,
        name,
        company,
        description
      )
    `)
    .eq('id', id)
    .single()
  console.info(`Job application: ${JSON.stringify(jobApplication)}`)

  if (error || !jobApplication) {
    notFound()
  }

  const resume = jobApplication.resume as any
  const language = resume.language as Locale
  const resumeData: ResumeData = resume.resume_json || {
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

  const evaluationReport = resume?.evaluation_report ?? null

  return (
    <Provider store={store}>
      <ResumeInitializer
        initialData={resumeData}
        language={language}
        jobApplication={jobApplication as any}
        evaluation={evaluationReport}
      >
        {children}
      </ResumeInitializer>
    </Provider>
  );
}

export default Layout;
