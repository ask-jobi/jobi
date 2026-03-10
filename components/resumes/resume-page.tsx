"use client"

import { useEffect, useRef, useCallback } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { PanelRightClose } from "lucide-react"
import { ResumeData } from "@/types/resume"
import { isRightPanelCollapsedAtom, useResume } from "@/lib/store/resume"
import { useAtom } from "jotai"
import ResumeEditor from "./resume-editor"
import { useDebouncedCallback } from "@mantine/hooks"
import { Panel, Group, usePanelRef, PanelSize } from "react-resizable-panels"
import { ResumeRightPanel } from "@/components/resumes/resume-right-panel"
import { Button } from "../ui/button"

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

  const panelRef = usePanelRef()

  const handlePanelResize = useCallback(
    (panelSize: PanelSize) => {
      const collapsed = panelSize.asPercentage === 0
      if (collapsed !== isRightPanelCollapsed) {
        setIsRightPanelCollapsed(collapsed)
      }
    },
    [isRightPanelCollapsed, setIsRightPanelCollapsed]
  )

  useEffect(() => {
    if (isRightPanelCollapsed) {
      panelRef.current?.collapse()
    } else {
      panelRef.current?.expand()
    }
  }, [isRightPanelCollapsed, panelRef])

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
        <Group orientation="horizontal" className="flex-1 h-full relative">
          <Panel minSize="60%" className="h-full overflow-y-auto">
            <div className="flex flex-col gap-4 divide-y h-full overflow-y-auto">
              <ResumeEditor />
            </div>
          </Panel>
          {isRightPanelCollapsed && (
            <button
              className="h-full w-3 hover:bg-gray-100 hover:bl-1 cursor-pointer"
              onClick={toggleRightPanel}
            />
          )}
          {!isRightPanelCollapsed && (
            <div className="relative pointer-events-auto">
              <Button
                size="icon"
                variant="outline"
                className="absolute z-100 h-6 w-6 -left-3 top-[45%] hover:bg-gray-100 hover:bl-1 rounded-full cursor-pointer"
                onClick={toggleRightPanel}
              >
                <PanelRightClose height="4px" width="4px" />
              </Button>
            </div>
          )}
          <Panel
            minSize="30%"
            panelRef={panelRef}
            collapsible
            onResize={handlePanelResize}
            className="h-full overflow-hidden border-l"
          >
            <div className="right h-full overflow-y-auto">
              <ResumeRightPanel />
            </div>
          </Panel>
        </Group>
      </div>
    </FormProvider>
  )
}
