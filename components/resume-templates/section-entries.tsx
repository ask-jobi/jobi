import React from "react"
import type {
  ResumeData,
  SortableSectionKey,
  ResumeSection
} from "@/types/resume"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"
import { cn } from "@/lib/utils"

type ExtractEntry<ID extends SortableSectionKey> =
  NonNullable<ResumeData[ID]> extends ResumeSection<infer Entry> ? Entry : never

interface SectionEntriesProps<ID extends SortableSectionKey> {
  sectionId: ID
  section?: ResumeData[ID] | null
  sectionTitle?: string
  isInteractive?: boolean
  onEntryAdd?: (id: ID, index: number) => void
  onEntryDelete?: (id: ID, index: number) => void
  onEntryClick?: (id: ID, index?: number) => void

  headRender: (entry: ExtractEntry<ID>, index: number) => React.ReactNode
  entryRender: (entry: ExtractEntry<ID>, index: number) => React.ReactNode

  sectionClassName?: string
  sectionStyle?: React.CSSProperties
  sectionContainerRender?: (children: React.ReactNode) => React.ReactNode
  titleRender?: (title: string) => React.ReactNode

  /** 没有 section 时是否隐藏整个区块 */
  hideIfEmpty?: boolean
  /** 没有 section 时的占位 UI（比如“暂无工作经历”） */
  emptyFallback?: React.ReactNode
}

export function SectionEntries<ID extends SortableSectionKey>({
  sectionId,
  section,
  sectionTitle,
  isInteractive,
  onEntryAdd,
  onEntryDelete,
  onEntryClick,
  headRender,
  entryRender,
  sectionClassName = "",
  sectionStyle,
  sectionContainerRender,
  titleRender,
  hideIfEmpty = true,
  emptyFallback
}: SectionEntriesProps<ID>) {
  if (!section || section.entries.length === 0) {
    if (hideIfEmpty) return null
    return emptyFallback ? (
      <div className="mb-5 p-2 text-sm text-gray-400">{emptyFallback}</div>
    ) : null
  }

  const content = (
    <div
      id={`section-${sectionId}`}
      className={cn("mb-5 rounded-xl p-3", sectionClassName)}
      style={sectionStyle}
    >
      {titleRender ? (
        titleRender(sectionTitle ?? section.title)
      ) : (
        <h2 className="text-lg font-bold mb-2">
          {sectionTitle ?? section.title}
        </h2>
      )}

      {section.entries.map((entry, index) => (
        <ResumeSectionActionButtonGroup
          key={index}
          id={`section-${sectionId}-${index}`}
          className={cn(
            "mb-4 rounded-lg p-2 transition-colors",
            isInteractive && "hover:bg-muted/40 focus-within:bg-muted/40"
          )}
          actionClassName="top-full right-0 mt-2"
          isInteractive={isInteractive}
          onAdd={onEntryAdd ? () => onEntryAdd(sectionId, index) : undefined}
          onDelete={
            onEntryDelete ? () => onEntryDelete(sectionId, index) : undefined
          }
          onEdit={
            onEntryClick ? () => onEntryClick(sectionId, index) : undefined
          }
        >
          <div id={`${sectionId}-${index}-head`}>
            {headRender(entry as ExtractEntry<ID>, index)}
          </div>
          {entryRender(entry as ExtractEntry<ID>, index)}
        </ResumeSectionActionButtonGroup>
      ))}
    </div>
  )

  return sectionContainerRender ? sectionContainerRender(content) : content
}
