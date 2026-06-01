"use client"

import type { ToolCallMessagePartComponent } from "@assistant-ui/react"
import { ResumeActionOutputCard } from "@/components/agent/resume-action-output-card"
import { useTranslations } from "next-intl"

function getToolErrorMessage(result: unknown) {
  if (typeof result === "string") {
    return result
  }

  if (result && typeof result === "object") {
    if ("errorText" in result && result.errorText) {
      return String(result.errorText)
    }

    if ("error" in result && result.error) {
      return String(result.error)
    }
  }

  return null
}

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
    const errorMessage = getToolErrorMessage(result)

    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      >
        <div className="font-medium">{t("toolError")}</div>
        {errorMessage && <div className="mt-1">{errorMessage}</div>}
      </div>
    )
  }

  return <ResumeActionOutputCard output={result} />
}
