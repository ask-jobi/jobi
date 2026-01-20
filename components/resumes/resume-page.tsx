"use client"

import { useEffect, useRef } from "react"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import { saveResumeChange } from "@/server/resume"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ResumeData } from "@/types/resume"
import { isRightPanelCollapsedAtom, useResume } from "@/lib/store/resume"
import ResumeEditor from "./resume-editor"
import { useDebouncedCallback } from "@mantine/hooks"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import { useAtom } from "jotai"
import { ResumeRightPanel } from "@/components/resumes/resume-right-panel"

export default function ResumePage() {
  const { updateResumeData, setLoading, resumeData, application } = useResume()
  const methods = useForm<ResumeData>({
    defaultValues: resumeData,
    mode: "onChange"
  })
  const { subscribe, getValues, reset } = methods

  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useAtom(
    isRightPanelCollapsedAtom
  )

  // 使用 ref 来跟踪上一次的简历 ID，只在切换简历时重置表单
  const previousResumeIdRef = useRef<string | null>(
    application?.resume.id ?? null
  )

  // Reset form only when switching between resumes (resume ID changes)
  useEffect(() => {
    const currentResumeId = application?.resume.id

    // 如果是切换到了新的简历，需要重置表单
    if (currentResumeId && currentResumeId !== previousResumeIdRef.current) {
      previousResumeIdRef.current = currentResumeId
      if (resumeData) {
        reset(resumeData)
      }
    } else if (
      previousResumeIdRef.current === null &&
      currentResumeId &&
      resumeData
    ) {
      // 初始化时，如果还没有设置过 previousResumeId，也需要重置表单
      previousResumeIdRef.current = currentResumeId
      reset(resumeData)
    }
  }, [application?.resume.id, resumeData, reset])

  const handleChange = async () => {
    try {
      const formData = getValues()
      await saveResumeChange(application.resume.id, formData)
      updateResumeData(formData)
      setLoading(false)
      toast.success("Auto saved")
    } catch (error) {
      console.error("Auto save failed:", error)
      toast.error("Auto save failed")
    }
  }
  const debouncedSave = useDebouncedCallback(handleChange, 2000)

  useEffect(() => {
    const callback = subscribe({
      formState: {
        values: true,
        isDirty: true
      },
      callback: (data) => {
        if (data.values && data.isDirty) {
          updateResumeData(data.values)
          debouncedSave()
        }
      }
    })
    return () => callback()
  }, [subscribe, debouncedSave, updateResumeData])

  // useEffect(() => {
  //   if (rightPanelView !== 'form' && selectedSectionId) {
  //     setRightPanelView('form');
  //   }
  // }, [selectedSectionId, rightPanelView]);

  const toggleRightPanel = () => {
    setIsRightPanelCollapsed(!isRightPanelCollapsed)
  }

  return (
    <FormProvider {...methods}>
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
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
                  aria-label="Collapse right panel"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </PanelResizeHandle>
              <Panel
                minSize={20}
                defaultSize={33}
                className="h-full overflow-y-auto border-l"
              >
                <div className="right p-6 h-full overflow-y-auto">
                  <ResumeRightPanel />
                </div>
              </Panel>
            </>
          )}
          {isRightPanelCollapsed && (
            <div className="w-1 bg-gray-200 hover:bg-gray-300 relative group">
              <button
                onClick={toggleRightPanel}
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Expand right panel"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
          )}
        </PanelGroup>
      </div>
    </FormProvider>
  )
}
