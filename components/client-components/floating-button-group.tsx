"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ResumeData } from '@/types/resume'
import { Trophy, Loader2 } from 'lucide-react'

export interface FloatingButtonGroupProps {
  resumeData: ResumeData
}

export function FloatingButtonGroup({ resumeData }: FloatingButtonGroupProps) {
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState<number | undefined>(undefined)

  useEffect(() => {
    async function fetchScore() {
      try {
        setLoading(true)
        // TODO const report: ResumeEvaluationReport = await evaluateResumeObjective(resumeData)
        // setScore(report.overallScore)
        setScore(99)
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

  return (
    <div className="flex flex-col gap-3 z-50">
      {/* 第一个按钮：显示简历得分 */}
      <Button
        className={`rounded-full w-12 h-12 flex flex-col items-center justify-center gap-1 ${getScoreColor(score)} hover:${getScoreColor(score)}/75 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer`}
        disabled={loading}
        title={score !== undefined ? `${score}` : 'Loading...'}
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

      {/* 可以在这里添加更多按钮 */}
    </div>
  )
}

