import { useAtom } from "jotai/index"
import { rightPanelViewAtom, useResume } from "@/lib/store/resume"
import { EvaluationReport } from "@/components/client-components/evaluation-report"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { LoaderCircle, MessageCircle, RotateCcw, Trophy } from "lucide-react"
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
  const sectionT = useTranslations("chat.toolOutput.entity")
  const evaluationT = useTranslations("evaluation")
  useChatSession()

  const selectedSectionLabel = selectedSectionId
    ? sectionT(selectedSectionId as Parameters<typeof sectionT>[0])
    : null

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
          <Empty className="min-h-[280px] w-full justify-center rounded-xl border border-dashed bg-muted/35 px-6">
            <EmptyHeader>
              <EmptyTitle>{t("formEmptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("formEmptyDescription")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
    }
  }

  const handleCreateEvaluationReport = async () => {
    setLoading(true)
    await refreshEvaluationReport()
    setLoading(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background p-3 lg:p-4">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 shadow-sm sm:px-6">
          <div className="flex items-center gap-5 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto rounded-none border-b-2 px-0 py-2 text-sm font-semibold hover:bg-transparent",
                rightPanelView === "chat"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
              onClick={() => setRightPanelView("chat")}
            >
              <MessageCircle className="size-4" />
              {commonT("button.aiChat")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto rounded-none border-b-2 px-0 py-2 text-sm font-semibold hover:bg-transparent",
                rightPanelView === "evaluation"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
              onClick={() => setRightPanelView("evaluation")}
            >
              <Trophy className="size-4" />
              {t("evaluationTabLabel")}
            </Button>
          </div>
          <div className="shrink-0">
            {rightPanelView === "evaluation" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="rounded-lg text-sm"
                onClick={handleCreateEvaluationReport}
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                {resumeEvaluation
                  ? evaluationT("refreshEvaluation")
                  : t("evaluateResume")}
              </Button>
            ) : rightPanelView === "form" && selectedSectionLabel ? (
              <div className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                {selectedSectionLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 bg-background",
            rightPanelView === "evaluation" ? "" : "rounded-xl border shadow-sm"
          )}
        >
          <div
            className={cn(
              "flex h-full min-h-0 flex-col overflow-hidden bg-background",
              rightPanelView === "evaluation"
                ? ""
                : "rounded-xl p-4 sm:p-5"
            )}
          >
            {rightPanelView === "chat" && (
              <div className="min-h-0 flex-1">
                <ChatInterface className="h-full min-h-0" />
              </div>
            )}
            {rightPanelView === "evaluation" && (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {resumeEvaluation ? (
                  <EvaluationReport evaluation={resumeEvaluation} />
                ) : (
                  <Empty className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/35 px-6">
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
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {selectedSectionLabel && (
                  <div className="mb-4 border-b pb-3">
                    <div className="text-base font-semibold">
                      {selectedSectionLabel}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("formDescription")}
                    </div>
                  </div>
                )}
                {renderSelectedSectionForm()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
