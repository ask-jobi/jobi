"use client"
import { useEffect, useState } from "react";
import { ResumeData } from "@/types/resume";
import {useRouter} from "next/navigation";
import useResumeTemplate from "@/lib/hooks/use-resume-template";

export default function PrintResumePage() {
  const router = useRouter()
  const [resumeData, setResumeData] = useState<ResumeData>();
  const template = useResumeTemplate(resumeData)

  useEffect(() => {
    const storedData = sessionStorage.getItem('printResumeData');
    if (storedData) {
      sessionStorage.removeItem('printResumeData')
      setResumeData(JSON.parse(storedData))
    }
  }, []);

  useEffect(() => {
    if (template) {
      window.addEventListener(
        'afterprint',
        () => {
          router.back()
        },
        { once: true },
      )
      window.print()
    }
  }, [template, router]);

  if (!template) {
    return <div>Loading resume data...</div>;
  }

  return (
    <div className="w-full h-full p-8">
      {template.renderDocument()}
    </div>
  );
}
