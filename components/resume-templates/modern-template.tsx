"use client"

import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeData } from "@/types/resume"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"
import { SectionEntries } from "@/components/resume-templates/section-entries"
import ResumeSkeleton from "@/components/skeletons/resume-skeleton"
import { TemplateOptions } from "@/lib/templates/registry"
import { getSectionLabel } from "@/lib/templates/section-labels"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"

interface Props {
  data: ResumeData | null
  language: Locale
  options?: TemplateOptions
}

export const ModernTemplate: React.FC<Props> = ({
  data,
  language,
  options
}) => {
  const { onSectionClick, onEntryAdd, onEntryDelete, isInteractive } =
    options ?? {}
  if (!data) {
    return (
      <div className="w-full flex justify-center items-start py-4">
        <ResumeSkeleton />
      </div>
    )
  }

  return (
    <article id="resume" data-resume-ready="true" className="bg-white p-8 pdf">
      {/* Header */}
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
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{data.personalInfo.email}</span>
          <span>{data.personalInfo.phone}</span>
          {data.personalInfo.linkedin && (
            <span>LinkedIn: {data.personalInfo.linkedin}</span>
          )}
          {data.personalInfo.website && (
            <span>Website: {data.personalInfo.website}</span>
          )}
        </div>
      </ResumeSectionActionButtonGroup>

      {/* Education */}
      <SectionEntries
        sectionId="education"
        section={data.education}
        sectionTitle={getSectionLabel("education", language)}
        isInteractive={isInteractive}
        onEntryAdd={onEntryAdd}
        onEntryDelete={onEntryDelete}
        onEntryClick={onSectionClick}
        sectionClassName="modern-section"
        headRender={(block) => (
          <div className="flex justify-between items-baseline mb-1">
            <h3 className="text-lg font-semibold text-gray-800">
              {block.school}
            </h3>
            <span className="text-sm text-gray-500 font-medium">
              {block.start} - {block.end}
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

      {/* Employment（可能为空） */}
      <SectionEntries
        sectionId="employment"
        section={data.employment}
        sectionTitle={getSectionLabel("employment", language)}
        isInteractive={isInteractive}
        onEntryAdd={onEntryAdd}
        onEntryDelete={onEntryDelete}
        onEntryClick={onSectionClick}
        sectionClassName="modern-section"
        hideIfEmpty
        emptyFallback={
          <div className="border border-dashed rounded-md p-3 text-sm text-gray-500">
            还没有工作经历？
            <button
              className="ml-2 text-primary underline"
              onClick={() => onSectionClick?.("employment")}
            >
              点击添加
            </button>
          </div>
        }
        headRender={(block) => (
          <div className="flex justify-between items-baseline mb-1">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {block.company}
              </h3>
              <p className="text-sm text-gray-600">{block.jobTitle}</p>
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {block.start} - {block.end}
            </span>
          </div>
        )}
        entryRender={(block) => <MarkdownRender markdown={block.content} />}
      />

      {/* Skills */}
      <SectionEntries
        sectionId="skills"
        section={data.skills}
        sectionTitle={getSectionLabel("skills", language)}
        isInteractive={isInteractive}
        onEntryAdd={onEntryAdd}
        onEntryDelete={onEntryDelete}
        onEntryClick={onSectionClick}
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
    </article>
  )
}
