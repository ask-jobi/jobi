"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Loader2, Download } from 'lucide-react'
import { openRightPanelAtom, useResume } from '@/lib/store/resume'
import { useFormContext } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { TourStep, useTour } from '@/components/tour'
import SuggestionPatch from '@/components/client-components/suggestion-patch'
import type { AISuggestion, ResumeData } from '@/types/resume'
import { toast } from 'sonner'
import Image from 'next/image'
import { useSetAtom } from 'jotai'
import { trackClickAiFullSuggestion, trackExportResume } from '@/lib/user-tracking/user-tracking'


export function FloatingButtonGroup() {
  const { application, isLoading, setLoading: setGlobalLoading, resumeEvaluation } = useResume()
  const openRightPanel = useSetAtom(openRightPanelAtom);
  const { getValues, setValue } = useFormContext<ResumeData>()
  const router = useRouter()
  const { setSteps, startTour } = useTour()

  const score = resumeEvaluation?.matchScore

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-500'
    if (score < 30) return 'bg-red-500'
    if (score < 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const handleExport = () => {
    trackExportResume()
    const currentResumeData = getValues()
    sessionStorage.setItem('printResumeData', JSON.stringify(currentResumeData))
    router.push('/resume-print')
  }

  const handleFullResumeOptimizing = async () => {
    try {
      trackClickAiFullSuggestion()
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
      <Button
        className={`rounded-full w-12 h-12 flex flex-col items-center justify-center gap-1 ${getScoreColor(score)} hover:${getScoreColor(score)}/75 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer`}
        title={score !== undefined ? `Score: ${score}` : 'Loading...'}
        onClick={() => {
          if (openRightPanel) {
            openRightPanel('evaluation')
          }
        }}
      >
        <Trophy className="w-5 h-5" />
        <span className="text-xs font-bold">{score ?? '--'}</span>
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

