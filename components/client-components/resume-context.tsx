"use client"

import {ReactNode, useEffect} from "react";
import {createStore, useAtom, useSetAtom} from "jotai";
import { resumeDataAtom, applicationAtom } from "@/lib/store/resume";
import { ResumeData, JobApplication } from "@/types/resume";

interface ResumeInitializerProps {
  children: ReactNode;
  initialData: ResumeData;
  jobApplication: JobApplication;
}

export const store = createStore();

export function ResumeInitializer({ children, initialData, jobApplication }: ResumeInitializerProps) {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
  const setJobApplication = useSetAtom(applicationAtom)

  useEffect(() => {
    setResumeData(initialData);
    setJobApplication(jobApplication);
  }, [initialData, jobApplication, setJobApplication, setResumeData]);

  if (!resumeData) {
    return null
  }

  return <>{children}</>;
}
