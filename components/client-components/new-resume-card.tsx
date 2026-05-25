"use client"

import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import { defineStepper } from "@/components/ui/stepper"
import JobInformationForm from "@/components/forms/job-information-form"
import {
  jobInfoFormSchema,
  type JobInfoFormType
} from "@/lib/job-info-form-schema"
import { useState, useEffect, useCallback, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import ResumeAnalyzeProgress, {
  INTAKE_STEPS,
  type StepState,
  type StepStatus
} from "@/components/resumes/resume-analyze-progress"
import {
  EventStreamContentType,
  fetchEventSource
} from "@microsoft/fetch-event-source"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  trackStartResumeUpload,
  trackOpenResumeUploadDialog,
  trackSuccessResumeUpload,
  trackFailedResumeUpload,
  trackSelectResumeFile
} from "@/lib/user-tracking/user-tracking"
import ResumeUpload from "@/components/resumes/resume-upload"

// ── SSE Event types ─────────────────────────────────────────────
// Mirrors the IntakeEvent union from server/intake/types.ts

type SseEvent =
  | { type: "intake.start"; intakeId: string }
  | { type: "step.start"; intakeId: string; step: string }
  | { type: "step.done"; intakeId: string; step: string }
  | {
      type: "step.failed"
      intakeId: string
      step: string
      error: { code: string; userMessage: string }
    }
  | { type: "rollback.start"; intakeId: string }
  | {
      type: "rollback.done"
      intakeId: string
      allSucceeded: boolean
      failureCount: number
    }
  | {
      type: "intake.done"
      intakeId: string
      applicationId: string
      resumeId: string
    }
  | {
      type: "intake.failed"
      intakeId: string
      error: { code: string; userMessage: string }
    }
  | {
      type: "intake.cancelled"
      intakeId: string
      reason: { code: string; userMessage: string }
    }

const { Stepper } = defineStepper(
  { id: "step-1", title: "Job Information", i18n: "stepJobInfo" },
  { id: "step-2", title: "Upload Resume", i18n: "stepUpload" },
  { id: "step-3", title: "Analyze Resume", i18n: "stepAnalyze" }
)

async function getUploadAndAnalyzeErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const data = await response.clone().json()
      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error
      }
    } catch {
      // fall through to generic message
    }
  }

  return `Upload failed (${response.status})`
}

