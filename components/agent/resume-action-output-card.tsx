"use client"

import { cn } from "@/lib/utils"
import type {
  ResumeEditorModifyOutput,
  ResumeEditorReorderOutput
} from "@/types/chat"
import { useTranslations } from "next-intl"
import { Plus, Trash2, ArrowUpDown, ArrowUp, PencilLine } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ResumeActionOutputCardProps {
  output: ResumeEditorModifyOutput | ResumeEditorReorderOutput
  className?: string
}

function getInlineDiff(
  original: string,
  modified: string
): { text: string; type: "added" | "removed" | "unchanged" }[] {
  const originalLines = original.split("\n")
  const modifiedLines = modified.split("\n")
  const result: { text: string; type: "added" | "removed" | "unchanged" }[] = []

  const maxLen = Math.max(originalLines.length, modifiedLines.length)

  for (let i = 0; i < maxLen; i++) {
    const origLine = originalLines[i] ?? ""
    const modLine = modifiedLines[i] ?? ""

    if (origLine === modLine) {
      if (origLine) {
        result.push({ text: origLine, type: "unchanged" })
      }
    } else {
      if (origLine) {
        result.push({ text: origLine, type: "removed" })
      }
      if (modLine) {
        result.push({ text: modLine, type: "added" })
      }
    }
  }

  return result
}

function RewriteCard({
  output,
  t
}: {
  output: Extract<ResumeEditorModifyOutput, { operation: "rewrite" }>
  t: ReturnType<typeof useTranslations>
}) {
  const diff = getInlineDiff(String(output.originalValue), output.value)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <PencilLine className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">
          {t(`toolOutput.entity.${output.entity}` as any)}
        </span>
        <Badge variant="outline" className="text-xs">
          {output.field}
        </Badge>
      </div>
      <div className="bg-muted/30 rounded-lg p-3 text-sm font-mono">
        {diff.map((item, index) => (
          <span
            key={index}
            className={cn(
              item.type === "added" &&
                "bg-green-500/20 text-green-700 dark:text-green-400 px-0.5 rounded",
              item.type === "removed" &&
                "bg-red-500/20 text-red-700 dark:text-red-400 line-through px-0.5 rounded"
            )}
          >
            {item.text}
            {index < diff.length - 1 && "\n"}
          </span>
        ))}
      </div>
    </div>
  )
}

function DeleteCard({
  output,
  t
}: {
  output: Extract<ResumeEditorModifyOutput, { operation: "delete" }>
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div className="flex items-center gap-2">
      <Trash2 className="w-4 h-4 text-red-500" />
      <Badge variant="destructive" className="text-xs">
        {t("toolOutput.deleted")}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {t(`toolOutput.entity.${output.entity}` as any)}
      </span>
    </div>
  )
}

function AddCard({
  output,
  t
}: {
  output: Extract<ResumeEditorModifyOutput, { operation: "add" }>
  t: ReturnType<typeof useTranslations>
}) {
  return (
    <div className="flex items-center gap-2">
      <Plus className="w-4 h-4 text-green-500" />
      <Badge className="text-xs bg-green-500">{t("toolOutput.added")}</Badge>
      <span className="text-sm text-muted-foreground">
        {t(`toolOutput.entity.${output.entity}` as any)}
      </span>
    </div>
  )
}

function ReorderBlocksCard({
  output,
  t
}: {
  output: ResumeEditorReorderOutput
  t: ReturnType<typeof useTranslations>
}) {
  const original = output.originalValue as string[]
  const ordered = output.orderedBlockIds

  if (output.operation !== "reorderBlocks" || !ordered) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium">
          {t("toolOutput.reorderBlocks")}{" "}
          {t(`toolOutput.entity.${output.entity}` as any)}
        </span>
      </div>
    </div>
  )
}

function ReorderSectionsCard({
  output,
  t
}: {
  output: ResumeEditorReorderOutput
  t: ReturnType<typeof useTranslations>
}) {
  const original = output.originalValue as string[]
  const ordered = output.orderedSectionIds

  if (output.operation !== "reorderSections" || !ordered) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ArrowUp className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium">
          {t("toolOutput.reorderSections")}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <div className="flex gap-1">
          {original.map((section: string) => (
            <Badge key={section} variant="outline" className="text-xs">
              {t(`toolOutput.section.${section}` as any)}
            </Badge>
          ))}
        </div>
        <ArrowUp className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {ordered.map((section: string) => (
            <Badge key={section} variant="secondary" className="text-xs">
              {t(`toolOutput.section.${section}` as any)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ResumeActionOutputCard({
  output,
  className
}: ResumeActionOutputCardProps) {
  const t = useTranslations("chat")

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", className)}>
      <div className="p-4">
        {output.operation === "rewrite" && (
          <RewriteCard output={output} t={t} />
        )}
        {output.operation === "delete" && <DeleteCard output={output} t={t} />}
        {output.operation === "add" && <AddCard output={output} t={t} />}
        {output.operation === "reorderBlocks" && (
          <ReorderBlocksCard output={output} t={t} />
        )}
        {output.operation === "reorderSections" && (
          <ReorderSectionsCard output={output} t={t} />
        )}
      </div>
    </div>
  )
}
