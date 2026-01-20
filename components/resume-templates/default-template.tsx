import { ResumeData } from "@/types/resume"
import { BaseTemplate } from "./base-template"
import "./default-template.css"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender"

export class DefaultTemplate extends BaseTemplate {
  name = "Default"

  constructor(data: ResumeData, isInteractive?: boolean) {
    super(data, isInteractive)
  }

  renderHeader() {
    const { data } = this
    return (
      <div className="">
        <h1 className="text-2xl font-bold mb-1">
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </h1>
        <p className="text-sm text-gray-600 mb-0.5">
          {data.personalInfo.email}
        </p>
        <p className="text-sm text-gray-600 mb-0.5">
          {data.personalInfo.phone}
        </p>
      </div>
    )
  }

  renderEducation() {
    return this.renderSectionBlocks({
      sectionId: "education",
      headRender: (block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.school}</h3>
            <span className="text-sm text-gray-600">
              {block.start} - {this.localizePresent(block.end)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{block.degree}</p>
        </>
      ),
      blockRender: (block) => <MarkdownRender markdown={block.content} />
    })
  }

  renderEmployment() {
    return this.renderSectionBlocks({
      sectionId: "employment",
      headRender: (block) => (
        <>
          <div className="flex justify-between mb-0.5">
            <h3 className="text-base font-bold">{block.company}</h3>
            <span className="text-sm text-gray-600">
              {block.start} - {this.localizePresent(block.end)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{block.jobTitle}</p>
        </>
      ),
      blockRender: (block) => <MarkdownRender markdown={block.content} />
    })
  }

  renderSkills() {
    return this.renderSectionBlocks({
      sectionId: "skills",
      headRender: (block) => (
        <h3 className="text-sm font-bold mb-1">{block.group}</h3>
      ),
      blockRender: (block) => (
        <div className="flex flex-wrap">
          {block.content?.split(",").map((item: string, itemIndex: number) => (
            <span
              key={`tag-${itemIndex}`}
              className="text-xs bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1"
            >
              {item.trim()}
            </span>
          ))}
        </div>
      )
    })
  }
}
