"use client"
import { useEffect, useState } from "react";
import { ResumeData } from "@/types/resume";
import { DefaultTemplate } from "@/components/resume-templates/default-template";
import {useRouter} from "next/navigation";

export default function PrintResumePage() {
  const router = useRouter()
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('printResumeData');
    if (storedData) {
      sessionStorage.removeItem('printResumeData')
      setResumeData(JSON.parse(storedData))
    }
  }, []);

  useEffect(() => {
    if (resumeData) {
      window.addEventListener(
        'afterprint',
        () => {
          router.back()
        },
        { once: true },
      )
      window.print()
    }
  }, [resumeData, router]);

  const defaultTemplate = new DefaultTemplate();

  if (!resumeData) {
    return <div>Loading resume data...</div>;
  }

  return (
    <div className="w-full h-full p-8">
      {defaultTemplate.renderDocument(resumeData)}
    </div>
  );
}
