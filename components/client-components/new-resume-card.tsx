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
import JobInformationForm, {
  formSchema,
  JobInfoFormType
} from "@/components/forms/job-information-form"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import ResumeAnalyzeProgress, {
  ProgressType
} from "@/components/resumes/resume-analyze-progress"
import { fetchEventSource } from "@microsoft/fetch-event-source"
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

const { Stepper } = defineStepper(
  { id: "step-1", title: "Job Information", i18n: "stepJobInfo" },
  { id: "step-2", title: "Upload Resume", i18n: "stepUpload" },
  { id: "step-3", title: "Analyze Resume", i18n: "stepAnalyze" }
)

const initialProgress: ProgressType = {
  step: "upload",
  status: "pending"
}

const NewResumeCard = () => {
  const [cardOpen, setCardOpen] = useState<boolean>(false)
  const [progress, setProgress] = useState<ProgressType>(initialProgress)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [resumeFile, setResumeFile] = useState<File>()
  const [controller, setController] = useState<AbortController | null>(null)
  const t = useTranslations()
  const form = useForm<JobInfoFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      description: ""
    }
  })

  const router = useRouter()

  const resetForm = () => {
    form.reset()
    setProgress(initialProgress)
    setResumeFile(undefined)
    setIsAnalyzing(false)
  }

  const handleOpenDialog = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    setCardOpen(open)
    trackOpenResumeUploadDialog()
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

      // 直接跳转到简历编辑页面
      resetForm()
      setCardOpen(false)
      router.push(`/application/${result.data.applicationData.id}`)
    } catch (error: any) {
      console.error("创建空白简历失败:", error)
      toast.error(error.message || "create empty resume failed")
    }
  }

  const analyzeResume = async () => {
    if (isAnalyzing) return

    setIsAnalyzing(true)
    const newController = new AbortController()
    setController(newController)

    try {
      // 跟踪开始上传和分析简历的事件
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
        onmessage(event) {
          const data = JSON.parse(event.data)
          if (data.error) {
            toast.error(data.error)
            setIsAnalyzing(false)
          }
          setProgress(data)

          if (data.step === "evaluate" && data.status === "success") {
            // 跟踪简历上传和分析成功的事件
            trackSuccessResumeUpload({
              fileName: resumeFile?.name || "unknown"
            })
            setTimeout(() => {
              resetForm()
              setCardOpen(false)
              // 重定向到简历详情页面（右侧面板包含聊天功能）
              if (data.resumeId && data.applicationId) {
                router.push(`/application/${data.applicationId}`)
              } else {
                router.refresh()
              }
            }, 1200)
          }
        },
        onerror(err) {
          setIsAnalyzing(false)
          // 跟踪简历上传失败的事件
          trackFailedResumeUpload({
            fileName: resumeFile?.name || "unknown",
            error: err instanceof Error ? err.message : "unknown error"
          })
          throw err
        }
      })
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted")
        return
      }
    }
  }

  const handleCreateEmpty = () => {
    createEmptyResume()
  }

  const handleSelectFile = (file: File) => {
    setResumeFile(file)
    // 跟踪用户选择简历文件的事件
    trackSelectResumeFile({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
  }

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
                "step-3": () => <ResumeAnalyzeProgress progress={progress} />
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
                  )
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
