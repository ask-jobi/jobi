"use client"

import React, {useState} from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ResumeEvaluationOutput } from '@/lib/evaluation/types'
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Target } from 'lucide-react'
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";
import {useResume} from "@/lib/store/resume";
import SkeletonCard from '../skeletons/skeleton-card'

interface EvaluationReportProps {
  evaluation: ResumeEvaluationOutput
}

export function EvaluationReport({ evaluation }: EvaluationReportProps) {
  const t = useTranslations("evaluation")
  const [loading, setLoading] = useState<boolean>(false)
  const {refreshEvaluationReport, evaluationRefreshFlag} = useResume()

  const getScoreColor = (score: number) => {
    if (score < 30) return 'bg-red-500'
    if (score < 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getDecisionBadge = (decision: string) => {
    const label = t(`decision.${decision}`)
    switch (decision) {
      case 'strong_hire':
        return <Badge className="bg-green-600 text-white">{label}</Badge>
      case 'hire':
        return <Badge className="bg-green-500 text-white">{label}</Badge>
      case 'neutral':
        return <Badge variant="secondary">{label}</Badge>
      case 'no_hire':
        return <Badge variant="destructive">{label}</Badge>
      default:
        return <Badge variant="secondary">{label}</Badge>
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-orange-600'
      case 'low':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const refreshEvaluation = async () => {
    setLoading(true)
    await refreshEvaluationReport()
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {
        loading && evaluationRefreshFlag && <Button onClick={refreshEvaluation}>{t("refreshEvaluation")}</Button>
      }

      {
        loading && (
        <>
          <SkeletonCard/>
          <SkeletonCard/>
          <SkeletonCard/>
          <SkeletonCard/>
        </>
        )
      }

      {
        !loading && (
          <>
            {/* 总体评分 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t("overallScore")}</CardTitle>
                  <div className="text-3xl font-bold">{evaluation.matchScore}</div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={evaluation.matchScore}
                  className="h-3"
                  indicatorClassName={getScoreColor(evaluation.matchScore)}
                />
                <p className="text-sm text-muted-foreground mt-2">{evaluation.summary}</p>
              </CardContent>
            </Card>

            {/* 推荐决策 */}
            {evaluation.recommendation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("recommendation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getDecisionBadge(evaluation.recommendation.decision)}
                    {evaluation.recommendation.confidence && (
                      <span className="text-sm text-muted-foreground">
                  {t("confidenceScore")}: {(evaluation.recommendation.confidence * 100).toFixed(0)}%
                </span>
                    )}
                  </div>
                  {evaluation.recommendation.rationale && (
                    <p className="text-sm text-muted-foreground">{evaluation.recommendation.rationale}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 评估维度 */}
            {evaluation.criteria && evaluation.criteria.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("criteria")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evaluation.criteria.map((criterion, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{criterion.name}</span>
                        <span className="text-sm font-bold">{criterion.score}</span>
                      </div>
                      <Progress
                        value={criterion.score}
                        className="h-2"
                        indicatorClassName={getScoreColor(criterion.score)}
                      />
                      {criterion.comment && (
                        <p className="text-xs text-muted-foreground">{criterion.comment}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 优势 */}
            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600"/>
                    {t("strengths")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0"/>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 待改进 */}
            {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-orange-600"/>
                    {t("weaknesses")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0"/>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 改进建议 */}
            {evaluation.improvementSuggestions && evaluation.improvementSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600"/>
                    {t("improvementSuggestions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {evaluation.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-muted rounded-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{suggestion.area}</span>
                        {suggestion.priority && (
                          <Badge
                            variant="outline"
                            className={getPriorityColor(suggestion.priority)}
                          >
                            {t(suggestion.priority)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.suggestion}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 关键词匹配 */}
            {evaluation.keywords && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("keywords")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evaluation.keywords.matched && evaluation.keywords.matched.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2 text-green-600">{t("keywordsMatched")}</div>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.keywords.matched.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 border-green-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {evaluation.keywords.missing && evaluation.keywords.missing.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2 text-orange-600">{t("keywordsMissing")}</div>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.keywords.missing.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-orange-50 border-orange-200">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 潜在风险 */}
            {evaluation.risks && evaluation.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600"/>
                    {t("risks")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.risks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0"/>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )
      }
      </div>
  )
}

