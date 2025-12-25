import React from 'react';
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {Provider} from "jotai";
import { ResumeInitializer, store } from '@/components/resumes/resume-context';

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
        evaluation_report,
        evaluation_report_refresh_flag
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
  // console.info(`Job application: ${JSON.stringify(jobApplication)}`)

  if (error || !jobApplication) {
    notFound()
  }

  return (
    <Provider store={store}>
      <ResumeInitializer
        jobApplication={jobApplication as any}
      >
        {children}
      </ResumeInitializer>
    </Provider>
  );
}

export default Layout;
