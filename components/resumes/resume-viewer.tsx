"use client"
import useResumeTemplate from "@/lib/hooks/use-resume-template";
import {ResumeData} from "@/types/resume";

function ResumeViewer({resumeData}: {resumeData?: ResumeData}) {
  const template = useResumeTemplate(resumeData)

  if (!template) {
    return <div>Loading resume data...</div>;
  }

  return template.renderDocument();
}

export default ResumeViewer;
