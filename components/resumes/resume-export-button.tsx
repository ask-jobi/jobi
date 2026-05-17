"use client"

import { useState, type ComponentProps } from "react"
import { Download, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useApplicationResume } from "@/lib/store/resume"
import { trackExportResume } from "@/lib/user-tracking/user-tracking"

type ResumeExportButtonProps = {
  className?: string
  size?: ComponentProps<typeof Button>["size"]
  variant?: ComponentProps<typeof Button>["variant"]
  showLabel?: boolean
}

export function ResumeExportButton({
  className,
  size = "sm",
  variant = "outline",
  showLabel = true
}: ResumeExportButtonProps) {
  const t = useTranslations()
  const { application, isLoading } = useApplicationResume()
  const [exportLoading, setExportLoading] = useState(false)

  const handleExport = async () => {
    if (!application?.resume.id) {
      toast.error(t("exportResumeError"))
      return
    }

    trackExportResume()

    try {
      setExportLoading(true)
      const response = await fetch(
        `/api/resume/print?id=${application.resume.id}`
      )

      if (!response.ok) {
        toast.error(t("exportResumeError"))
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "resume.pdf"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(`${t("exportResumeError")}: ${error}`)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={isLoading || exportLoading}
      title={t("button.exportResume")}
    >
      {exportLoading ? <Loader2 className="animate-spin" /> : <Download />}
      {showLabel ? t("button.exportResume") : null}
    </Button>
  )
}
