"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { ResumeEvaluationOutput } from "@/types/evaluation"
import {
  AlertCircle,
  Target,
  AlertTriangle,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useResume } from "@/lib/store/resume"
import SkeletonCard from "../skeletons/skeleton-card"
import { useFormContext } from "react-hook-form"
import type { ResumeData } from "@/types/resume"
import { toast } from "sonner"
import { trackClickAiFullSuggestion } from "@/lib/user-tracking/user-tracking"
import { applyResumeEditOps } from "@/lib/resume/agent-ops"

interface EvaluationReportProps {
  evaluation: ResumeEvaluationOutput
}

export function EvaluationReport({ evaluation }: EvaluationReportProps) {
  const t = useTranslations("evaluation")
  const [loading, setLoading] = useState<boolean>(false)
  const [optimizeLoading, setOptimizeLoading] = useState<boolean>(false)
  const { refreshEvaluationReport, application } = useResume()
  const { getValues, setValue } = useFormContext<ResumeData>()

  const getGateStatus = (status: "pass" | "borderline" | "fail") => {
    switch (status) {
      case "pass":
        return {
          label: t("gates.pass"),
          color: "text-green-700",
          icon: <CheckCircle2 className="w-4 h-4 text-green-700" />
        }
      case "borderline":
        return {
          label: t("gates.borderline"),
          color: "text-yellow-700",
          icon: <AlertCircle className="w-4 h-4 text-yellow-700" />
        }
      case "fail":
        return {
          label: t("gates.needsAttention"),
          color: "text-red-700",
          icon: <XCircle className="w-4 h-4 text-red-700" />
        }
    }
  }

  const getSeverityColor = (severity: "critical" | "important" | "minor") => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white"
      case "important":
        return "bg-orange-500 text-white"
      case "minor":
        return "bg-yellow-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getSeverityIcon = (severity: "critical" | "important" | "minor") => {
    switch (severity) {
      case "critical":
        return (
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
        )
      case "important":
        return (
          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
        )
      case "minor":
        return (
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
        )
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
    }
  }

  const getPriorityColor = (priority: "1" | "2" | "3") => {
    switch (priority) {
      case "1":
        return "text-red-600 border-red-200 bg-red-50"
      case "2":
        return "text-orange-600 border-orange-200 bg-orange-50"
      case "3":
        return "text-blue-600 border-blue-200 bg-blue-50"
      default:
        return "text-gray-600 border-gray-200 bg-gray-50"
    }
  }

  const refreshEvaluation = async () => {
    setLoading(true)
    await refreshEvaluationReport()
    setLoading(false)
  }

  const handleFullResumeOptimizing = async () => {
    try {
      trackClickAiFullSuggestion()
      setOptimizeLoading(true)
      const result = await fetch(
        `/api/resume/ops-from-evaluation?jobApplicationId=${application.id}`
      )
      if (!result.ok) {
        throw new Error(await result.text())
      }
      const { ops, errors } = await result.json()
      const current = getValues()
      const { updatedResumeData } = applyResumeEditOps(current, ops)

      Object.entries(updatedResumeData).forEach(([key, value]) => {
        setValue(key as keyof ResumeData, value as any, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      })

      if (errors?.length) {
        toast.error(`部分操作未应用: ${errors.length}`)
      }
    } catch (e: any) {
      toast.error(e.toString())
    } finally {
      setOptimizeLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {!loading && (
          <>
            <Button onClick={refreshEvaluation} variant="outline">
              {t("refreshEvaluation")}
            </Button>
            <Button
              onClick={handleFullResumeOptimizing}
              disabled={optimizeLoading}
              className="flex items-center gap-2"
            >
              {optimizeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("optimizing")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t("oneClickOptimize")}
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {!loading && (
        <>
          {/* Screening Readiness */}
          {evaluation.gates && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("screeningReadiness")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* ATS Screening */}
                <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <span className="text-sm font-medium">
                    {t("gates.atsScreening")}
                  </span>
                  <div className="flex items-center gap-2">
                    {getGateStatus(evaluation.gates.ats).icon}
                    <span
                      className={`text-sm font-medium ${getGateStatus(evaluation.gates.ats).color}`}
                    >
                      {getGateStatus(evaluation.gates.ats).label}
                    </span>
                  </div>
                </div>

                {/* HR 30-Second Scan */}
                <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <span className="text-sm font-medium">
                    {t("gates.hrScan")}
                  </span>
                  <div className="flex items-center gap-2">
                    {getGateStatus(evaluation.gates.hr).icon}
                    <span
                      className={`text-sm font-medium ${getGateStatus(evaluation.gates.hr).color}`}
                    >
                      {getGateStatus(evaluation.gates.hr).label}
                    </span>
                  </div>
                </div>

                {/* Hiring Manager Fit */}
                <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <span className="text-sm font-medium">
                    {t("gates.hiringManagerFit")}
                  </span>
                  <div className="flex items-center gap-2">
                    {getGateStatus(evaluation.gates.hiringManager).icon}
                    <span
                      className={`text-sm font-medium ${getGateStatus(evaluation.gates.hiringManager).color}`}
                    >
                      {getGateStatus(evaluation.gates.hiringManager).label}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 差距分析 */}
          {evaluation.gaps && evaluation.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("gaps")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {evaluation.gaps.map((gap, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(gap.severity)}
                        <span className="text-sm font-medium">
                          {t(`dimension.${gap.dimension}`)}
                        </span>
                      </div>
                      <Badge className={getSeverityColor(gap.severity)}>
                        {t(`severity.${gap.severity}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {gap.description}
                    </p>
                    {gap.evidence && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("evidence")}:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {gap.evidence}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 改进建议 */}
          {evaluation.actions && evaluation.actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {evaluation.actions.map((action, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t(`targetSection.${action.targetSection}`)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(action.priority)}
                      >
                        {t(`priority.${action.priority}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.instruction}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
