"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ResumeData } from '@/types/resume'
import { Trophy, Loader2, Download } from 'lucide-react'
import { useResume } from '@/lib/store/resume'
import { useFormContext } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { TourStep, useTour } from '@/components/tour'
import SuggestionPatch from '@/components/client-components/suggestion-patch'
import type { AISuggestion } from '@/types/resume'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  evaluateResumeObjective,
  EvaluationResult,
  ModuleEvaluationReport,
  ResumeEvaluationReport
} from "@/lib/evaluation";

type EvaluationResultDisplay = {
  blockName: string
} & EvaluationResult

const extractIssueBlockName = (resumeData: ResumeData, module: ModuleEvaluationReport): string => {
  switch (module.module) {
    case "personalInfo":
      return resumeData["personalInfo"].firstName + resumeData["personalInfo"].lastName
    case "employment":
      return resumeData["employment"]?.blocks[module.index].company ?? "Employment Name"
    case "education":
      return resumeData["education"].blocks[module.index].school
    case "skills":
      return resumeData["skills"].blocks[module.index].group
    default:
      return "None"
  }
}

function extractObjectiveStats(resumeData: ResumeData, report?: ResumeEvaluationReport) {
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

export interface FloatingButtonGroupProps {
  resumeData: ResumeData
}

export function FloatingButtonGroup({ resumeData }: FloatingButtonGroupProps) {
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<number | undefined>(undefined)
  const { application, isLoading, setLoading: setGlobalLoading } = useResume()
  const { getValues, setValue } = useFormContext<ResumeData>()
  const router = useRouter()
  const { setSteps, startTour } = useTour()

  useEffect(() => {
    async function fetchScore() {
      try {
        setLoading(true)
        const report: ResumeEvaluationReport = await evaluateResumeObjective(resumeData)
        const {percent} = extractObjectiveStats(resumeData, report)
        setScore(percent)
      } catch (error) {
        console.error('Failed to fetch resume score:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchScore()
  }, [resumeData])

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-500'
    if (score < 30) return 'bg-red-500'
    if (score < 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const handleExport = () => {
    const currentResumeData = getValues()
    sessionStorage.setItem('printResumeData', JSON.stringify(currentResumeData))
    router.push('/resume-print')
  }

  const handleFullResumeOptimizing = async () => {
    try {
      setGlobalLoading(true)
      const result = await fetch(`/api/resume/full-suggestion?jobApplicationId=${application.id}`)
      if (!result.ok) {
        throw new Error(await result.text())
      }
      const suggestions = await result.json()

      const steps: TourStep[] = suggestions.map((item: AISuggestion) => ({
        content: () => <SuggestionPatch section={item} getValues={getValues} setValue={setValue} />,
        selectorId: `${item.section}-${item.blockIndex}-head`,
      }))
      setSteps(steps)
      startTour()
    } catch (e: any) {
      toast.error(e.toString())
    } finally {
      setGlobalLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 z-50">
      {/* 第一个按钮：显示简历得分 */}
      <Button
        className={`rounded-full w-12 h-12 flex flex-col items-center justify-center gap-1 ${getScoreColor(score)} hover:${getScoreColor(score)}/75 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer`}
        disabled={loading}
        title={score !== undefined ? `简历得分: ${score}分` : '加载中...'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-bold">{score ?? '--'}</span>
          </>
        )}
      </Button>

      {/* Export 按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={handleExport}
        disabled={isLoading}
        title="导出简历"
      >
        <Download className="w-5 h-5" />
      </Button>

      {/* AI Optimize 按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={handleFullResumeOptimizing}
        disabled={isLoading}
        title="AI 优化"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Image src="/gemini-color.svg" alt="Gemini" width={20} height={20} />
        )}
      </Button>
    </div>
  )
}

