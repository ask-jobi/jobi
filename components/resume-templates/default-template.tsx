"use client"

import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type {
  SortableSectionKey,
  ResumeData,
  ResumeSectionKey
} from "@/types/resume"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"
import { SectionEntries } from "@/components/resume-templates/section-entries"
import "./default-template.css"
import ResumeSkeleton from "../skeletons/resume-skeleton"
import { TemplateOptions } from "@/lib/templates/registry"
import { getSectionLabel } from "@/lib/templates/section-labels"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"

interface Props {
  data: ResumeData | null
  language: Locale
  options?: TemplateOptions
}

const renderers: Record<
  SortableSectionKey,
  (
    data: ResumeData,
    language: Locale,
    isInteractive?: boolean,
    onEntryAdd?: (id: SortableSectionKey, index: number) => void,
    onEntryDelete?: (id: SortableSectionKey, index: number) => void,
    onSectionClick?: (id: ResumeSectionKey, index?: number) => void
  ) => React.ReactElement | null
> = {
  education: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
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
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.school}</h3>
            <span className="text-sm text-gray-600">
              {block.start} - {block.end}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{block.degree}</p>
        </>
      )}
      entryRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  employment: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
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
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.company}</h3>
            <span className="text-sm text-gray-600">
              {block.start} - {block.end}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{block.jobTitle}</p>
        </>
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
    onSectionClick
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
      headRender={(block) => (
        <h3 className="text-sm font-bold mb-1">{block.group}</h3>
      )}
      entryRender={(block) => (
        <div className="flex flex-wrap">
          {block.content?.split(",").map((item, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1"
            >
              {item.trim()}
            </span>
          ))}
        </div>
      )}
    />
  ),
  research: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
  ) => (
    <SectionEntries
      key="research"
      sectionId="research"
      section={data.research}
      sectionTitle={getSectionLabel("research", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.title}</h3>
            <span className="text-sm text-gray-600">
              {block.date?.start} - {block.date?.end}
            </span>
          </div>
          {block.role && (
            <p className="text-sm text-gray-600 mb-1">{block.role}</p>
          )}
        </>
      )}
      entryRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  projects: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
  ) => (
    <SectionEntries
      key="projects"
      sectionId="projects"
      section={data.projects}
      sectionTitle={getSectionLabel("projects", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.title}</h3>
            <span className="text-sm text-gray-600">
              {block.date?.start} - {block.date?.end}
            </span>
          </div>
          {block.role && (
            <p className="text-sm text-gray-600 mb-1">{block.role}</p>
          )}
        </>
      )}
      entryRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  publications: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
  ) => (
    <SectionEntries
      key="publications"
      sectionId="publications"
      section={data.publications}
      sectionTitle={getSectionLabel("publications", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.title}</h3>
            <span className="text-sm text-gray-600">{block.date}</span>
          </div>
          {block.description && (
            <p className="text-sm text-gray-600 mb-1">{block.description}</p>
          )}
        </>
      )}
      entryRender={() => null}
    />
  ),
  awards: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
  ) => (
    <SectionEntries
      key="awards"
      sectionId="awards"
      section={data.awards}
      sectionTitle={getSectionLabel("awards", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.title}</h3>
            <span className="text-sm text-gray-600">{block.date}</span>
          </div>
          {block.issuer && (
            <p className="text-sm text-gray-600 mb-1">{block.issuer}</p>
          )}
        </>
      )}
      entryRender={(block) =>
        block.description && <MarkdownRender markdown={block.description} />
      }
    />
  ),
  certifications: (
    data,
    language,
    isInteractive,
    onEntryAdd,
    onEntryDelete,
    onSectionClick
  ) => (
    <SectionEntries
      key="certifications"
      sectionId="certifications"
      section={data.certifications}
      sectionTitle={getSectionLabel("certifications", language)}
      isInteractive={isInteractive}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onSectionClick}
      headRender={(block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.name}</h3>
            <span className="text-sm text-gray-600">{block.date}</span>
          </div>
          {block.issuer && (
            <p className="text-sm text-gray-600 mb-1">{block.issuer}</p>
          )}
        </>
      )}
      entryRender={() => null}
    />
  )
}

export const DefaultTemplate: React.FC<Props> = ({
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
        className={
          isInteractive
            ? "rounded-xl p-3 transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
            : undefined
        }
        isInteractive={isInteractive}
        onEdit={
          onSectionClick ? () => onSectionClick("personalInfo") : undefined
        }
      >
        <h1 className="text-2xl font-bold mb-1">
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </h1>
        <p className="text-sm text-gray-600">{data.personalInfo.email}</p>
        <p className="text-sm text-gray-600">{data.personalInfo.phone}</p>
      </ResumeSectionActionButtonGroup>

      {/* Dynamic Sections based on sectionOrder */}
      {data.sectionOrder.map((sectionId) =>
        renderers[sectionId]?.(
          data,
          language,
          isInteractive,
          onEntryAdd,
          onEntryDelete,
          onSectionClick
        )
      )}
    </article>
  )
}
