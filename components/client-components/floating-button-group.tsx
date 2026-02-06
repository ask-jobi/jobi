"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2, Download } from "lucide-react"
import {
  openRightPanelAtom,
  useResume
} from "@/lib/store/resume"
import { toast } from "sonner"
import { useSetAtom } from "jotai"
import {
  trackExportResume
} from "@/lib/user-tracking/user-tracking"
import { useTranslations } from "next-intl"
import { MessageCircle } from "lucide-react"

export function FloatingButtonGroup() {
  const t = useTranslations()
  const { application, isLoading, setLoading: setGlobalLoading } = useResume()
  const openRightPanel = useSetAtom(openRightPanelAtom)
  const [exportLoading, setExportLoading] = useState<boolean>(false)

  const handleExport = async () => {
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
    } catch (e) {
      toast.error(`${t("exportResumeError")}: ${e}`)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 z-50">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all"
        onClick={() => {
          if (openRightPanel) {
            openRightPanel("chat")
          }
        }}
        title={t("button.aiChat")}
      >
        <MessageCircle className="w-5 h-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all"
        title={t("button.viewEvaluationReport")}
        onClick={() => {
          if (openRightPanel) {
            openRightPanel("evaluation")
          }
        }}
      >
        <Trophy className="w-5 h-5" />
      </Button>

      {/* Export 按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={handleExport}
        disabled={isLoading || exportLoading}
        title={t("button.exportResume")}
      >
        {exportLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </Button>
    </div>
  )
}
