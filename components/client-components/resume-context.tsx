"use client"

import {ReactNode, useEffect} from "react";
import {createStore, useAtom, useSetAtom} from "jotai";
import {resumeDataAtom, applicationAtom, resumeMetadataAtom, resumeEvaluationAtom} from "@/lib/store/resume";
import { ResumeData, JobApplication } from "@/types/resume";
import {Locale} from "@/lib/i18n/config";
import type { ResumeEvaluationOutput } from "@/lib/evaluation/types";

interface ResumeInitializerProps {
  children: ReactNode;
  initialData: ResumeData;
  language: Locale;
  jobApplication: JobApplication;
  evaluation?: ResumeEvaluationOutput | null;
}

export const store = createStore();

export function ResumeInitializer({ children, initialData, language, jobApplication, evaluation }: ResumeInitializerProps) {
  const [resumeData, setResumeData] = useAtom(resumeDataAtom)
  const setMetadata = useSetAtom(resumeMetadataAtom)
  const setJobApplication = useSetAtom(applicationAtom)
  const setEvaluation = useSetAtom(resumeEvaluationAtom)

  useEffect(() => {
    setResumeData(initialData);
    setMetadata({
      language: language
    });
    setJobApplication(jobApplication);
    setEvaluation(evaluation ?? null);
  }, [language, initialData, jobApplication, setJobApplication, setResumeData, setMetadata, setEvaluation, evaluation]);

  if (!resumeData) {
    return null
  }

  return <>{children}</>;
}
