"use client"

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type ProgressType = {
  step: string
  status: string
  error?: string
}

type StepStatus = "pending" | "loading" | "success" | "error";

interface Step {
  id: string;
  status: StepStatus;
}

interface ResumeAnalyzeProps {
  progress: ProgressType
}

// 定义步骤列表
const initialSteps: Step[] = [
  { id: "upload", status: "pending" },
  { id: "load", status: "pending" },
  { id: "parse", status: "pending" },
  { id: "prepare", status: "pending" },
  { id: "evaluate", status: "pending" }
];

// 单个步骤项组件
function StepItem({ title, status }: { title: string; status: StepStatus }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-4 py-3 transition-all duration-300 relative overflow-hidden",
        status === "pending" && "text-accent",
        status === "loading" && "text-primary/75 bg-primary/10 border border-primary/20 animate-shimmer shadow-sm",
        status === "success" && "text-green-600/75",
        status === "error" && "text-red-500/75"
      )}
    >
      <div className="relative z-10 flex items-center gap-3 w-full">
        {status === "loading" && (
          <Loader2 className="h-5 w-5 animate-spin text-primary/75"/>
        )}
        {status === "success" && (
          <CheckCircle className="h-5 w-5"/>
        )}
        {status === "error" && (
          <XCircle className="h-5 w-5"/>
        )}
        {status === "pending" && (
          <div className="h-2 w-2 rounded-full bg-accent"/>
        )}

        <span className="text-sm font-medium flex-1">
          {title}
        </span>
      </div>
    </div>
  );
}

export default function ResumeAnalyzeProgress({progress}: ResumeAnalyzeProps) {
  const t = useTranslations("form.progress");
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const containerRef = useRef<HTMLDivElement>(null);
  const {step: currentStepId, status: currentStatus, error} = progress;

  // 根据后端返回的 step 和 status 更新步骤状态
  useEffect(() => {
    setSteps((prevSteps) => {
      const newSteps = prevSteps.map(s => ({...s}));

      // 如果检测到错误，找到当前正在 loading 的步骤并设置为 error
      if (error !== undefined) {
        // 优先使用 currentStepId，如果没有则找当前 loading 的步骤
        let errorStepIndex = -1;
        if (currentStepId) {
          errorStepIndex = newSteps.findIndex((s) => s.id === currentStepId);
        }
        if (errorStepIndex < 0) {
          errorStepIndex = newSteps.findIndex((s) => s.status === "loading");
        }
        if (errorStepIndex >= 0) {
          newSteps[errorStepIndex].status = "error";
        }
        // 停止后续步骤的执行
        return newSteps;
      }

      // 如果没有 step 信息，保持当前状态
      if (!currentStepId || !currentStatus) {
        return newSteps;
      }

      // 找到对应的步骤
      const stepIndex = newSteps.findIndex((s) => s.id === currentStepId);
      if (stepIndex < 0) {
        return newSteps;
      }

      // 更新当前步骤的状态
      newSteps[stepIndex].status = currentStatus as StepStatus

      // 确保串行执行：如果之前的步骤有错误，停止执行
      for (let i = 0; i < newSteps.length; i++) {
        if (i > 0 && newSteps[i - 1].status === "error") {
          if (newSteps[i].status === "loading") {
            newSteps[i].status = "pending";
          }
        }
      }

      return newSteps;
    });
  }, [currentStepId, currentStatus, error]);

  // 自动滚动到当前 loading 的步骤
  const activeIndex = steps.findIndex((s) => s.status === "loading");
  useEffect(() => {
    if (activeIndex < 0) return;

    const container = containerRef.current;
    if (!container) return;

    const item = container.children[activeIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeIndex]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3 scroll-smooth"
      >
        {steps.map((step) => (
          <StepItem
            key={step.id}
            title={t(step.id)}
            status={step.status}
          />
        ))}
      </div>
    </div>
  );
}
