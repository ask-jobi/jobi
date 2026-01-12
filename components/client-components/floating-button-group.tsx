"use client"

import React, {useState} from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Loader2, Download } from 'lucide-react'
import { openRightPanelAtom, useResume } from '@/lib/store/resume'
import { useFormContext } from 'react-hook-form'
import SuggestionPatch from '@/components/client-components/suggestion-patch'
import type { AISuggestion, ResumeData } from '@/types/resume'
import { toast } from 'sonner'
import Image from 'next/image'
import { useSetAtom } from 'jotai'
import { trackClickAiFullSuggestion, trackExportResume } from '@/lib/user-tracking/user-tracking'
import {TourStep, useTour } from './tour'
import {useTranslations} from "next-intl";


export function FloatingButtonGroup() {
  const t = useTranslations()
  const { application, isLoading, setLoading: setGlobalLoading, resumeEvaluation } = useResume()
  const openRightPanel = useSetAtom(openRightPanelAtom);
  const { getValues, setValue } = useFormContext<ResumeData>()
  const { setSteps, startTour } = useTour()
  const [exportLoading, setExportLoading] = useState<boolean>(false)


  const handleExport = async () => {
    trackExportResume()
    try {
      setExportLoading(true)
      const response = await fetch(`/api/resume/print?id=${application.resume.id}`);
      if (!response.ok) {
        toast.error(t("exportResumeError"))
        return
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(`${t("exportResumeError")}: ${e}`)
    } finally {
      setExportLoading(false)
    }
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
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all"
        title={t("button.viewEvaluationReport")}
        onClick={() => {
          if (openRightPanel) {
            openRightPanel('evaluation')
          }
        }}
      >
        <Trophy className="w-5 h-5" />
      </Button>

      {/* Export 按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={handleExport}
        disabled={isLoading || exportLoading}
        title={t("button.exportResume")}
      >
        {
          exportLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )
        }
      </Button>

      {/* AI Optimize 按钮 */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all"
        onClick={handleFullResumeOptimizing}
        disabled={isLoading}
        title={t("button.aiOptimize")}
      >
        {
          isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Image src="/gemini-color.svg" alt="Gemini" width={20} height={20} />
          )
        }
      </Button>
    </div>
  )
}

