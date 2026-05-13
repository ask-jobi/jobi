"use client"

import React from "react"
import type { Locale } from "@/lib/i18n/config"
import type { ResumeData, SectionId, SortableSectionId } from "@/types/resume"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"
import { SectionBlocks } from "@/components/resume-templates/section-blocks"
import "./default-template.css"
import ResumeSkeleton from "../skeletons/resume-skeleton"
import { TemplateOptions } from "@/lib/templates/registry"
import { getSectionLabel } from "@/lib/templates/section-labels"
import { ResumeSectionEditAction } from "@/components/resume-templates/resume-section-edit-action"

interface Props {
  data: ResumeData | null
  language: Locale
  options?: TemplateOptions
}

const renderers: Record<
  SortableSectionId,
  (
    data: ResumeData,
    language: Locale,
    isInteractive?: boolean,
    onSectionClick?: (id: SectionId, index?: number) => void
  ) => React.ReactElement | null
> = {
  education: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="education"
      sectionId="education"
      section={data.education}
      sectionTitle={getSectionLabel("education", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  employment: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="employment"
      sectionId="employment"
      section={data.employment}
      sectionTitle={getSectionLabel("employment", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  skills: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="skills"
      sectionId="skills"
      section={data.skills}
      sectionTitle={getSectionLabel("skills", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
      headRender={(block) => (
        <h3 className="text-sm font-bold mb-1">{block.group}</h3>
      )}
      blockRender={(block) => (
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
  research: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="research"
      sectionId="research"
      section={data.research}
      sectionTitle={getSectionLabel("research", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  projects: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="projects"
      sectionId="projects"
      section={data.projects}
      sectionTitle={getSectionLabel("projects", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={(block) => <MarkdownRender markdown={block.content} />}
    />
  ),
  publications: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="publications"
      sectionId="publications"
      section={data.publications}
      sectionTitle={getSectionLabel("publications", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={() => null}
    />
  ),
  awards: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="awards"
      sectionId="awards"
      section={data.awards}
      sectionTitle={getSectionLabel("awards", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={(block) =>
        block.description && <MarkdownRender markdown={block.description} />
      }
    />
  ),
  certifications: (data, language, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="certifications"
      sectionId="certifications"
      section={data.certifications}
      sectionTitle={getSectionLabel("certifications", language)}
      isInteractive={isInteractive}
      onBlockClick={onSectionClick}
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
      blockRender={() => null}
    />
  )
}

export const DefaultTemplate: React.FC<Props> = ({
  data,
  language,
  options
}) => {
  const { onSectionClick, isInteractive } = options ?? {}
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
      <div
        className={
          isInteractive
            ? "group/resume-section relative rounded-xl p-3 transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
            : ""
        }
      >
        {isInteractive && onSectionClick && (
          <ResumeSectionEditAction
            className="-right-26"
            onClick={() => onSectionClick("personalInfo")}
          />
        )}
        <h1 className="text-2xl font-bold mb-1">
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </h1>
        <p className="text-sm text-gray-600">{data.personalInfo.email}</p>
        <p className="text-sm text-gray-600">{data.personalInfo.phone}</p>
      </div>

      {/* Dynamic Sections based on sectionOrder */}
      {data.sectionOrder.map((sectionId) =>
        renderers[sectionId]?.(data, language, isInteractive, onSectionClick)
      )}
    </article>
  )
}
