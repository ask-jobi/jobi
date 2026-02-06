"use client"

import { useEffect, useRef, useCallback } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ResumeData } from "@/types/resume"
import { isRightPanelCollapsedAtom, useResume } from "@/lib/store/resume"
import { useAtom } from "jotai"
import ResumeEditor from "./resume-editor"
import { useDebouncedCallback } from "@mantine/hooks"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { ResumeRightPanel } from "@/components/resumes/resume-right-panel"
import { Button } from "@/components/ui/button"

export default function ResumePage() {
  const { updateResumeDataWithSave, resumeData, application } = useResume()
  const methods = useForm<ResumeData>({
    defaultValues: resumeData || {},
    mode: "onChange"
  })
  const { watch, reset, getValues } = methods

  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useAtom(
    isRightPanelCollapsedAtom
  )

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

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed)
  }

  return (
    <FormProvider {...methods}>
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden relative">
        <PanelGroup direction="horizontal" className="flex-1 h-full">
          <Panel
            minSize={25}
            defaultSize={isRightPanelCollapsed ? 100 : 67}
            className="h-full overflow-y-auto"
          >
            <div className="flex flex-col gap-4 divide-y h-full overflow-y-auto">
              <ResumeEditor />
            </div>
          </Panel>
          {!isRightPanelCollapsed && (
            <>
              <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 cursor-col-resize relative group">
                <button
                  onClick={toggleRightPanel}
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </PanelResizeHandle>
              <Panel
                minSize={30}
                defaultSize={50}
                className="h-full overflow-hidden border-l"
              >
                <div className="right h-full overflow-y-auto">
                  <ResumeRightPanel />
                </div>
              </Panel>
            </>
          )}
          {isRightPanelCollapsed && (
            <div className="w-1 bg-gray-200 hover:bg-gray-300 relative group">
              <Button
                onClick={toggleRightPanel}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
            </div>
          )}
        </PanelGroup>
      </div>
    </FormProvider>
  )
}
