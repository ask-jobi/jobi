"use client"

import type { ToolCallMessagePartComponent } from "@assistant-ui/react"
import { ResumeActionOutputCard } from "@/components/agent/resume-action-output-card"
import { useTranslations } from "next-intl"

export const ResumeEditorToolUI: ToolCallMessagePartComponent = ({
  isError,
  result
}) => {
  const t = useTranslations("chat")
  if (!result) {
    return (
      <div className="text-sm text-muted-foreground p-2">{t("processing")}</div>
    )
  }

  if (isError) {
    console.warn("ResumeEditor tool call error: ", result.error)
    return null
  }

  return <ResumeActionOutputCard output={result} />
}
