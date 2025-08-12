"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import type { ResumeData } from '@/types/resume'
import {
  ResumeEvaluationReport,
  ModuleEvaluationReport,
  EvaluationResult,
  evaluateResumeSubjective
} from '@/lib/evaluation'
import { evaluateResumeObjective } from '@/lib/evaluation'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'

export interface ResumeEvaluationProgressProps {
  resumeData: ResumeData
}

function getIndicatorColorClass(value: number): string {
  if (value < 30) return 'bg-red-500'
  if (value < 70) return 'bg-orange-400'
  return 'bg-green-500'
}

function extractObjectiveStats(report?: ResumeEvaluationReport) {
  const allObjective: EvaluationResult[] = []
  if (report?.modules?.length) {
    report.modules.forEach((m: ModuleEvaluationReport) => {
      m.results.forEach((r) => {
        if (r.type === 'objective') allObjective.push(r)
      })
    })
  }
  const total = allObjective.length
  const passed = allObjective.filter(r => r.passed).length
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0

  const issues = allObjective.filter(r => !r.passed)

  return { percent, issues, total }
}

export function ResumeEvaluationProgress({
  resumeData
}: ResumeEvaluationProgressProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ResumeEvaluationReport | undefined>(undefined)
  const [showIssues, setShowIssues] = useState(false)

  useEffect(() => {
    async function run() {
      try {
        setLoading(true)
        const res = await evaluateResumeObjective(resumeData)
        setReport(res)
      } catch (e) {
        console.error("evaluate resume error: ", e)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [resumeData])

  const { percent, issues } = useMemo(() => extractObjectiveStats(report), [report])

  const indicatorClassName = getIndicatorColorClass(percent)

  const subjectiveEvaluate = async () => {
    const report = await evaluateResumeSubjective(resumeData)
    console.log("report: ", report)
  }

  return (
    <div className="w-full bg-white rounded-lg border shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-gray-700">
          Evaluation
        </div>
        <div className="flex-1">
          <Progress value={percent} showAnimate={loading} indicatorClassName={indicatorClassName} />
        </div>
        <div className="min-w-10 text-right text-sm font-semibold tabular-nums">
          {percent}%
        </div>
        <Button onClick={subjectiveEvaluate}>Subjective Evaluate</Button>
      </div>

      {/* Issues 列表 - 默认隐藏，可展开 */}
      {issues.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <button
            onClick={() => setShowIssues(!showIssues)}
            className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Issues ({issues.length})
            {showIssues ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showIssues && (
            <ul className="mt-3 space-y-2">
              {issues.map((r, idx) => (
                <li key={`i-${idx}`} className="text-sm text-gray-600 bg-amber-50 rounded-md p-3 border border-amber-200">
                  <div className="font-medium text-amber-800 mb-1">{r.ruleName}</div>
                  {r.suggestion ? (
                    <div className="text-amber-700">{r.suggestion}</div>
                  ) : r.message ? (
                    <div className="text-amber-700">{r.message}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
