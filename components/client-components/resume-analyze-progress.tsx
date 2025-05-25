"use client"

import {Progress} from "@/components/ui/progress";

export type ProgressType = [number, string, string?]

interface ResumeAnalyzeProps {
  progress: ProgressType
}

export default function ResumeAnalyzeProgress({ progress }: ResumeAnalyzeProps) {

  return (
    <div className="space-y-4">
      <Progress value={progress[0]} />
      <p className="text-sm text-muted-foreground text-center">{progress[1]}</p>
    </div>
  );
}
