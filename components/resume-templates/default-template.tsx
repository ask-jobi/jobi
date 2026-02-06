"use client"

import React from "react"
import type { ResumeData, SortableSectionId } from "@/types/resume"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"
import { SectionBlocks } from "@/components/resume-templates/section-blocks"
import "./default-template.css"
import ResumeSkeleton from "../skeletons/resume-skeleton"
import { TemplateOptions } from "@/lib/templates/registry"

interface Props {
  data: ResumeData | null
  options?: TemplateOptions
}

const renderers: Record<
  SortableSectionId,
  (
    data: ResumeData,
    isInteractive?: boolean,
    onSectionClick?: (id: keyof ResumeData, index?: number) => void
  ) => React.ReactElement | null
> = {
  education: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="education"
      sectionId="education"
      section={data.education}
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
  employment: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="employment"
      sectionId="employment"
      section={data.employment}
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
  skills: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="skills"
      sectionId="skills"
      section={data.skills}
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
  research: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="research"
      sectionId="research"
      section={data.research}
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
  projects: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="projects"
      sectionId="projects"
      section={data.projects}
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
  publications: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="publications"
      sectionId="publications"
      section={data.publications}
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
  awards: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="awards"
      sectionId="awards"
      section={data.awards}
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
  certifications: (data, isInteractive, onSectionClick) => (
    <SectionBlocks
      key="certifications"
      sectionId="certifications"
      section={data.certifications}
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

export const DefaultTemplate: React.FC<Props> = ({ data, options }) => {
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
        onClick={() => onSectionClick?.("personalInfo")}
        className={isInteractive ? "hover:bg-gray-200 cursor-pointer" : ""}
      >
        <h1 className="text-2xl font-bold mb-1">
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </h1>
        <p className="text-sm text-gray-600">{data.personalInfo.email}</p>
        <p className="text-sm text-gray-600">{data.personalInfo.phone}</p>
      </div>

      {/* Dynamic Sections based on sectionOrder */}
      {data.sectionOrder.map((sectionId) =>
        renderers[sectionId]?.(data, isInteractive, onSectionClick)
      )}
    </article>
  )
}