const NewResumeCard = () => {
  const [cardOpen, setCardOpen] = useState<boolean>(false)
  const [steps, setSteps] = useState<StepState[]>(() =>
    INTAKE_STEPS.map((s) => ({ ...s }))
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File>()
  const [controller, setController] = useState<AbortController | null>(null)
  const activeIntakeIdRef = useRef<string | null>(null)
  const t = useTranslations()
  const form = useForm<JobInfoFormType>({
    resolver: zodResolver(jobInfoFormSchema),
    defaultValues: {
      name: "",
      company: "",
      description: ""
    }
  })

  const router = useRouter()

  const resetAnalysisState = useCallback(() => {
    setSteps(INTAKE_STEPS.map((s) => ({ ...s })))
    setIsAnalyzing(false)
    setAnalysisError(null)
    activeIntakeIdRef.current = null
  }, [])

  const resetForm = useCallback(() => {
    form.reset()
    resetAnalysisState()
    setResumeFile(undefined)
  }, [form, resetAnalysisState])

  const handleOpenDialog = (open: boolean) => {
    if (!open) {
      // Abort any in-flight request
      if (controller) {
        controller.abort()
      }
      resetForm()
    }
    setCardOpen(open)
    if (open) {
      trackOpenResumeUploadDialog()
    }
  }

  const handleNext = async (methods: any) => {
    if (methods.current.id === "step-1") {
      const isValid = await form.trigger()
      if (!isValid) {
        return
      }
    }
    if (methods.current.id === "step-2") {
      if (!resumeFile) {
        toast.warning("Please upload one resume when goto next step.")
        return
      }
      analyzeResume()
    }
    methods.next()
  }

  const createEmptyResume = async () => {
    try {
      const response = await fetch("/api/resume/create-empty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobInfo: form.getValues()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "create empty resume failed")
      }

      const result = await response.json()
      resetForm()
      setCardOpen(false)
      router.push(`/application/${result.data.applicationData.id}`)
    } catch (error: any) {
      console.error("创建空白简历失败:", error)
      toast.error(error.message || "create empty resume failed")
    }
  }

  /** Update a single step's status in the steps array */
  const updateStepStatus = useCallback((stepId: string, status: StepStatus) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId)
      if (idx < 0) return prev
      const next = prev.map((s, i) => (i === idx ? { ...s, status } : { ...s }))
      return next
    })
  }, [])

  const handleSseEvent = useCallback(
    (event: SseEvent) => {
      if (event.type !== "intake.start") {
        const activeIntakeId = activeIntakeIdRef.current
        if (!activeIntakeId || event.intakeId !== activeIntakeId) {
          return
        }
      }

      switch (event.type) {
        case "intake.start":
          activeIntakeIdRef.current = event.intakeId
          setAnalysisError(null)
          setSteps(INTAKE_STEPS.map((s) => ({ ...s })))
          break

        case "step.start":
          updateStepStatus(event.step, "loading")
          break

        case "step.done":
          updateStepStatus(event.step, "success")
          break

        case "step.failed":
          updateStepStatus(event.step, "error")
          // Don't show toast here — intake.failed will handle the final message
          break

        case "rollback.start":
        case "rollback.done":
          // Rollback events are internal; frontend ignores them
          break

        case "intake.done": {
          activeIntakeIdRef.current = null
          trackSuccessResumeUpload({
            fileName: resumeFile?.name || "unknown"
          })
          setAnalysisError(null)
          setIsAnalyzing(false)
          setTimeout(() => {
            resetForm()
            setCardOpen(false)
            router.push(`/application/${event.applicationId}`)
          }, 800)
          break
        }

        case "intake.failed": {
          activeIntakeIdRef.current = null
          trackFailedResumeUpload({
            fileName: resumeFile?.name || "unknown",
            error: event.error.userMessage
          })
          setAnalysisError(event.error.userMessage)
          setIsAnalyzing(false)
          toast.error(event.error.userMessage)
          break
        }

        case "intake.cancelled":
          activeIntakeIdRef.current = null
          setAnalysisError(null)
          setIsAnalyzing(false)
          break
      }
    },
    [resumeFile, router, resetForm, updateStepStatus]
  )

  const analyzeResume = async () => {
    if (isAnalyzing || !resumeFile) return

    resetAnalysisState()
    setIsAnalyzing(true)
    const newController = new AbortController()
    setController(newController)

    try {
      trackStartResumeUpload({
        fileName: resumeFile?.name || "unknown"
      })

      const formData = new FormData()
      formData.append("file", resumeFile!!)
      formData.append("jobInfo", JSON.stringify(form.getValues()))

      await fetchEventSource("/api/resume/upload-and-analyze", {
        method: "POST",
        body: formData,
        signal: newController.signal,
        async onopen(response) {
          const contentType = response.headers.get("content-type")

          if (response.ok && contentType?.startsWith(EventStreamContentType)) {
            return
          }

          throw new Error(await getUploadAndAnalyzeErrorMessage(response))
        },
        onmessage(event) {
          try {
            const data = JSON.parse(event.data) as SseEvent
            handleSseEvent(data)
          } catch {
            // Ignore unparseable messages
          }
        },
        onerror(err) {
          const errorMessage =
            err instanceof Error ? err.message : "unknown error"

          setAnalysisError(errorMessage)
          setIsAnalyzing(false)
          trackFailedResumeUpload({
            fileName: resumeFile?.name || "unknown",
            error: errorMessage
          })
          throw err
        }
      })
    } catch (error: any) {
      if (error.name === "AbortError") {
        // User cancelled — already handled by intake.cancelled event
        return
      }
      // Other errors (network, etc.)
      setAnalysisError(error.message || "Upload failed")
      setIsAnalyzing(false)
      toast.error(error.message || "Upload failed")
    }
  }

  const handleRetryAnalysis = () => {
    analyzeResume()
  }

  const handleCreateEmpty = () => {
    createEmptyResume()
  }

  const handleSelectFile = (file: File) => {
    setResumeFile(file)
    trackSelectResumeFile({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controller) {
        controller.abort()
      }
    }
  }, [controller])

  return (
    <Dialog open={cardOpen} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Card className="aspect-[1/1.414] border-dashed cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary">
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-lg font-medium text-muted-foreground select-none">
              {t("createNewResume")}
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("createNewResume")}</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <Stepper.Provider className="space-y-4">
          {({ methods }) => (
            <>
              <Stepper.Navigation>
                {methods.all.map((step) => (
                  <Stepper.Step key={step.id} of={step.id}>
                    <Stepper.Title>{t(`form.${step.i18n}`)}</Stepper.Title>
                  </Stepper.Step>
                ))}
              </Stepper.Navigation>
              {methods.switch({
                "step-1": () => <JobInformationForm form={form} />,
                "step-2": () => (
                  <div className="space-y-4">
                    <ResumeUpload
                      file={resumeFile}
                      onSelectFile={handleSelectFile}
                    />
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        {t("modal.or")}
                      </div>
                      <Button
                        onClick={handleCreateEmpty}
                        variant="outline"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                      >
                        <FileText className="size-4 mr-1" />
                        {t("button.createEmptyResume")}
                      </Button>
                    </div>
                  </div>
                ),
                "step-3": () => (
                  <div className="space-y-3">
                    <ResumeAnalyzeProgress steps={steps} />
                    {analysisError ? (
                      <p className="text-sm text-destructive">
                        {analysisError}
                      </p>
                    ) : null}
                  </div>
                )
              })}
              <Stepper.Controls>
                {!methods.isLast && (
                  <Button
                    variant="secondary"
                    onClick={methods.prev}
                    disabled={methods.isFirst}
                  >
                    {t("form.previous")}
                  </Button>
                )}
                {methods.switch({
                  "step-1": () => (
                    <Button onClick={() => handleNext(methods)}>
                      {t("form.next")}
                    </Button>
                  ),
                  "step-2": () => (
                    <Button
                      onClick={() => handleNext(methods)}
                      disabled={!resumeFile || isAnalyzing}
                    >
                      {t("form.startAnalysis")}
                    </Button>
                  ),
                  "step-3": () =>
                    analysisError ? (
                      <Button
                        onClick={handleRetryAnalysis}
                        disabled={isAnalyzing}
                      >
                        {t("form.retryAnalysis")}
                      </Button>
                    ) : null
                })}
              </Stepper.Controls>
            </>
          )}
        </Stepper.Provider>
      </DialogContent>
    </Dialog>
  )
}
export default NewResumeCard
