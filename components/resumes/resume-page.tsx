"use client"

import { useEffect, useRef, useCallback } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { ResumeData } from "@/types/resume"
import { editModalRollbackResumeAtom, useResume } from "@/lib/store/resume"
import ResumeEditor from "./resume-editor"
import { useDebouncedCallback } from "@mantine/hooks"
import { ResumeRightPanel } from "@/components/resumes/resume-right-panel"
import { ResumeSectionEditModal } from "@/components/resumes/resume-section-edit-modal"
import { store } from "@/components/resumes/resume-context"

export default function ResumePage() {
  const { updateResumeDataWithSave, resumeData, application } = useResume()
  const methods = useForm<ResumeData>({
    defaultValues: resumeData || {},
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
        sectionOrder: formData.sectionOrder || resumeData?.sectionOrder
      }

      await updateResumeDataWithSave(mergedData)
    },
    [application?.resume.id, updateResumeDataWithSave, resumeData?.sectionOrder]
  )

  const debouncedSave = useDebouncedCallback(handleFormChange, 1000)

  useEffect(() => {
    const { unsubscribe } = watch((formData) => {
      if (!formData || application?.resume.id !== previousResumeIdRef.current) {
        return
      }

      if (store.get(editModalRollbackResumeAtom)) {
        debouncedSave.cancel()
        return
      }

      if (formData && application?.resume.id === previousResumeIdRef.current) {
        debouncedSave(formData as ResumeData)
      }
    })
    return () => unsubscribe()
  }, [watch, debouncedSave, application?.resume.id])

  useEffect(() => {
    const currentResumeId = application?.resume.id

    if (!currentResumeId || !resumeData) return

    if (currentResumeId !== previousResumeIdRef.current) {
      previousResumeIdRef.current = currentResumeId
      reset(resumeData)
    } else {
      const currentFormData = getValues()
      if (JSON.stringify(currentFormData) !== JSON.stringify(resumeData)) {
        reset(resumeData)
      }
    }
  }, [application?.resume.id, resumeData, reset, getValues])

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
