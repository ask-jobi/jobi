import React from "react"
import type {
  ResumeData,
  SectionBlock,
  SortableSectionId
} from "@/types/resume"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"
import { cn } from "@/lib/utils"

type ExtractBlock<ID extends SortableSectionId> =
  NonNullable<ResumeData[ID]> extends SectionBlock<infer B> ? B : never

interface SectionBlocksProps<ID extends SortableSectionId> {
  sectionId: ID
  section?: ResumeData[ID] | null
  sectionTitle?: string
  isInteractive?: boolean
  onBlockAdd?: (id: ID, index: number) => void
  onBlockDelete?: (id: ID, index: number) => void
  onBlockClick?: (id: ID, index?: number) => void

  headRender: (block: ExtractBlock<ID>, index: number) => React.ReactNode
  blockRender: (block: ExtractBlock<ID>, index: number) => React.ReactNode

  sectionClassName?: string
  sectionStyle?: React.CSSProperties
  sectionContainerRender?: (children: React.ReactNode) => React.ReactNode
  titleRender?: (title: string) => React.ReactNode

  /** 没有 section 时是否隐藏整个区块 */
  hideIfEmpty?: boolean
  /** 没有 section 时的占位 UI（比如“暂无工作经历”） */
  emptyFallback?: React.ReactNode
}

export function SectionBlocks<ID extends SortableSectionId>({
  sectionId,
  section,
  sectionTitle,
  isInteractive,
  onBlockAdd,
  onBlockDelete,
  onBlockClick,
  headRender,
  blockRender,
  sectionClassName = "",
  sectionStyle,
  sectionContainerRender,
  titleRender,
  hideIfEmpty = true,
  emptyFallback
}: SectionBlocksProps<ID>) {
  if (!section || section.blocks.length === 0) {
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

      {section.blocks.map((block, index) => (
        <ResumeSectionActionButtonGroup
          key={index}
          id={`section-${sectionId}-${index}`}
          className={cn(
            "mb-4 rounded-lg p-2 transition-colors",
            isInteractive && "hover:bg-muted/40 focus-within:bg-muted/40"
          )}
          actionClassName="top-full right-0 mt-2"
          isInteractive={isInteractive}
          onAdd={onBlockAdd ? () => onBlockAdd(sectionId, index) : undefined}
          onDelete={
            onBlockDelete ? () => onBlockDelete(sectionId, index) : undefined
          }
          onEdit={
            onBlockClick ? () => onBlockClick(sectionId, index) : undefined
          }
        >
          <div id={`${sectionId}-${index}-head`}>
            {headRender(block as ExtractBlock<ID>, index)}
          </div>
          {blockRender(block as ExtractBlock<ID>, index)}
        </ResumeSectionActionButtonGroup>
      ))}
    </div>
  )

  return sectionContainerRender ? sectionContainerRender(content) : content
}
