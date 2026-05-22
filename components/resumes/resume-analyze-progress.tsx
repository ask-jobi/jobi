"use client"

import { useEffect, useRef } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export type StepStatus = "pending" | "loading" | "success" | "error"

export interface StepState {
  id: string
  status: StepStatus
}

export interface ResumeAnalyzeProgressProps {
  steps: StepState[]
}

// 定义新的步骤列表（与 orchestrator 步骤顺序一致）
export const INTAKE_STEPS: StepState[] = [
  { id: "extract", status: "pending" },
  { id: "parse", status: "pending" },
  { id: "upload", status: "pending" },
  { id: "persist", status: "pending" },
  { id: "evaluate", status: "pending" }
]

// 单个步骤项组件
function StepItem({ title, status }: { title: string; status: StepStatus }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-4 py-3 transition-all duration-300 relative overflow-hidden",
        status === "pending" && "text-muted-foreground/80",
        status === "loading" &&
          "text-primary/75 bg-primary/10 border border-primary/20 animate-shimmer shadow-sm",
        status === "success" && "text-green-600/75",
        status === "error" && "text-red-500/75"
      )}
    >
      <div className="relative z-10 flex items-center gap-3 w-full">
        {status === "loading" && (
          <Loader2 className="h-5 w-5 animate-spin text-primary/75" />
        )}
        {status === "success" && <CheckCircle className="h-5 w-5" />}
        {status === "error" && <XCircle className="h-5 w-5" />}
        {status === "pending" && (
          <div className="h-2 w-2 rounded-full bg-muted-foreground/80" />
        )}

        <span className="text-sm font-medium flex-1">{title}</span>
      </div>
    </div>
  )
}

export default function ResumeAnalyzeProgress({
  steps
}: ResumeAnalyzeProgressProps) {
  const t = useTranslations("form.progress")
  const containerRef = useRef<HTMLDivElement>(null)

  // 自动滚动到当前 loading 的步骤
  const activeIndex = steps.findIndex((s) => s.status === "loading")
  useEffect(() => {
    if (activeIndex < 0) return

    const container = containerRef.current
    if (!container) return

    const item = container.children[activeIndex] as HTMLElement
    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [activeIndex])

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3 scroll-smooth"
      >
        {steps.map((step) => (
          <StepItem key={step.id} title={t(step.id)} status={step.status} />
        ))}
      </div>
    </div>
  )
}
