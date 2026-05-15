"use client"

import { ReactNode, useEffect } from "react"
import { createStore, useAtomValue, useSetAtom } from "jotai"
import { persistedResumeAtom, applicationAtom } from "@/lib/store/resume"
import { JobApplication } from "@/types/resume"

interface ResumeInitializerProps {
  children: ReactNode
  jobApplication: JobApplication
}

export const store = createStore()

export function ResumeInitializer({
  children,
  jobApplication
}: ResumeInitializerProps) {
  const persistedResume = useAtomValue(persistedResumeAtom)
  const setJobApplication = useSetAtom(applicationAtom)

  useEffect(() => {
    setJobApplication(jobApplication)
  }, [jobApplication, setJobApplication])

  if (!persistedResume) {
    return null
  }

  return <>{children}</>
}
