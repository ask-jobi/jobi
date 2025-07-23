"use client"

import {ReactNode, useEffect} from "react";
import {createStore, useAtom, useSetAtom} from "jotai";
import {resumeDataAtom, applicationAtom, resumeMetadataAtom} from "@/lib/store/resume";
import { ResumeData, JobApplication } from "@/types/resume";
import {Locale} from "@/lib/i18n/config";

interface ResumeInitializerProps {
  children: ReactNode;
  initialData: ResumeData;
  language: Locale;
  jobApplication: JobApplication;
}

export const store = createStore();

export function ResumeInitializer({ children, initialData, language, jobApplication }: ResumeInitializerProps) {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
  const setMetadata = useSetAtom(resumeMetadataAtom)
  const setJobApplication = useSetAtom(applicationAtom)

  useEffect(() => {
    setResumeData(initialData);
    setMetadata({
      language: language
    });
    setJobApplication(jobApplication);
  }, [language, initialData, jobApplication, setJobApplication, setResumeData]);

  if (!resumeData) {
    return null
  }

  return <>{children}</>;
}
