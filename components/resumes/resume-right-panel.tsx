import { useAtom } from "jotai/index"
import { rightPanelViewAtom, useApplicationResume } from "@/lib/store/resume"
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
import { ChatInterface } from "@/components/agent/chat-interface"
import { useChatSession } from "@/lib/hooks/use-chat-session"
import { cn } from "@/lib/utils"

export function ResumeRightPanel() {
  const [rightPanelView, setRightPanelView] = useAtom(rightPanelViewAtom)
  const [loading, setLoading] = useState(false)
  const { resumeEvaluation, refreshEvaluationReport } = useApplicationResume()
  const t = useTranslations("rightPanel")
  const commonT = useTranslations()
  const evaluationT = useTranslations("evaluation")
  useChatSession()

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
              rightPanelView === "evaluation" ? "" : "rounded-xl p-4 sm:p-5"
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
          </div>
        </div>
      </div>
    </div>
  )
}
