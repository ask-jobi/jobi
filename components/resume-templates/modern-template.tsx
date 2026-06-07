"use client"

import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type {
  ResumeData,
  ResumeSectionKey,
  SortableSectionKey
} from "@/types/resume"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"
import { SectionEntries } from "@/components/resume-templates/section-entries"
import ResumeSkeleton from "@/components/skeletons/resume-skeleton"
import { type TemplateOptions } from "@/lib/templates/registry"
import { getSectionLabel } from "@/lib/templates/section-labels"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"
import {
  formatDateRange,
  normalizeResumeDateRanges
} from "@/lib/resume/date-ranges"

interface Props {
  data: ResumeData | null
  language: Locale
  options?: TemplateOptions
}

type ModernSectionRenderer = (
  data: ResumeData,
  language: Locale,
  isInteractive?: boolean,
  onEntryAdd?: (id: SortableSectionKey, index: number) => void,
  onEntryDelete?: (id: SortableSectionKey, index: number) => void,
  onSectionClick?: (id: ResumeSectionKey, index?: number) => void,
  onEntryReorder?: (
    id: SortableSectionKey,
    fromIndex: number,
    toIndex: number
  ) => void | Promise<boolean>,
  onSectionMoveUp?: (id: SortableSectionKey) => void | Promise<boolean>,
  onSectionMoveDown?: (id: SortableSectionKey) => void | Promise<boolean>,
  canMoveSectionUp?: boolean,
  canMoveSectionDown?: boolean,
  interactionDisabled?: boolean
) => React.ReactElement | null

const renderers: Partial<Record<SortableSectionKey, ModernSectionRenderer>> = {
  education: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick,
    onEntryReorder,
    onSectionMoveUp,
    onSectionMoveDown,
    canMoveSectionUp,
    canMoveSectionDown,
    interactionDisabled
  ) => (
    <SectionEntries
      key="education"
      sectionId="education"
      section={data.education}
      sectionTitle={getSectionLabel("education", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      onEntryReorder={onEntryReorder}
      onSectionMoveUp={onSectionMoveUp}
      onSectionMoveDown={onSectionMoveDown}
      canMoveSectionUp={canMoveSectionUp}
      canMoveSectionDown={canMoveSectionDown}
      dragDisabled={interactionDisabled}
      sectionClassName="modern-section"
      headRender={(block) => (
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="text-lg font-semibold text-gray-800">
            {block.school}
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            {formatDateRange(block.date)}
          </span>
        </div>
      )}
      entryRender={(block) => (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {block.degree}
          </p>
          <MarkdownRender markdown={block.content} />
        </div>
      )}
    />
  ),
  employment: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick,
    onEntryReorder,
    onSectionMoveUp,
    onSectionMoveDown,
    canMoveSectionUp,
    canMoveSectionDown,
    interactionDisabled
  ) => (
    <SectionEntries
      key="employment"
      sectionId="employment"
      section={data.employment}
      sectionTitle={getSectionLabel("employment", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      onEntryReorder={onEntryReorder}
      onSectionMoveUp={onSectionMoveUp}
      onSectionMoveDown={onSectionMoveDown}
      canMoveSectionUp={canMoveSectionUp}
      canMoveSectionDown={canMoveSectionDown}
      dragDisabled={interactionDisabled}
      sectionClassName="modern-section"
      headRender={(block) => (
        <div className="flex justify-between items-baseline mb-1">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {block.company}
            </h3>
            <p className="text-sm text-gray-600">{block.jobTitle}</p>
          </div>
          <span className="text-sm text-gray-500 font-medium">
            {formatDateRange(block.date)}
          </span>
        </div>
      )}
      entryRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  skills: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick,
    onEntryReorder,
    onSectionMoveUp,
    onSectionMoveDown,
    canMoveSectionUp,
    canMoveSectionDown,
    interactionDisabled
  ) => (
    <SectionEntries
      key="skills"
      sectionId="skills"
      section={data.skills}
      sectionTitle={getSectionLabel("skills", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      onEntryReorder={onEntryReorder}
      onSectionMoveUp={onSectionMoveUp}
      onSectionMoveDown={onSectionMoveDown}
      canMoveSectionUp={canMoveSectionUp}
      canMoveSectionDown={canMoveSectionDown}
      dragDisabled={interactionDisabled}
      sectionClassName="modern-section"
      headRender={(block) => (
        <h3 className="text-xs font-semibold text-gray-800 mb-2 uppercase tracking-wider">
          {block.group}
        </h3>
      )}
      entryRender={(block) => (
        <div className="flex flex-wrap gap-2">
          {block.content?.split(",").map((item, itemIndex) => (
            <span
              key={itemIndex}
              className="text-xs bg-gray-100 px-3 py-1.5 rounded-md text-gray-700 border border-gray-200"
            >
              {item.trim()}
            </span>
          ))}
        </div>
      )}
    />
  )
}

export const ModernTemplate: React.FC<Props> = ({
  data,
  language,
  options
}) => {
  const {
    onSectionClick,
    onEntryAdd,
    onEntryDelete,
    onEntryReorder,
    onSectionMoveUp,
    onSectionMoveDown,
    entryDragDisabled,
    sectionMoveDisabled,
    isInteractive
  } = options ?? {}

  if (!data) {
    return (
      <div className="w-full flex justify-center items-start py-4">
        <ResumeSkeleton />
      </div>
    )
  }

  const normalizedData = normalizeResumeDateRanges(data)
  const interactionDisabled = entryDragDisabled || sectionMoveDisabled
  const visibleSectionIds = normalizedData.sectionOrder.filter((sectionId) => {
    const section = normalizedData[sectionId]
    return !!renderers[sectionId] && !!section && section.entries.length > 0
  })

  return (
    <article id="resume" data-resume-ready="true" className="bg-white p-8 pdf">
      <ResumeSectionActionButtonGroup
        actionClassName="top-full right-0 mt-2"
        className={`mb-6 border-b-2 border-gray-800 pb-4 ${
          isInteractive
            ? "rounded-xl p-3 transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
            : ""
        }`}
        isInteractive={isInteractive}
        onEdit={
          onSectionClick ? () => onSectionClick("personalInfo") : undefined
        }
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {normalizedData.personalInfo.firstName}{" "}
          {normalizedData.personalInfo.lastName}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{normalizedData.personalInfo.email}</span>
          <span>{normalizedData.personalInfo.phone}</span>
          {normalizedData.personalInfo.linkedin && (
            <span>LinkedIn: {normalizedData.personalInfo.linkedin}</span>
          )}
          {normalizedData.personalInfo.website && (
            <span>Website: {normalizedData.personalInfo.website}</span>
          )}
        </div>
      </ResumeSectionActionButtonGroup>

      {normalizedData.sectionOrder.map((sectionId) => {
        const renderer = renderers[sectionId]

        if (!renderer) {
          return null
        }

        const visibleIndex = visibleSectionIds.indexOf(sectionId)

        return renderer(
          normalizedData,
          language,
          isInteractive,
          onEntryAdd,
          onEntryDelete,
          onSectionClick,
          onEntryReorder,
          onSectionMoveUp,
          onSectionMoveDown,
          visibleIndex > 0,
          visibleIndex !== -1 && visibleIndex < visibleSectionIds.length - 1,
          interactionDisabled
        )
      })}
    </article>
  )
}
