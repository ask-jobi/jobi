"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAtomValue } from "jotai"
import { FormProvider, useForm } from "react-hook-form"
import { ResumeData } from "@/types/resume"
import { resumeAutosaveSuspendedAtom, useApplicationResume } from "@/lib/store/resume"
import ResumeEditor from "./resume-editor"
import { useDebouncedCallback } from "@mantine/hooks"
import { ResumeRightPanel } from "@/components/resumes/resume-right-panel"
import { ResumeSectionEditModal } from "@/components/resumes/resume-section-edit-modal"

export default function ResumePage() {
  const { saveApplicationResume, applicationResumeData: persistedResume, application } = useApplicationResume()
  const isAutosaveSuspended = useAtomValue(resumeAutosaveSuspendedAtom)
  const methods = useForm<ResumeData>({
    defaultValues: persistedResume || {},
    mode: "onChange"
  })
  const { watch, reset, getValues } = methods

  const previousResumeIdRef = useRef<string | null>(
    application?.resume.id ?? null
  )

  const handleFormChange = useCallback(
    async (formData: ResumeData) => {
      if (!application?.resume.id) return
      if (application.resume.id !== previousResumeIdRef.current) return

      const mergedData = {
        ...formData,
        sectionOrder: formData.sectionOrder || persistedResume?.sectionOrder
      }

      await saveApplicationResume(mergedData)
    },
    [application?.resume.id, saveApplicationResume, persistedResume?.sectionOrder]
  )

  const debouncedSave = useDebouncedCallback(handleFormChange, 1000)

  useEffect(() => {
    const { unsubscribe } = watch((formData) => {
      if (!formData || application?.resume.id !== previousResumeIdRef.current) {
        return
      }

      if (isAutosaveSuspended) {
        debouncedSave.cancel()
        return
      }

      if (formData && application?.resume.id === previousResumeIdRef.current) {
        debouncedSave(formData as ResumeData)
      }
    })
    return () => unsubscribe()
  }, [watch, debouncedSave, application?.resume.id, isAutosaveSuspended])

  useEffect(() => {
    const currentResumeId = application?.resume.id

    if (!currentResumeId || !persistedResume) return

    if (currentResumeId !== previousResumeIdRef.current) {
      previousResumeIdRef.current = currentResumeId
      reset(persistedResume)
    } else {
      const currentFormData = getValues()
      if (JSON.stringify(currentFormData) !== JSON.stringify(persistedResume)) {
        reset(persistedResume)
      }
    }
  }, [application?.resume.id, persistedResume, reset, getValues])

  return (
    <FormProvider {...methods}>
      <>
        <div className="relative flex h-[calc(100vh-3rem)] overflow-hidden">
          <div className="flex h-full flex-1 flex-col lg:flex-row">
            <div className="min-w-0 flex-1 overflow-y-auto">
              <div className="flex h-full flex-col gap-4 divide-y overflow-y-auto">
                <ResumeEditor />
              </div>
            </div>
            <aside className="h-[360px] shrink-0 overflow-hidden bg-background lg:h-full lg:w-[600px]">
              <div className="right h-full min-h-0">
                <ResumeRightPanel />
              </div>
            </aside>
          </div>
        </div>
        <ResumeSectionEditModal />
      </>
    </FormProvider>
  )
}
