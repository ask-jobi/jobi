"use client"
import {useEffect, useRef, useState} from "react";
import { ResumeData } from "@/types/resume";
import {useRouter} from "next/navigation";
import useResumeTemplate from "@/lib/hooks/use-resume-template";

export default function PrintResumePage() {
  const router = useRouter()
  const [resumeData, setResumeData] = useState<ResumeData>();
  const template = useResumeTemplate(resumeData)
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem('printResumeData');
    if (storedData) {
      sessionStorage.removeItem('printResumeData')
      setResumeData(JSON.parse(storedData))
    }
  }, []);

  useEffect(() => {
    if (!template) return
    if (hasPrintedRef.current) return

    hasPrintedRef.current = true

    window.addEventListener(
      'afterprint',
      () => router.back(),
      { once: true },
    )
    requestAnimationFrame(() => {
      setTimeout(() => window.print())
    })
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
