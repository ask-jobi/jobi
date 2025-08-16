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

type EvaluationResultDisplay = {
  blockName: string
} & EvaluationResult

function getIndicatorColorClass(value: number): string {
  if (value < 30) return 'bg-red-500'
  if (value < 70) return 'bg-orange-400'
  return 'bg-green-500'
}

const extractIssueBlockName = (resumeData: ResumeData, module: ModuleEvaluationReport): string => {
  switch (module.module) {
    case "personalInfo":
      return resumeData["personalInfo"].firstName + resumeData["personalInfo"].lastName
    case "employment":
      return resumeData["employment"].blocks[module.index].company
    case "education":
      return resumeData["education"].blocks[module.index].school
    case "skills":
      return resumeData["skills"].blocks[module.index].group
    default:
      return "None"
  }
}

function extractObjectiveStats(resumeData: ResumeData, report?: ResumeEvaluationReport) {
  console.log(report)
  const allResults: EvaluationResult[] = []

  const issuesGrouped = new Map<string, EvaluationResultDisplay[]>()

  if (report?.modules?.length) {
    report.modules.forEach((m: ModuleEvaluationReport) => {
      m.results.forEach((r) => {
        allResults.push(r)

        if (!r.passed) {
          const item: EvaluationResultDisplay = {
            blockName: extractIssueBlockName(resumeData, m),
            ...r
          }
          if (issuesGrouped.has(r.ruleName)) {
            issuesGrouped.set(r.ruleName, [...issuesGrouped.get(r.ruleName)!!, item])
          } else {
            issuesGrouped.set(r.ruleName, [item])
          }
        }
      })
    })
  }

  const total = allResults.length
  const passed = allResults.filter(r => r.passed).length
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0

  return { percent, issues: issuesGrouped, total }
}

export function ResumeEvaluationProgress({
  resumeData
}: ResumeEvaluationProgressProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ResumeEvaluationReport | undefined>(undefined)
  const [issueName, setIssueName] = useState<null | string>(null)

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

  const { percent, issues } = useMemo(() => extractObjectiveStats(resumeData, report), [report, resumeData])

  const indicatorClassName = getIndicatorColorClass(percent)

  const subjectiveEvaluate = async () => {
    const report = await evaluateResumeSubjective(resumeData)
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

      {issues.size > 0 && (
        <div className="border-t pt-3 mt-3">
          {
            Array.from(issues.keys()).map(name => (
              <button
                key={name}
                onClick={() => {
                  setIssueName(issueName === name ? null : name)
                }}
                className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                <AlertTriangle className="h-4 w-4"/>
                {name} ({issues.get(name)!!.length})
                {issueName === name ? (
                  <ChevronUp className="h-4 w-4"/>
                ) : (
                  <ChevronDown className="h-4 w-4"/>
                )}
              </button>
            ))
          }

          {issueName && (
            <ul className="mt-3 space-y-2">
              {issues.get(issueName)!!.map((issue, idx) => (
                <li key={`i-${idx}`}
                    className="text-sm text-gray-600 bg-amber-50 rounded-md p-3 border border-amber-200">
                  <div className="font-medium text-amber-800 mb-1">
                    {issue.blockName}
                  </div>
                  {issue.suggestion ? (
                    <div className="text-amber-700">{issue.suggestion}</div>
                  ) : issue.message ? (
                    <div className="text-amber-700">{issue.message}</div>
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
