import { useAtom } from "jotai/index"
import {
  rightPanelViewAtom,
  useResume,
  openRightPanelAtom
} from "@/lib/store/resume"
import { useSetAtom } from "jotai"
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
import { X } from "lucide-react"

export function ResumeRightPanel() {
  const [rightPanelView] = useAtom(rightPanelViewAtom)
  const openRightPanel = useSetAtom(openRightPanelAtom)
  const [loading, setLoading] = useState(false)
  const {
    selectedSectionId,
    resumeEvaluation,
    refreshEvaluationReport,
    application
  } = useResume()
  const t = useTranslations("rightPanel")
  const tChat = useTranslations("chat")

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

  const closeChat = () => {
    openRightPanel("evaluation")
  }

  return (
    <>
      {rightPanelView === "chat" && (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">{tChat("aiChat")}</h3>
              <p className="text-xs text-muted-foreground">
                {tChat("chatAboutResume")}
              </p>
            </div>
            <button onClick={closeChat} className="p-1 hover:bg-muted rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
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
