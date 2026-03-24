import { useAtom } from "jotai/index"
import { rightPanelViewAtom, useResume } from "@/lib/store/resume"
import { EvaluationReport } from "@/components/client-components/evaluation-report"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from "../ui/empty"
import { Spinner } from "../ui/spinner"
import { useTranslations } from "next-intl"
import { PersonalInfoForm } from "@/components/forms/personal-info-form"
import { EducationForm } from "@/components/forms/education-form"
import { EmploymentForm } from "@/components/forms/employment-form"
import { SkillsForm } from "@/components/forms/skills-form"
import { ChatInterface } from "@/components/agent/chat-interface"
import { ChatSessionControls } from "@/components/agent/chat-session-controls"
import { useChatSessions } from "@/lib/hooks/use-chat-sessions"

export function ResumeRightPanel() {
  const [rightPanelView] = useAtom(rightPanelViewAtom)
  const [loading, setLoading] = useState(false)
  const { selectedSectionId, resumeEvaluation, refreshEvaluationReport } =
    useResume()
  const t = useTranslations("rightPanel")
  useChatSessions()

  const renderSelectedSectionForm = () => {
    switch (selectedSectionId) {
      case "personalInfo":
        return <PersonalInfoForm />
      case "education":
        return <EducationForm />
      case "employment":
        return <EmploymentForm />
      case "skills":
        return <SkillsForm />
      default:
        return (
          <p className="text-gray-500">Select a part of resume to edit。</p>
        )
    }
  }

  const handleCreateEvaluationReport = async () => {
    setLoading(true)
    await refreshEvaluationReport()
    setLoading(false)
  }

  return (
    <>
      {rightPanelView === "chat" && (
        <div className="flex flex-col h-full">
          <ChatSessionControls />
          <div className="flex-1 overflow-hidden">
            <ChatInterface className="h-full" />
          </div>
        </div>
      )}
      {rightPanelView === "evaluation" && (
        <div className="p-4">
          {resumeEvaluation ? (
            <EvaluationReport evaluation={resumeEvaluation} />
          ) : (
            <Empty className="h-full w-full flex flex-col items-center justify-center gap-4">
              <EmptyHeader>
                <EmptyTitle>
                  {loading ? t("evaluationLoadingTitle") : t("evaluationTitle")}
                </EmptyTitle>
                <EmptyDescription>
                  {loading
                    ? t("evaluationLoadingDescription")
                    : t("evaluationDescription")}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={handleCreateEvaluationReport}
                >
                  {loading && <Spinner />}
                  {t("evaluateResume")}
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      )}
      {rightPanelView === "form" && (
        <div className="p-4">{renderSelectedSectionForm()}</div>
      )}
    </>
  )
}
