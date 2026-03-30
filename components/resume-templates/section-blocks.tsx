// SectionBlocks.tsx（改造版）
import React from "react"
import type {
  ResumeData,
  SectionBlock,
  SortableSectionId
} from "@/types/resume"

type ExtractBlock<ID extends SortableSectionId> =
  NonNullable<ResumeData[ID]> extends SectionBlock<infer B> ? B : never

interface SectionBlocksProps<ID extends SortableSectionId> {
  sectionId: ID
  section?: ResumeData[ID] | null
  sectionTitle?: string
  isInteractive?: boolean
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
      className={`mb-5 p-2 ${sectionClassName}`}
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
        <div
          key={index}
          id={`section-${sectionId}-${index}`}
          className={`mb-4 ${
            isInteractive ? "hover:bg-gray-200 cursor-pointer" : ""
          }`}
          onClick={() => {
            if (isInteractive) {
              onBlockClick?.(sectionId, index)
            }
          }}
          tabIndex={isInteractive ? 0 : undefined}
        >
          <div id={`${sectionId}-${index}-head`}>
            {headRender(block as ExtractBlock<ID>, index)}
          </div>
          {blockRender(block as ExtractBlock<ID>, index)}
        </div>
      ))}
    </div>
  )

  return sectionContainerRender ? sectionContainerRender(content) : content
}
