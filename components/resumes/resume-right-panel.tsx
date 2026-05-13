import { useAtom } from "jotai/index"
import { rightPanelViewAtom, useResume } from "@/lib/store/resume"
import { EvaluationReport } from "@/components/client-components/evaluation-report"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { MessageCircle, Trophy } from "lucide-react"
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
import { ProjectsForm } from "@/components/forms/projects-form"
import { ResearchForm } from "@/components/forms/research-form"
import { PublicationsForm } from "@/components/forms/publications-form"
import { AwardsForm } from "@/components/forms/awards-form"
import { CertificationsForm } from "@/components/forms/certifications-form"
import { ChatInterface } from "@/components/agent/chat-interface"
import { useChatSession } from "@/lib/hooks/use-chat-session"
import { cn } from "@/lib/utils"

export function ResumeRightPanel() {
  const [rightPanelView, setRightPanelView] = useAtom(rightPanelViewAtom)
  const [loading, setLoading] = useState(false)
  const { selectedSectionId, resumeEvaluation, refreshEvaluationReport } =
    useResume()
  const t = useTranslations("rightPanel")
  const commonT = useTranslations()
  useChatSession()

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
      case "projects":
        return <ProjectsForm />
      case "research":
        return <ResearchForm />
      case "publications":
        return <PublicationsForm />
      case "awards":
        return <AwardsForm />
      case "certifications":
        return <CertificationsForm />
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
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant={rightPanelView === "chat" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full",
              rightPanelView !== "chat" && "text-muted-foreground"
            )}
            onClick={() => setRightPanelView("chat")}
          >
            <MessageCircle />
            {commonT("button.aiChat")}
          </Button>
          <Button
            variant={rightPanelView === "evaluation" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "rounded-full",
              rightPanelView !== "evaluation" && "text-muted-foreground"
            )}
            onClick={() => setRightPanelView("evaluation")}
          >
            <Trophy />
            {commonT("button.viewEvaluationReport")}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {rightPanelView === "chat" && (
          <div className="h-full">
            <ChatInterface className="h-full" />
          </div>
        )}
        {rightPanelView === "evaluation" && (
          <div className="h-full overflow-y-auto p-4">
            {resumeEvaluation ? (
              <EvaluationReport evaluation={resumeEvaluation} />
            ) : (
              <Empty className="h-full w-full flex flex-col items-center justify-center gap-4">
                <EmptyHeader>
                  <EmptyTitle>
                    {loading
                      ? t("evaluationLoadingTitle")
                      : t("evaluationTitle")}
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
          <div className="h-full overflow-y-auto p-4">
            {renderSelectedSectionForm()}
          </div>
        )}
      </div>
    </div>
  )
}
